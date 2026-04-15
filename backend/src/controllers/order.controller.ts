import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as orderService from "../services/order.service";
import { AuthenticatedRequest } from "../types";

// ============================================================
// USER ORDER
// ============================================================

const placeOrderSchema = z.object({
  shippingAddressId: z.string().uuid("Invalid address ID"),
  billingAddressId: z.string().uuid("Invalid address ID").optional(),
  paymentMethod: z.enum(["upi", "card", "netbanking", "cod"], {
    errorMap: () => ({ message: "Payment method must be upi, card, netbanking, or cod" }),
  }),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

const listOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().optional(),
});

export const placeOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const data = placeOrderSchema.parse(req.body);
    const userId = (req as AuthenticatedRequest).userId!;
    const result = await orderService.placeOrder(userId, data);
    return ApiResponse.created(res, result, "Order placed successfully");
  }
);

export const listUserOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listOrdersSchema.parse(req.query);
    const userId = (req as AuthenticatedRequest).userId!;
    const result = await orderService.listUserOrders(userId, query);
    return ApiResponse.paginated(res, result.data, result.pagination);
  }
);

export const getUserOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).userId!;
    const order = await orderService.getUserOrder(userId, req.params.id);
    return ApiResponse.success(res, order);
  }
);

export const cancelUserOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).userId!;
    const order = await orderService.cancelUserOrder(userId, req.params.id);
    return ApiResponse.success(res, order, "Order cancelled successfully");
  }
);

// ============================================================
// ADMIN ORDER
// ============================================================

const listAdminOrdersSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.string().min(1, "Status is required"),
});

export const listAdminOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listAdminOrdersSchema.parse(req.query);
    const adminId = (req as AuthenticatedRequest).adminId!;
    const result = await orderService.listAdminOrders(adminId, query);
    return ApiResponse.paginated(res, result.data, result.pagination);
  }
);

export const getAdminOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = (req as AuthenticatedRequest).adminId!;
    const order = await orderService.getAdminOrder(adminId, req.params.id);
    return ApiResponse.success(res, order);
  }
);

export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const data = updateStatusSchema.parse(req.body);
    const adminId = (req as AuthenticatedRequest).adminId!;
    const order = await orderService.updateOrderStatus(adminId, req.params.id, data);
    return ApiResponse.success(res, order, "Order status updated");
  }
);

export const cancelAdminOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = (req as AuthenticatedRequest).adminId!;
    const order = await orderService.cancelAdminOrder(adminId, req.params.id);
    return ApiResponse.success(res, order, "Order cancelled");
  }
);
