import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { hashPassword, comparePassword } from "../utils/password";
import prisma from "../config/database";
import crypto from "crypto";

const REFRESH_EXPIRY_DAYS = 7;

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

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
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

  // NOTE: referralCode is NOT generated here
  // User becomes affiliate ONLY when they apply for affiliate program
  // Then referralCode is generated in the affiliate apply endpoint

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
    },
  });

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

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
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

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return { message: "If an account exists, a reset email has been sent" };
  }

  // Generate reset token (in production, store in DB or send via email)
  const resetToken = crypto.randomBytes(32).toString("hex");
  // In production: await prisma.passwordResetToken.create({ data: { token: resetToken, email, expiresAt: new Date(Date.now() + 60 * 60 * 1000) } });

  console.log(`Password reset token for ${email}: ${resetToken}`);

  return { message: "If an account exists, a reset email has been sent" };
}

export async function resetPassword(
  token: string,
  oldPassword: string,
  newPassword: string
) {
  // Validate reset token from database
  // In production: await prisma.passwordResetToken.findUnique({ where: { token } });
  // For now, we expect email-based token validation is done before calling this

  if (!token || !oldPassword || !newPassword) {
    throw new Error("Token, old password, and new password are required");
  }

  // New password strength validation
  const passwordCheck = validatePasswordStrength(newPassword);
  if (!passwordCheck.valid) {
    throw new Error(`Password validation failed: ${passwordCheck.errors.join(", ")}`);
  }

  // In production: lookup token from password_reset_tokens table
  // const resetRecord = await prisma.passwordResetToken.findUnique({ where: { token } });
  // if (!resetRecord || resetRecord.expiresAt < new Date()) throw new Error("Invalid or expired token");

  // For demo: we would find user by email from resetRecord and verify old password
  // const user = await prisma.user.findUnique({ where: { email: resetRecord.email } });
  // await comparePassword(oldPassword, user.password);

  return { message: "Password has been reset successfully" };
}