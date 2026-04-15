import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as cartService from "../services/cart.service";
import { AuthenticatedRequest } from "../types";

// ============================================================
// CART
// ============================================================

const addToCartSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

const updateCartSchema = z.object({
  quantity: z.number().int().min(0, "Quantity must be 0 or more"),
});

export const getCart = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).userId!;
    const cart = await cartService.getCart(userId);
    return ApiResponse.success(res, cart);
  }
);

export const addToCart = asyncHandler(
  async (req: Request, res: Response) => {
    const data = addToCartSchema.parse(req.body);
    const userId = (req as AuthenticatedRequest).userId!;
    const item = await cartService.addToCart(userId, data);
    return ApiResponse.created(res, item, "Item added to cart");
  }
);

export const updateCartItem = asyncHandler(
  async (req: Request, res: Response) => {
    const data = updateCartSchema.parse(req.body);
    const userId = (req as AuthenticatedRequest).userId!;
    const item = await cartService.updateCartItem(userId, req.params.id, data);
    return ApiResponse.success(res, item, "Cart updated");
  }
);

export const removeCartItem = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).userId!;
    await cartService.removeCartItem(userId, req.params.id);
    return ApiResponse.success(res, null, "Item removed from cart");
  }
);

export const clearCart = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).userId!;
    await cartService.clearCart(userId);
    return ApiResponse.success(res, null, "Cart cleared");
  }
);

// ============================================================
// WISHLIST
// ============================================================

const wishlistSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
});

export const getWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).userId!;
    const wishlist = await cartService.getWishlist(userId);
    return ApiResponse.success(res, wishlist);
  }
);

export const addToWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const data = wishlistSchema.parse(req.body);
    const userId = (req as AuthenticatedRequest).userId!;
    const item = await cartService.addToWishlist(userId, data.productId);
    return ApiResponse.created(res, item, "Added to wishlist");
  }
);

export const removeFromWishlist = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).userId!;
    await cartService.removeFromWishlist(userId, req.params.productId);
    return ApiResponse.success(res, null, "Removed from wishlist");
  }
);
