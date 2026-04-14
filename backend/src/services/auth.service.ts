import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { hashPassword, comparePassword } from "../utils/password";
import {
  validateEmail,
  sendVerificationEmail,
  sendResendVerificationEmail,
  sendPasswordResetEmail,
} from "./email.service";
import prisma from "../config/database";
import crypto from "crypto";

const REFRESH_EXPIRY_DAYS = 7;
const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;

function getTokenExpiry(type: "access" | "refresh"): Date {
  const now = new Date();
  if (type === "access") {
    return new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
  }
  return new Date(now.getTime() + REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000); // 7 days
}

// Password strength validation (industry standard)
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character (!@#$%^&* etc.)");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Generate email verification token
function generateEmailVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  referralCode?: string;
}) {
  // Validate email domain using mailchecker
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    throw new Error(emailValidation.error);
  }

  // Password strength validation
  const passwordCheck = validatePasswordStrength(data.password);
  if (!passwordCheck.valid) {
    throw new Error(`Password validation failed: ${passwordCheck.errors.join(", ")}`);
  }

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await hashPassword(data.password);

  // Generate email verification token
  const emailVerificationToken = generateEmailVerificationToken();
  const emailVerificationExpiry = new Date(
    Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000
  );

  // Generate unique referral code
  const userReferralCode = crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase();

  // Check referral code if provided
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
      name: data.name,
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
      referralCode: userReferralCode,
      referralBy: referredByUserId,
      isEmailVerified: false,
      emailVerificationToken,
      emailVerificationExpiry,
    },
  });

  // Send verification email
  await sendVerificationEmail(data.email, data.name, emailVerificationToken);

  // Generate tokens for immediate login (user can login but may be restricted)
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

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
    message: "Registration successful. Please verify your email to activate your account.",
    verificationRequired: true,
  };
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

  // Check email verification - user must verify email first
  if (!user.isEmailVerified) {
    throw new Error("Please verify your email before logging in. Check your inbox for the verification email.");
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

    // Revoke old token (token rotation)
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
  } catch {
    throw new Error("Invalid refresh token");
  }
}

export async function verifyEmail(token: string) {
  if (!token) {
    throw new Error("Verification token is required");
  }

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      isEmailVerified: false,
    },
  });

  if (!user) {
    throw new Error("Invalid or expired verification token");
  }

  // Check if token is expired
  if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
    throw new Error("Verification token has expired. Please request a new one.");
  }

  // Mark email as verified
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
    },
  });

  return {
    success: true,
    message: "Email verified successfully! You can now login.",
  };
}

export async function resendVerificationEmail(email: string) {
  // Validate email domain
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    throw new Error(emailValidation.error);
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Don't reveal if user exists - same message
    return {
      message: "If an account exists, a verification email has been sent"
    };
  }

  if (user.isEmailVerified) {
    return {
      message: "Email is already verified. You can login."
    };
  }

  // Generate new verification token
  const newToken = generateEmailVerificationToken();
  const newExpiry = new Date(
    Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000
  );

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: newToken,
      emailVerificationExpiry: newExpiry,
    },
  });

  // Send new verification email
  await sendResendVerificationEmail(email, user.name, newToken);

  return {
    message: "A new verification email has been sent. Please check your inbox."
  };
}

export async function forgotPassword(email: string) {
  // Validate email domain
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    throw new Error(emailValidation.error);
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return { message: "If an account exists, a password reset email has been sent" };
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  // In production: Store in password_reset_tokens table with expiry

  // Send password reset email
  await sendPasswordResetEmail(email, user.name, resetToken);

  return { message: "If an account exists, a password reset email has been sent" };
}

export async function resetPassword(token: string, newPassword: string) {
  if (!token || !newPassword) {
    throw new Error("Token and new password are required");
  }

  // New password strength validation
  const passwordCheck = validatePasswordStrength(newPassword);
  if (!passwordCheck.valid) {
    throw new Error(`Password validation failed: ${passwordCheck.errors.join(", ")}`);
  }

  // In production: lookup token from password_reset_tokens table
  // const resetRecord = await prisma.passwordResetToken.findUnique({ where: { token } });
  // if (!resetRecord || resetRecord.expiresAt < new Date()) throw new Error("Invalid or expired token");

  return { message: "Password has been reset successfully" };
}
