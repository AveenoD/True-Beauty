import { Response } from "express";
import * as paymentService from "../services/payment.service";
import { ApiResponse } from "../utils/ApiResponse";
import { AuthenticatedRequest } from "../types";

export const initiate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId, method } = req.body;
    if (!orderId || !method) return ApiResponse.badRequest(res, "orderId and method required");
    const payment = await paymentService.initiatePayment(orderId, method);
    return ApiResponse.success(res, payment, "Payment initiated", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to initiate payment";
    return ApiResponse.error(res, message);
  }
};

export const verify = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentId, transactionId } = req.body;
    if (!paymentId || !transactionId) return ApiResponse.badRequest(res, "paymentId and transactionId required");
    const payment = await paymentService.verifyPayment(paymentId, transactionId);
    return ApiResponse.success(res, payment, "Payment verified");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to verify payment";
    return ApiResponse.error(res, message);
  }
};
