import {
  generateAdminAccessToken,
  generateAdminRefreshToken,
  verifyAdminRefreshToken,
} from "../utils/adminJwt";
import { hashPassword, comparePassword } from "../utils/password";
import prisma from "../config/database";
import crypto from "crypto";

const REFRESH_EXPIRY_DAYS = 7;

function getTokenExpiry(type: "access" | "refresh"): Date {
  const now = new Date();
  if (type === "access") {
    return new Date(now.getTime() + 15 * 60 * 1000);
  }
  return new Date(now.getTime() + REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
}

export async function registerAdmin(data: {
  name: string;
  email: string;
  password: string;
  slug?: string;
}) {
  const existing = await prisma.admin.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw new Error("Email already registered");
  }

  if (data.slug) {
    const existingSlug = await prisma.admin.findFirst({
      where: { slug: data.slug },
    });
    if (existingSlug) {
      throw new Error("Store URL already taken");
    }
  }

  const hashedPassword = await hashPassword(data.password);

  const admin = await prisma.admin.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      slug: data.slug || generateSlug(data.name),
    },
  });

  // Generate tokens
  const accessToken = generateAdminAccessToken(admin.id, admin.role);
  const refreshToken = generateAdminRefreshToken(admin.id);

  // Store refresh token
  await prisma.authToken.create({
    data: {
      token: refreshToken,
      type: "refresh",
      adminId: admin.id,
      expiresAt: getTokenExpiry("refresh"),
    },
  });

  const { password: _, ...adminWithoutPassword } = admin;

  return {
    admin: adminWithoutPassword,
    accessToken,
    refreshToken,
  };
}

export async function loginAdmin(data: {
  email: string;
  password: string;
}) {
  const admin = await prisma.admin.findUnique({
    where: { email: data.email },
  });

  if (!admin) {
    throw new Error("Invalid email or password");
  }

  const isValidPassword = await comparePassword(data.password, admin.password);
  if (!isValidPassword) {
    throw new Error("Invalid email or password");
  }

  if (!admin.isActive) {
    throw new Error("Account is deactivated");
  }

  // Generate tokens
  const accessToken = generateAdminAccessToken(admin.id, admin.role);
  const refreshToken = generateAdminRefreshToken(admin.id);

  // Store refresh token
  await prisma.authToken.create({
    data: {
      token: refreshToken,
      type: "refresh",
      adminId: admin.id,
      expiresAt: getTokenExpiry("refresh"),
    },
  });

  // Update last login
  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  const { password: _, ...adminWithoutPassword } = admin;

  return {
    admin: adminWithoutPassword,
    accessToken,
    refreshToken,
  };
}

export async function logoutAdmin(adminId: string, refreshToken?: string) {
  if (refreshToken) {
    await prisma.authToken.updateMany({
      where: {
        adminId,
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
        adminId,
        type: "refresh",
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}

export async function refreshAdminToken(refreshToken: string) {
  try {
    const payload = verifyAdminRefreshToken(refreshToken);

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

    const admin = await prisma.admin.findUnique({
      where: { id: payload.sub },
    });

    if (!admin || !admin.isActive) {
      throw new Error("Admin not found or inactive");
    }

    // Revoke old token
    await prisma.authToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    const newAccessToken = generateAdminAccessToken(admin.id, admin.role);
    const newRefreshToken = generateAdminRefreshToken(admin.id);

    // Store new refresh token
    await prisma.authToken.create({
      data: {
        token: newRefreshToken,
        type: "refresh",
        adminId: admin.id,
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

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const random = crypto.randomBytes(3).toString("hex");
  return `${base}-${random}`;
}
