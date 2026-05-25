import { Response } from "express";
import { z } from "zod";
import * as cartService from "../services/cart.service";
import { ApiResponse } from "../utils/ApiResponse";
import { AuthenticatedRequest } from "../types";

export const getCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const cart = await cartService.getCart(req.userId!);
    return ApiResponse.success(res, cart);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get cart";
    return ApiResponse.error(res, message);
  }
};

export const addItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, quantity } = req.body;
    if (!productId || !quantity) return ApiResponse.badRequest(res, "productId and quantity required");
    const tenantAdminId = req.tenantAdminId!;
    const item = await cartService.addToCart(req.userId!, tenantAdminId, {
      productId,
      quantity,
    });
    return ApiResponse.success(res, item, "Added to cart", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add to cart";
    return ApiResponse.error(res, message);
  }
};

export const updateItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { quantity } = req.body;
    if (quantity === undefined) return ApiResponse.badRequest(res, "quantity required");
    const id = z.string().min(1).parse(req.params.id);
    const item = await cartService.updateCartItem(
      req.userId!,
      req.tenantAdminId!,
      id,
      quantity
    );
    return ApiResponse.success(res, item, "Cart updated");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update cart";
    return ApiResponse.error(res, message);
  }
};

export const removeItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    await cartService.removeCartItem(req.userId!, id, req.tenantAdminId!);
    return ApiResponse.success(res, null, "Item removed");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove item";
    return ApiResponse.error(res, message);
  }
};

export const clearCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await cartService.clearCart(req.userId!);
    return ApiResponse.success(res, null, "Cart cleared");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to clear cart";
    return ApiResponse.error(res, message);
  }
};
