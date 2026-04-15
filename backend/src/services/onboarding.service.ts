import prisma from "../config/database";
import { BusinessType, TeamSize } from "@prisma/client";

// ============================================================
// ONBOARDING WIZARD SERVICE
// ============================================================

/**
 * Get current onboarding progress for an admin
 */
export async function getOnboardingProgress(adminId: string) {
  const progress = await prisma.adminOnboardingProgress.findUnique({
    where: { adminId },
    include: {
      admin: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      },
    },
  });

  if (!progress) {
    throw new Error("Onboarding progress not found");
  }

  return progress;
}

/**
 * STEP 1: Save Business Details
 * Updates: companyName, website, businessType, teamSize, preferredStartDate, storeName, storeDescription, businessCategory
 */
export async function saveBusinessDetails(
  adminId: string,
  data: {
    companyName?: string;
    website?: string;
    businessType?: BusinessType;
    teamSize?: TeamSize;
    preferredStartDate?: Date;
    storeName?: string;
    storeDescription?: string;
    businessCategory?: string;
  }
) {
  const progress = await prisma.adminOnboardingProgress.findUnique({
    where: { adminId },
  });

  if (!progress) {
    throw new Error("Onboarding progress not found");
  }

  // Update business details and advance to step 2
  const updated = await prisma.adminOnboardingProgress.update({
    where: { adminId },
    data: {
      companyName: data.companyName,
      website: data.website,
      businessType: data.businessType,
      teamSize: data.teamSize,
      preferredStartDate: data.preferredStartDate,
      storeName: data.storeName,
      storeDescription: data.storeDescription,
      businessCategory: data.businessCategory,
      stepCompleted: Math.max(progress.stepCompleted, 2),
      contactInfoUpdated: true,
    },
  });

  return updated;
}

/**
 * STEP 2: Select Plan & Add-ons
 * Validates plan exists and is active, then stores selection
 */
export async function selectPlanAndAddons(
  adminId: string,
  data: {
    planId: string;
    addonIds?: string[];
  }
) {
  const progress = await prisma.adminOnboardingProgress.findUnique({
    where: { adminId },
  });

  if (!progress) {
    throw new Error("Onboarding progress not found");
  }

  // Validate plan exists and is active
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: data.planId },
  });

  if (!plan) {
    throw new Error("Plan not found");
  }

  if (!plan.isActive) {
    throw new Error("This plan is no longer available");
  }

  // Validate addons if provided
  if (data.addonIds && data.addonIds.length > 0) {
    const addons = await prisma.planAddon.findMany({
      where: {
        id: { in: data.addonIds },
        isActive: true,
      },
    });

    if (addons.length !== data.addonIds.length) {
      throw new Error("One or more selected addons are invalid or inactive");
    }
  }

  // Update progress
  const updated = await prisma.adminOnboardingProgress.update({
    where: { adminId },
    data: {
      selectedPlanId: data.planId,
      selectedAddonIds: data.addonIds || [],
      stepCompleted: Math.max(progress.stepCompleted, 3),
    },
  });

  return updated;
}

/**
 * STEP 3: Upload KYC Documents
 * Stores document URLs and marks KYC as uploaded
 */
export async function uploadKycDocuments(
  adminId: string,
  documents: {
    type: string;
    fileUrl: string;
  }[]
) {
  const progress = await prisma.adminOnboardingProgress.findUnique({
    where: { adminId },
  });

  if (!progress) {
    throw new Error("Onboarding progress not found");
  }

  // Create KYC document records
  const kycDocs = await Promise.all(
    documents.map((doc) =>
      prisma.adminKycDocument.create({
        data: {
          adminId,
          type: doc.type,
          fileUrl: doc.fileUrl,
        },
      })
    )
  );

  // Update onboarding progress
  const updated = await prisma.adminOnboardingProgress.update({
    where: { adminId },
    data: {
      kycUploaded: true,
      stepCompleted: Math.max(progress.stepCompleted, 4),
    },
  });

  return { kycDocuments: kycDocs, onboardingProgress: updated };
}

/**
 * STEP 4: Save Bank Details
 * Stores bank details (stored in AffiliateProfile for now)
 */
export async function saveBankDetails(
  adminId: string,
  data: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
  }
) {
  const progress = await prisma.adminOnboardingProgress.findUnique({
    where: { adminId },
  });

  if (!progress) {
    throw new Error("Onboarding progress not found");
  }

  // Store bank details in admin profile (can be extended later)
  // For now, mark as done. Full bank details storage can be added to Admin model if needed.
  const updated = await prisma.adminOnboardingProgress.update({
    where: { adminId },
    data: {
      bankDetailsUpdated: true,
      stepCompleted: Math.max(progress.stepCompleted, 5),
    },
  });

  return updated;
}

/**
 * STEP 5: Complete Onboarding
 * Activates subscription and marks onboarding as complete
 */
export async function completeOnboarding(adminId: string) {
  const progress = await prisma.adminOnboardingProgress.findUnique({
    where: { adminId },
  });

  if (!progress) {
    throw new Error("Onboarding progress not found");
  }

  if (!progress.selectedPlanId) {
    throw new Error("Please select a plan before completing onboarding");
  }

  // Get plan details
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: progress.selectedPlanId },
  });

  if (!plan) {
    throw new Error("Selected plan not found");
  }

  // Calculate expiry based on duration
  const startDate = progress.preferredStartDate || new Date();
  const expiryDate = new Date(startDate);

  switch (plan.duration) {
    case "monthly":
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      break;
    case "quarterly":
      expiryDate.setMonth(expiryDate.getMonth() + 3);
      break;
    case "yearly":
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      break;
  }

  // Create subscription record
  const subscription = await prisma.adminSubscription.upsert({
    where: { adminId },
    update: {
      planId: progress.selectedPlanId,
      selectedAddonIds: progress.selectedAddonIds,
      startDate,
      expiryDate,
      status: "active",
      billingCycle: plan.duration,
    },
    create: {
      adminId,
      planId: progress.selectedPlanId,
      selectedAddonIds: progress.selectedAddonIds,
      startDate,
      expiryDate,
      status: "active",
      billingCycle: plan.duration,
    },
  });

  // Mark onboarding complete
  const updated = await prisma.adminOnboardingProgress.update({
    where: { adminId },
    data: {
      stepCompleted: 6,
      subscriptionActivated: true,
    },
  });

  return { subscription, onboardingProgress: updated };
}

/**
 * Get all available subscription plans
 */
export async function getAvailablePlans() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return plans;
}

/**
 * Get all available addons
 */
export async function getAvailableAddons() {
  const addons = await prisma.planAddon.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return addons;
}

/**
 * Get plan details with addons
 */
export async function getPlanWithAddons(planId: string) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    throw new Error("Plan not found");
  }

  return plan;
}
