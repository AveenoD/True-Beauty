import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as affiliateService from "../services/affiliate.service";
import { AuthenticatedRequest } from "../types";

// Note: authenticateUser middleware is applied at route level
// Do NOT call it again inside controllers

export const applyAffiliate = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;

    if (!userId) {
      return ApiResponse.unauthorized(res, "Authentication required");
    }

    const schema = z.object({
      name: z.string().min(2, "Name must be at least 2 characters").optional(),
      phone: z.string().optional(),
      email: z.string().email("Invalid email").optional(),
      address: z.string().optional(),
      acceptTerms: z.literal(true, {
        errorMap: () => ({ message: "You must accept the terms and conditions" }),
      }),
    });

    const data = schema.parse(req.body);
    const result = await affiliateService.applyToAffiliate(userId, data);

    return ApiResponse.created(res, result, "You are now an affiliate!");
  }
);

export const getAffiliateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;

    if (!userId) {
      return ApiResponse.unauthorized(res, "Authentication required");
    }

    const profile = await affiliateService.getAffiliateProfile(userId);
    return ApiResponse.success(res, profile, "Affiliate profile retrieved");
  }
);

export const getAffiliateStats = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;

    if (!userId) {
      return ApiResponse.unauthorized(res, "Authentication required");
    }

    const stats = await affiliateService.getAffiliateStats(userId);
    return ApiResponse.success(res, stats, "Affiliate statistics retrieved");
  }
);

export const getWalletHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;

    if (!userId) {
      return ApiResponse.unauthorized(res, "Authentication required");
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const wallet = await affiliateService.getWalletHistory(userId, { page, limit });
    return ApiResponse.success(res, wallet, "Wallet history retrieved");
  }
);

export const requestWithdrawal = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;

    if (!userId) {
      return ApiResponse.unauthorized(res, "Authentication required");
    }

    const schema = z.object({
      amount: z.number().positive("Amount must be positive"),
      method: z.enum(["upi", "bank_transfer"]),
      upiId: z.string().optional(),
      bankName: z.string().optional(),
      accountNumber: z.string().optional(),
      ifscCode: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const result = await affiliateService.requestWithdrawal(userId, data);

    return ApiResponse.created(res, result, "Withdrawal request submitted");
  }
);

export const getWithdrawalHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;

    if (!userId) {
      return ApiResponse.unauthorized(res, "Authentication required");
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;

    const history = await affiliateService.getWithdrawalHistory(userId, {
      page,
      limit,
      status,
    });

    return ApiResponse.success(res, history, "Withdrawal history retrieved");
  }
);

export const updateBankDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;

    if (!userId) {
      return ApiResponse.unauthorized(res, "Authentication required");
    }

    const schema = z.object({
      bankName: z.string().optional(),
      accountNumber: z.string().min(8, "Account number must be at least 8 digits").optional(),
      ifscCode: z.string().min(8, "Invalid IFSC code").optional(),
      upiId: z.string().email("Invalid UPI ID").optional(),
    });

    const data = schema.parse(req.body);
    const result = await affiliateService.updateBankDetails(userId, data);

    return ApiResponse.success(res, result, "Bank details updated");
  }
);