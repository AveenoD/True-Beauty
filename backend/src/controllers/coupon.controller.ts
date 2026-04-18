import { Response } from "express";
import * as couponService from "../services/coupon.service";
import { ApiResponse } from "../utils/ApiResponse";
import { AuthenticatedRequest } from "../types";

export const list = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const coupons = await couponService.listCoupons(req.adminId!);
    return ApiResponse.success(res, coupons);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list coupons";
    return ApiResponse.error(res, message);
  }
};

export const create = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, discountType, discountValue, ...rest } = req.body;
    if (!code || !discountType || !discountValue) {
      return ApiResponse.badRequest(res, "code, discountType, discountValue required");
    }
    const coupon = await couponService.createCoupon(req.adminId!, { code, discountType, discountValue, ...rest });
    return ApiResponse.success(res, coupon, "Coupon created", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create coupon";
    return ApiResponse.error(res, message);
  }
};

export const update = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const coupon = await couponService.updateCoupon(req.adminId!, req.params.id, req.body);
    if (!coupon) return ApiResponse.notFound(res, "Coupon not found");
    return ApiResponse.success(res, coupon, "Coupon updated");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update coupon";
    return ApiResponse.error(res, message);
  }
};

export const remove = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await couponService.deleteCoupon(req.adminId!, req.params.id);
    return ApiResponse.success(res, null, "Coupon deleted");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete coupon";
    return ApiResponse.error(res, message);
  }
};
