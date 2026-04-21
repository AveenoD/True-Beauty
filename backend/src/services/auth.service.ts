import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { hashPassword, comparePassword } from "../utils/password";
import prisma from "../config/database";
import crypto from "crypto";
import { buildResetPasswordHtml, buildVerifyEmailHtml, sendMail } from "../utils/mailer";

const REFRESH_EXPIRY_DAYS = 7;
const EMAIL_VERIFY_EXPIRY_HOURS = 24;
const PASSWORD_RESET_EXPIRY_HOURS = 1;

function getTokenExpiry(type: "access" | "refresh" | "email_verify"): Date {
  const now = new Date();
  if (type === "access") {
    return new Date(now.getTime() + 15 * 60 * 1000);
  }
  if (type === "email_verify") {
    return new Date(now.getTime() + EMAIL_VERIFY_EXPIRY_HOURS * 60 * 60 * 1000);
  }
  return new Date(
    now.getTime() + REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  );
}

function getPasswordResetExpiry(): Date {
  return new Date(Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000);
}

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  referralCode?: string;
}) {
  const email = data.email.trim().toLowerCase();
  const phone =
    data.phone && data.phone.trim().length > 0
      ? data.phone.trim()
      : undefined;

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await hashPassword(data.password);

  let referredByUserId: string | null = null;
  if (data.referralCode) {
    const referrer = await prisma.user.findFirst({
      where: { referralCode: data.referralCode },
    });
    if (referrer) {
      referredByUserId = referrer.id;
    }
  }

  const user = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email,
      password: hashedPassword,
      phone,
      referralBy: referredByUserId ?? undefined,
      emailVerifiedAt: null,
    },
  });

  const verificationToken = crypto.randomBytes(32).toString("hex");

  await prisma.authToken.create({
    data: {
      token: verificationToken,
      type: "email_verify",
      userId: user.id,
      expiresAt: getTokenExpiry("email_verify"),
    },
  });

  const frontendBase =
    process.env.FRONTEND_URL || "http://localhost:3000";
  const verifyUrl = `${frontendBase.replace(/\/$/, "")}/auth/verify-email?token=${encodeURIComponent(verificationToken)}`;

  await sendMail({
    to: user.email,
    subject: "Verify your True Beauty account",
    html: buildVerifyEmailHtml({ name: user.name, verifyUrl }),
  });

  if (process.env.NODE_ENV !== "production") {
    console.log(`[email verify] ${user.email} → ${verifyUrl}`);
  }

  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    verifyUrl,
  };
}

export async function resendVerificationEmail(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to avoid email enumeration
  if (!user) {
    return { message: "If an account exists, a verification email was sent" };
  }

  if (user.emailVerifiedAt) {
    return { message: "Email is already verified" };
  }

  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sentLast24h = await prisma.authToken.count({
    where: {
      userId: user.id,
      type: "email_verify",
      createdAt: { gte: windowStart },
    },
  });

  if (sentLast24h >= 3) {
    throw new Error("Verification email limit reached. Try again after 24 hours.");
  }

  await prisma.authToken.updateMany({
    where: {
      userId: user.id,
      type: "email_verify",
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  const verificationToken = crypto.randomBytes(32).toString("hex");
  await prisma.authToken.create({
    data: {
      token: verificationToken,
      type: "email_verify",
      userId: user.id,
      expiresAt: getTokenExpiry("email_verify"),
    },
  });

  const frontendBase = process.env.FRONTEND_URL || "http://localhost:3000";
  const verifyUrl = `${frontendBase.replace(/\/$/, "")}/auth/verify-email?token=${encodeURIComponent(verificationToken)}`;

  await sendMail({
    to: user.email,
    subject: "Verify your True Beauty account",
    html: buildVerifyEmailHtml({ name: user.name, verifyUrl }),
  });

  if (process.env.NODE_ENV !== "production") {
    console.log(`[email verify resend] ${user.email} → ${verifyUrl}`);
  }

  return { message: "If an account exists, a verification email was sent" };
}

export async function verifyEmailWithToken(token: string) {
  const stored = await prisma.authToken.findUnique({
    where: { token },
  });

  if (!stored || stored.type !== "email_verify") {
    throw new Error("Invalid or expired verification link");
  }

  if (stored.revokedAt) {
    throw new Error("This verification link has already been used");
  }

  if (stored.expiresAt < new Date()) {
    throw new Error("Verification link has expired");
  }

  const userId = stored.userId;
  if (!userId) {
    throw new Error("Invalid verification link");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.authToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    }),
  ]);

  return { userId };
}

