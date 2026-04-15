import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as paymentService from "../services/payment.service";
import { AuthenticatedRequest } from "../types";

const initiateSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
  paymentMethod: z.enum(["upi", "card", "netbanking", "cod"]),
});

const verifySchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
  paymentId: z.string().optional(),
  signature: z.string().optional(),
});

export const initiatePayment = asyncHandler(async (req: Request, res: Response) => {
  const data = initiateSchema.parse(req.body);
  const userId = (req as AuthenticatedRequest).userId!;
  const result = await paymentService.initiatePayment(userId, data);
  return ApiResponse.success(res, result, result.message);
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const data = verifySchema.parse(req.body);
  const userId = (req as AuthenticatedRequest).userId!;
  const result = await paymentService.verifyPayment(userId, data);
  return ApiResponse.success(res, result, result.message);
});

export const getPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).userId!;
  const orderId = req.params.orderId;
  const result = await paymentService.getPaymentStatus(userId, orderId);
  return ApiResponse.success(res, result);
});
