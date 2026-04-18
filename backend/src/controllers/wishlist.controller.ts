import { Response } from "express";
import * as wishlistService from "../services/wishlist.service";
import { ApiResponse } from "../utils/ApiResponse";
import { AuthenticatedRequest } from "../types";

export const getWishlist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const items = await wishlistService.getWishlist(req.userId!);
    return ApiResponse.success(res, items);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get wishlist";
    return ApiResponse.error(res, message);
  }
};

export const addItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.body;
    if (!productId) return ApiResponse.badRequest(res, "productId required");
    const item = await wishlistService.addToWishlist(req.userId!, productId);
    return ApiResponse.success(res, item, "Added to wishlist", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add to wishlist";
    return ApiResponse.error(res, message);
  }
};

export const removeItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await wishlistService.removeFromWishlist(req.userId!, req.params.id);
    return ApiResponse.success(res, null, "Removed from wishlist");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove from wishlist";
    return ApiResponse.error(res, message);
  }
};
