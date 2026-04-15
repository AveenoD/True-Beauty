import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as couponService from "../services/coupon.service";
import { AuthenticatedRequest } from "../types";

// ============================================================
// ADMIN COUPON
// ============================================================

const createCouponSchema = z.object({
  code: z.string().optional(),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().min(0, "Discount value must be positive"),
  minimumOrderAmount: z.number().min(0).optional(),
  usageLimitTotal: z.number().int().min(1).optional(),
  usageLimitPerUser: z.number().int().min(1).optional(),
  maxDiscountCap: z.number().min(0).optional(),
  applicableRole: z.enum(["all", "customers", "affiliate"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  applicableProductIds: z.array(z.string().uuid()).optional(),
  applicableCategories: z.array(z.string()).optional(),
});

const updateCouponSchema = createCouponSchema.omit({ code: true, applicableProductIds: true, applicableCategories: true }).partial();

const listCouponsSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  isActive: z.enum(["true", "false"]).transform(v => v === "true").optional(),
});

export const createCoupon = asyncHandler(
  async (req: Request, res: Response) => {
    const data = createCouponSchema.parse(req.body);
    const adminId = (req as AuthenticatedRequest).adminId!;
    const coupon = await couponService.createCoupon(adminId, data);
    return ApiResponse.created(res, coupon, "Coupon created successfully");
  }
);

export const updateCoupon = asyncHandler(
  async (req: Request, res: Response) => {
    const data = updateCouponSchema.parse(req.body);
    const adminId = (req as AuthenticatedRequest).adminId!;
    const coupon = await couponService.updateCoupon(adminId, req.params.id, data);
    return ApiResponse.success(res, coupon, "Coupon updated");
  }
);

export const deleteCoupon = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = (req as AuthenticatedRequest).adminId!;
    await couponService.deleteCoupon(adminId, req.params.id);
    return ApiResponse.success(res, null, "Coupon deleted");
  }
);

export const toggleCouponActive = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = (req as AuthenticatedRequest).adminId!;
    const coupon = await couponService.toggleCouponActive(adminId, req.params.id);
    return ApiResponse.success(res, coupon, `Coupon ${coupon.isActive ? "activated" : "deactivated"}`);
  }
);

export const getCoupon = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = (req as AuthenticatedRequest).adminId!;
    const coupon = await couponService.getCoupon(adminId, req.params.id);
    return ApiResponse.success(res, coupon);
  }
);

export const listCoupons = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listCouponsSchema.parse(req.query);
    const adminId = (req as AuthenticatedRequest).adminId!;
    const result = await couponService.listCoupons(adminId, query);
    return ApiResponse.paginated(res, result.data, result.pagination);
  }
);

// ============================================================
// USER COUPON VALIDATION
// ============================================================

const validateCouponSchema = z.object({
  couponCode: z.string().min(1, "Coupon code is required"),
  cartSubtotal: z.number().min(0).optional(),
});

export const validateCoupon = asyncHandler(
  async (req: Request, res: Response) => {
    const data = validateCouponSchema.parse(req.body);
    const userId = (req as AuthenticatedRequest).userId!;
    const result = await couponService.validateCoupon(userId, data.couponCode, data.cartSubtotal ?? 0);
    return ApiResponse.success(res, result);
  }
);
