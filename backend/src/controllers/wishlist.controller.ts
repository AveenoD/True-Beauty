import { Response } from "express";
import { z } from "zod";
import * as wishlistService from "../services/wishlist.service";
import { ApiResponse } from "../utils/ApiResponse";
import { AuthenticatedRequest } from "../types";

export const getWishlist = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.user?.adminId;
    if (!adminId) return ApiResponse.badRequest(res, "Tenant user not linked");

    const items = await wishlistService.getWishlist(req.userId!, adminId);
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

    const adminId = req.user?.adminId;
    if (!adminId) return ApiResponse.badRequest(res, "Tenant user not linked");

    const item = await wishlistService.addToWishlist(req.userId!, adminId, productId);
    return ApiResponse.success(res, item, "Added to wishlist", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add to wishlist";
    return ApiResponse.error(res, message);
  }
};

export const removeItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    await wishlistService.removeFromWishlist(req.userId!, id);
    return ApiResponse.success(res, null, "Removed from wishlist");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove from wishlist";
    return ApiResponse.error(res, message);
  }
};
