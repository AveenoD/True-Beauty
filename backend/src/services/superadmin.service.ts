import prisma from "../config/database";
import { comparePassword } from "../utils/password";
import { generateSuperAdminToken } from "../utils/superadminJwt";
import type { AdminVerificationStatus } from "@prisma/client";

export async function loginSuperAdmin(emailRaw: string, password: string) {
  const email = emailRaw.trim().toLowerCase();
  const sa = await prisma.superAdmin.findUnique({ where: { email } });
  if (!sa) throw new Error("Invalid email or password");

  const ok = await comparePassword(password, sa.password);
  if (!ok) throw new Error("Invalid email or password");

  const accessToken = generateSuperAdminToken(sa.id);
  return {
    superAdmin: { id: sa.id, email: sa.email, createdAt: sa.createdAt, updatedAt: sa.updatedAt },
    accessToken,
  };
}

const tenantAdminListSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  onboardingProgress: {
    select: {
      verificationStatus: true,
      verificationNote: true,
      verifiedAt: true,
      verifiedBySuperAdminId: true,
      storeName: true,
      kycUploaded: true,
      stepCompleted: true,
    },
  },
} as const;

export async function listTenantAdmins() {
  return prisma.admin.findMany({
    orderBy: { createdAt: "desc" },
    select: tenantAdminListSelect,
  });
}

export async function getTenantAdminById(id: string) {
  const admin = await prisma.admin.findUnique({
    where: { id },
    select: {
      ...tenantAdminListSelect,
      subscription: {
        select: {
          id: true,
          planId: true,
          status: true,
          startDate: true,
          expiryDate: true,
          billingCycle: true,
        },
      },
      kycDocuments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          fileUrl: true,
          isVerified: true,
          verifiedAt: true,
          createdAt: true,
        },
      },
      onboardingProgress: {
        select: {
          id: true,
          storeName: true,
          storeDescription: true,
          businessCategory: true,
          stepCompleted: true,
          storeLogoUploaded: true,
          storeBannerUploaded: true,
          contactInfoUpdated: true,
          bankDetailsUpdated: true,
          kycUploaded: true,
          verificationStatus: true,
          verificationNote: true,
          verifiedAt: true,
          verifiedBySuperAdminId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });
  if (!admin) throw new Error("Admin not found");
  return admin;
}

export async function verifyTenantAdminOnboarding(
  adminId: string,
  superAdminId: string,
  input: { status: AdminVerificationStatus; note?: string | null }
) {
  const admin = await prisma.admin.findUnique({ where: { id: adminId }, select: { id: true } });
  if (!admin) throw new Error("Admin not found");

  const status = input.status;
  const note = input.note?.trim() || null;
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.adminOnboardingProgress.upsert({
      where: { adminId },
      create: {
        adminId,
        verificationStatus: status,
        verificationNote: note,
        verifiedAt: status === "approved" || status === "rejected" ? now : null,
        verifiedBySuperAdminId: status === "approved" || status === "rejected" ? superAdminId : null,
      },
      update: {
        verificationStatus: status,
        verificationNote: note,
        verifiedAt: status === "approved" || status === "rejected" ? now : null,
        verifiedBySuperAdminId: status === "approved" || status === "rejected" ? superAdminId : null,
      },
    });

    if (status === "approved") {
      await tx.adminKycDocument.updateMany({
        where: { adminId },
        data: { isVerified: true, verifiedAt: now },
      });
    } else if (status === "rejected") {
      await tx.adminKycDocument.updateMany({
        where: { adminId },
        data: { isVerified: false, verifiedAt: null },
      });
    }
  });

  return getTenantAdminById(adminId);
}

export async function setTenantAdminActive(id: string, isActive: boolean) {
  const admin = await prisma.admin.update({
    where: { id },
    data: { isActive },
    select: tenantAdminListSelect,
  });
  return admin;
}
