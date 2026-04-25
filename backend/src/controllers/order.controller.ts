import { Response } from "express";
import { z } from "zod";
import * as orderService from "../services/order.service";
import { ApiResponse } from "../utils/ApiResponse";
import { AuthenticatedRequest } from "../types";

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { shippingAddressId, billingAddressId, couponCode, paymentMethod } = req.body;
    if (!shippingAddressId || !paymentMethod) {
      return ApiResponse.badRequest(res, "shippingAddressId and paymentMethod required");
    }
    const order = await orderService.createOrder(req.userId!, { shippingAddressId, billingAddressId, couponCode, paymentMethod });
    return ApiResponse.success(res, order, "Order placed", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create order";
    return ApiResponse.error(res, message);
  }
};

export const listOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page, limit, status } = req.query;
    const result = await orderService.listOrders(req.userId!, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status: status as string,
    });
    return ApiResponse.success(res, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list orders";
    return ApiResponse.error(res, message);
  }
};

export const getOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const order = await orderService.getOrder(req.userId!, id);
    if (!order) return ApiResponse.notFound(res, "Order not found");
    return ApiResponse.success(res, order);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get order";
    return ApiResponse.error(res, message);
  }
};

export const cancelOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const order = await orderService.cancelOrder(req.userId!, id);
    return ApiResponse.success(res, order, "Order cancelled");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to cancel order";
    return ApiResponse.error(res, message);
  }
};