export async function loginUser(data: { email: string; password: string }) {
  const email = data.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.password) {
    throw new Error("Please login with your OAuth provider");
  }

  const isValidPassword = await comparePassword(data.password, user.password);
  if (!isValidPassword) {
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    throw new Error("Account is deactivated");
  }

  if (!user.emailVerifiedAt) {
    throw new Error("Please verify your email before logging in");
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  await prisma.authToken.create({
    data: {
      token: refreshToken,
      type: "refresh",
      userId: user.id,
      expiresAt: getTokenExpiry("refresh"),
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { updatedAt: new Date() },
  });

  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
}

export async function logoutUser(userId: string, refreshToken?: string) {
  if (refreshToken) {
    await prisma.authToken.updateMany({
      where: {
        userId,
        token: refreshToken,
        type: "refresh",
      },
      data: {
        revokedAt: new Date(),
      },
    });
  } else {
    await prisma.authToken.updateMany({
      where: {
        userId,
        type: "refresh",
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}

export async function refreshUserToken(refreshToken: string) {
  try {
    const payload = verifyRefreshToken(refreshToken);

    const storedToken = await prisma.authToken.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      throw new Error("Token not found");
    }

    if (storedToken.type !== "refresh") {
      throw new Error("Invalid token type");
    }

    if (storedToken.revokedAt) {
      throw new Error("Token has been revoked");
    }

    if (storedToken.expiresAt < new Date()) {
      throw new Error("Token expired");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new Error("User not found or inactive");
    }

    await prisma.authToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const newAccessToken = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);

    await prisma.authToken.create({
      data: {
        token: newRefreshToken,
        type: "refresh",
        userId: user.id,
        expiresAt: getTokenExpiry("refresh"),
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (e: unknown) {
    if (process.env.NODE_ENV !== "production" && e instanceof Error) {
      throw e;
    }
    throw new Error("Invalid refresh token");
  }
}

export async function forgotPassword(email: string) {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalized },
  });

  if (!user) {
    return { message: "If an account exists, a reset email has been sent" };
  }

  // Revoke previous active reset tokens
  await prisma.authToken.updateMany({
    where: { userId: user.id, type: "password_reset", revokedAt: null },
    data: { revokedAt: new Date() },
  });

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256Hex(rawToken);

  await prisma.authToken.create({
    data: {
      token: tokenHash,
      type: "password_reset",
      userId: user.id,
      expiresAt: getPasswordResetExpiry(),
    },
  });

  const frontendBase = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetUrl = `${frontendBase.replace(/\/$/, "")}/auth/reset-password?token=${encodeURIComponent(rawToken)}`;

  await sendMail({
    to: user.email,
    subject: "Reset your True Beauty password",
    html: buildResetPasswordHtml({ name: user.name, resetUrl }),
  });

  if (process.env.NODE_ENV !== "production") {
    console.log(`[password reset] ${user.email} → ${resetUrl}`);
  }

  return { message: "If an account exists, a reset email has been sent" };
}

export async function resetPassword(token: string, newPassword: string) {
  if (!token || !newPassword) {
    throw new Error("Token and new password are required");
  }

  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const tokenHash = sha256Hex(token);
  const stored = await prisma.authToken.findUnique({
    where: { token: tokenHash },
  });

  if (!stored || stored.type !== "password_reset") {
    throw new Error("Invalid or expired reset link");
  }
  if (stored.revokedAt) {
    throw new Error("Reset link has already been used");
  }
  if (stored.expiresAt < new Date()) {
    throw new Error("Reset link has expired");
  }
  if (!stored.userId) {
    throw new Error("Invalid reset link");
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: stored.userId },
      data: { password: hashedPassword },
    }),
    prisma.authToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    }),
    prisma.authToken.updateMany({
      where: { userId: stored.userId, type: "refresh", revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return { message: "Password has been reset successfully" };
}

export async function changePassword(userId: string, data: { currentPassword: string; newPassword: string }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) throw new Error("User not found or inactive");
  if (!user.password) throw new Error("Password login is not enabled for this account");

  const ok = await comparePassword(data.currentPassword, user.password);
  if (!ok) throw new Error("Current password is incorrect");
  if (data.newPassword.length < 8) throw new Error("Password must be at least 8 characters");

  const hashed = await hashPassword(data.newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { password: hashed } }),
    prisma.authToken.updateMany({
      where: { userId, type: "refresh", revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return { message: "Password changed successfully" };
}

export async function deleteAccount(userId: string) {
  const now = new Date();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { isActive: false, deletedAt: now },
    }),
    prisma.authToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: now },
    }),
  ]);
  return { message: "Account deleted" };
}
