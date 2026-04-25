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
    refreshToken,  // RT included for initial storage, but frontend should rely on HTTP-only cookie
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

export async function changePassword(adminId: string, data: {
  currentPassword: string;
  newPassword: string;
}) {
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
  });

  if (!admin) {
    throw new Error("Admin not found");
  }

  const isValid = await comparePassword(data.currentPassword, admin.password);
  if (!isValid) {
    throw new Error("Current password is incorrect");
  }

  if (data.newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters");
  }

  const hashedPassword = await hashPassword(data.newPassword);

  await prisma.admin.update({
    where: { id: adminId },
    data: { password: hashedPassword },
  });

  return { message: "Password changed successfully" };
}

export async function updateProfile(adminId: string, data: {
  name?: string;
  profilePhoto?: string;
}) {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.profilePhoto !== undefined) updateData.profilePhoto = data.profilePhoto;

  const admin = await prisma.admin.update({
    where: { id: adminId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      slug: true,
      role: true,
      isActive: true,
      profilePhoto: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return admin;
}

export async function getAdminSubscription(adminId: string) {
  // Enforce demo admin always has an active 1-month Professional subscription.
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { email: true },
  });

  if (admin?.email?.toLowerCase() === "demo@truebeauty.com") {
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { name: { equals: "professional", mode: "insensitive" }, isActive: true },
      select: { id: true },
    });

    if (plan?.id) {
      const now = new Date();
      const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const existing = await prisma.adminSubscription.findUnique({
        where: { adminId },
        select: { expiryDate: true, plan: { select: { name: true } }, status: true },
      });

      const hasProfessional =
        existing?.plan?.name?.toLowerCase() === "professional" &&
        existing.status === "active" &&
        existing.expiryDate >= oneMonthFromNow;

      if (!hasProfessional) {
        await prisma.adminSubscription.upsert({
          where: { adminId },
          create: {
            adminId,
            planId: plan.id,
            startDate: now,
            expiryDate: oneMonthFromNow,
            status: "active",
            autoRenew: false,
          },
          update: {
            planId: plan.id,
            startDate: now,
            expiryDate: oneMonthFromNow,
            status: "active",
            autoRenew: false,
          },
        });
      }
    }
  }

  return prisma.adminSubscription.findUnique({
    where: { adminId },
    select: {
      id: true,
      status: true,
      expiryDate: true,
      plan: {
        select: { id: true, name: true, maxProducts: true },
      },
    },
  });
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const random = crypto.randomBytes(3).toString("hex");
  return `${base}-${random}`;
}
