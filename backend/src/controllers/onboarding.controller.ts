import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as onboardingService from "../services/onboarding.service";
import { AuthenticatedRequest } from "../types";
import { BusinessType, TeamSize } from "@prisma/client";

// ============================================================
// GET ONBOARDING PROGRESS
// ============================================================
export const getProgress = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = (req as AuthenticatedRequest).adminId!;
    const progress = await onboardingService.getOnboardingProgress(adminId);

    return ApiResponse.success(
      res,
      progress,
      "Onboarding progress retrieved"
    );
  }
);

// ============================================================
// STEP 1: BUSINESS DETAILS
// ============================================================
export const saveBusinessDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const schema = z.object({
      companyName: z.string().optional(),
      website: z.string().url("Invalid website URL").optional().or(z.literal("")),
      businessType: z.nativeEnum(BusinessType).optional(),
      teamSize: z.nativeEnum(TeamSize).optional(),
      preferredStartDate: z.string().datetime().optional().or(z.string().optional()),
      storeName: z.string().optional(),
      storeDescription: z.string().optional(),
      businessCategory: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const adminId = (req as AuthenticatedRequest).adminId!;

    const result = await onboardingService.saveBusinessDetails(adminId, {
      ...data,
      preferredStartDate: data.preferredStartDate
        ? new Date(data.preferredStartDate)
        : undefined,
    });

    return ApiResponse.success(
      res,
      result,
      "Business details saved successfully"
    );
  }
);

// ============================================================
// STEP 2: SELECT PLAN & ADDONS
// ============================================================
export const selectPlanAndAddons = asyncHandler(
  async (req: Request, res: Response) => {
    const schema = z.object({
      planId: z.string().min(1, "Plan ID is required"),
      addonIds: z.array(z.string()).optional(),
    });

    const data = schema.parse(req.body);
    const adminId = (req as AuthenticatedRequest).adminId!;

    const result = await onboardingService.selectPlanAndAddons(adminId, data);

    return ApiResponse.success(res, result, "Plan and addons selected");
  }
);

// ============================================================
// STEP 3: UPLOAD KYC DOCUMENTS
// ============================================================
export const uploadKycDocuments = asyncHandler(
  async (req: Request, res: Response) => {
    const schema = z.object({
      documents: z
        .array(
          z.object({
            type: z.string().min(1, "Document type is required"),
            fileUrl: z.string().url("Invalid file URL").min(1, "File URL is required"),
          })
        )
        .min(1, "At least one document is required"),
    });

    const { documents } = schema.parse(req.body);
    const adminId = (req as AuthenticatedRequest).adminId!;

    const result = await onboardingService.uploadKycDocuments(adminId, documents);

    return ApiResponse.success(
      res,
      result,
      "KYC documents uploaded successfully"
    );
  }
);

// ============================================================
// STEP 4: SAVE BANK DETAILS
// ============================================================
export const saveBankDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const schema = z.object({
      bankName: z.string().optional(),
      accountNumber: z.string().optional(),
      ifscCode: z.string().optional(),
      upiId: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const adminId = (req as AuthenticatedRequest).adminId!;

    const result = await onboardingService.saveBankDetails(adminId, data);

    return ApiResponse.success(res, result, "Bank details saved");
  }
);

// ============================================================
// STEP 5: COMPLETE ONBOARDING
// ============================================================
export const completeOnboarding = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = (req as AuthenticatedRequest).adminId!;

    const result = await onboardingService.completeOnboarding(adminId);

    return ApiResponse.success(
      res,
      result,
      "Onboarding completed successfully"
    );
  }
);

// ============================================================
// PUBLIC: GET AVAILABLE PLANS
// ============================================================
export const getPlans = asyncHandler(async (_req: Request, res: Response) => {
  const plans = await onboardingService.getAvailablePlans();

  return ApiResponse.success(res, plans, "Plans retrieved");
});

// ============================================================
// PUBLIC: GET AVAILABLE ADDONS
// ============================================================
export const getAddons = asyncHandler(async (_req: Request, res: Response) => {
  const addons = await onboardingService.getAvailableAddons();

  return ApiResponse.success(res, addons, "Addons retrieved");
});

// ============================================================
// GET PLAN DETAILS
// ============================================================
export const getPlanDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const schema = z.object({
      planId: z.string().min(1, "Plan ID is required"),
    });

    const { planId } = schema.parse(req.params);
    const plan = await onboardingService.getPlanWithAddons(planId);

    return ApiResponse.success(res, plan, "Plan details retrieved");
  }
);
