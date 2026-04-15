import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as returnService from "../services/return.service";
import { AuthenticatedRequest } from "../types";

const createReturnSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
  reason: z.string().min(10, "Please provide a detailed reason (min 10 chars)"),
  productId: z.string().uuid("Invalid product ID").optional(),
  quantity: z.number().int().min(1).optional(),
  images: z.array(z.string().url()).optional(),
  pickupAddressId: z.string().uuid("Invalid address ID").optional(),
});

const listReturnsSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.string().min(1),
  adminNote: z.string().optional(),
  refundAmount: z.number().min(0).optional(),
});

export const createReturn = asyncHandler(async (req: Request, res: Response) => {
  const data = createReturnSchema.parse(req.body);
  const userId = (req as AuthenticatedRequest).userId!;
  const result = await returnService.createReturn(userId, data);
  return ApiResponse.created(res, result, "Return request submitted");
});

export const listUserReturns = asyncHandler(async (req: Request, res: Response) => {
  const query = listReturnsSchema.parse(req.query);
  const userId = (req as AuthenticatedRequest).userId!;
  const result = await returnService.listUserReturns(userId, query);
  return ApiResponse.paginated(res, result.data, result.pagination);
});

export const getUserReturn = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).userId!;
  const result = await returnService.getUserReturn(userId, req.params.id);
  return ApiResponse.success(res, result);
});

// Admin
export const listAdminReturns = asyncHandler(async (req: Request, res: Response) => {
  const query = listReturnsSchema.parse(req.query);
  const adminId = (req as AuthenticatedRequest).adminId!;
  const result = await returnService.listAdminReturns(adminId, query);
  return ApiResponse.paginated(res, result.data, result.pagination);
});

export const getAdminReturn = asyncHandler(async (req: Request, res: Response) => {
  const adminId = (req as AuthenticatedRequest).adminId!;
  const result = await returnService.getAdminReturn(adminId, req.params.id);
  return ApiResponse.success(res, result);
});

export const updateReturnStatus = asyncHandler(async (req: Request, res: Response) => {
  const data = updateStatusSchema.parse(req.body);
  const adminId = (req as AuthenticatedRequest).adminId!;
  const result = await returnService.updateReturnStatus(adminId, req.params.id, data);
  return ApiResponse.success(res, result, "Return status updated");
});
