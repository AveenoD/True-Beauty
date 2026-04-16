import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { hashPassword, comparePassword } from "../utils/password";
import prisma from "../config/database";
import { User } from "@prisma/client";
import crypto from "crypto";
import { sendPasswordResetEmail, sendVerificationEmail } from "../utils/mailer";

const REFRESH_EXPIRY_DAYS = 7;
const EMAIL_VERIFY_EXPIRY_HOURS = 24;
const PASSWORD_RESET_EXPIRY_MINUTES = 30;

const ALLOWED_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "yahoo.in",
  "outlook.com",
  "hotmail.com",
  "live.com",
]);

function getTokenExpiry(type: "access" | "refresh"): Date {
  const now = new Date();
  if (type === "access") {
    return new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
  }
  return new Date(
    now.getTime() + REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  ); // 7 days
}

function getEmailVerifyExpiry(): Date {
  return new Date(Date.now() + EMAIL_VERIFY_EXPIRY_HOURS * 60 * 60 * 1000);
}

function getPasswordResetExpiry(): Date {
  return new Date(Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000);
}

function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function assertAllowedEmailDomain(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain || !ALLOWED_EMAIL_DOMAINS.has(domain)) {
    throw new Error("Only Gmail/Yahoo/Outlook-type emails are allowed");
  }
}

function getApiBaseUrl() {
  return (
    process.env.API_BASE_URL ||
    `http://localhost:${process.env.PORT || 3000}`
  );
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  assertAllowedEmailDomain(data.email);

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
    },
  });

  // Create email verification token (random string, not JWT)
  const emailVerifyToken = crypto.randomBytes(32).toString("hex");
  await prisma.authToken.create({
    data: {
      token: emailVerifyToken,
      type: "email_verify",
      userId: user.id,
      expiresAt: getEmailVerifyExpiry(),
    },
  });

  const verifyUrl = `${getApiBaseUrl()}/users/verify-email?token=${encodeURIComponent(
    emailVerifyToken
  )}`;
  await sendVerificationEmail({
    to: user.email,
    name: user.name,
    verifyUrl,
  });

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    verificationEmailSent: true,
  };
}

export async function resendVerificationEmail(email: string) {
  assertAllowedEmailDomain(email);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Prevent email enumeration
  if (!user) {
    return { verificationEmailSent: true };
  }

  if (user.emailVerifiedAt) {
    return { verificationEmailSent: false, alreadyVerified: true } as const;
  }

  const since = new Date(Date.now() - EMAIL_VERIFY_EXPIRY_HOURS * 60 * 60 * 1000);
  const attempts = await prisma.authToken.count({
    where: {
      userId: user.id,
      type: "email_verify",
      createdAt: { gte: since },
    },
  });

  if (attempts >= 3) {
    throw new Error("You can request verification email only 3 times in 24 hours");
  }

  // Revoke previous unused tokens (optional hardening)
  await prisma.authToken.updateMany({
    where: {
      userId: user.id,
      type: "email_verify",
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  const emailVerifyToken = crypto.randomBytes(32).toString("hex");
  await prisma.authToken.create({
    data: {
      token: emailVerifyToken,
      type: "email_verify",
      userId: user.id,
      expiresAt: getEmailVerifyExpiry(),
    },
  });

  const verifyUrl = `${getApiBaseUrl()}/users/verify-email?token=${encodeURIComponent(
    emailVerifyToken
  )}`;
  await sendVerificationEmail({
    to: user.email,
    name: user.name,
    verifyUrl,
  });

  return { verificationEmailSent: true };
}

export async function loginUser(data: {
  email: string;
  password: string;
}) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
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

  // Generate tokens
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  // Store refresh token
  await prisma.authToken.create({
    data: {
      token: refreshToken,
      type: "refresh",
      userId: user.id,
      expiresAt: getTokenExpiry("refresh"),
    },
  });

  // Update last login
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

export async function verifyUserEmail(token: string) {
  const record = await prisma.authToken.findUnique({
    where: { token },
  });

  if (!record || record.type !== "email_verify") {
    throw new Error("Invalid or expired verification token");
  }

  if (record.revokedAt) {
    throw new Error("Verification token already used");
  }

  if (record.expiresAt < new Date()) {
    throw new Error("Verification token expired");
  }

  if (!record.userId) {
    throw new Error("Invalid verification token");
  }

  const user = await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerifiedAt: new Date() },
  });

  await prisma.authToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  return user;
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
    // Revoke all tokens for this user
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

    // Revoke old token
    await prisma.authToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const newAccessToken = generateAccessToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);

    // Store new refresh token
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
  } catch (e: any) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(e?.message || "Invalid refresh token");
    }
    throw new Error("Invalid refresh token");
  }
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return { message: "If an account exists, a reset email has been sent" };
  }

  // Generate one-time reset token (store only hash in DB)
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

  const resetUrl = `${process.env.APP_URL || "http://localhost:3000"}/reset-password?token=${encodeURIComponent(
    rawToken
  )}`;
  await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl,
    expiryMinutes: PASSWORD_RESET_EXPIRY_MINUTES,
  });

  return { message: "If an account exists, a reset email has been sent" };
}

export async function resetPassword(token: string, newPassword: string) {
  if (!token || !newPassword) {
    throw new Error("Token and new password are required");
  }

  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(newPassword)) {
    throw new Error(
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
    );
  }

  const tokenHash = sha256Hex(token);
  const record = await prisma.authToken.findUnique({
    where: { token: tokenHash },
  });

  if (!record || record.type !== "password_reset" || !record.userId) {
    throw new Error("Invalid or expired reset token");
  }

  if (record.revokedAt) {
    throw new Error("Reset token already used");
  }

  if (record.expiresAt < new Date()) {
    throw new Error("Reset token expired");
  }

  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: record.userId },
    data: { password: hashedPassword },
  });

  await prisma.authToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  // Revoke all refresh tokens for this user
  await prisma.authToken.updateMany({
    where: { userId: record.userId, type: "refresh", revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return { message: "Password has been reset successfully" };
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) throw new Error("User not found or inactive");
  if (!user.password) throw new Error("Password not set for this user");

  const ok = await comparePassword(currentPassword, user.password);
  if (!ok) throw new Error("Current password is incorrect");

  if (
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(newPassword)
  ) {
    throw new Error(
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
    );
  }

  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  await prisma.authToken.updateMany({
    where: { userId, type: "refresh", revokedAt: null },
    data: { revokedAt: new Date() },
  });

  return { changed: true };
}
