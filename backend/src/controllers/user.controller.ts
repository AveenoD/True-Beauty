import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as userService from "../services/user.service";
import { AuthenticatedRequest } from "../types";

// Note: authenticateUser middleware is applied at route level in users.routes.ts
// Do NOT call it again inside controllers — it will execute twice

export const getProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;

    if (!userId) {
      return ApiResponse.unauthorized(res, "Authentication required");
    }

    const user = await userService.getUserProfile(userId);
    return ApiResponse.success(res, user, "User profile retrieved");
  }
);

export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;

    if (!userId) {
      return ApiResponse.unauthorized(res, "Authentication required");
    }

    const schema = z.object({
      name: z.string().min(2, "Name must be at least 2 characters").optional(),
      phone: z.string().optional(),
      emailPreferences: z.boolean().optional(),
    });

    const data = schema.parse(req.body);
    const user = await userService.updateUserProfile(userId, data);

    return ApiResponse.success(res, user, "Profile updated");
  }
);

export const getAddresses = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;

    if (!userId) {
      return ApiResponse.unauthorized(res, "Authentication required");
    }

    const addresses = await userService.getUserAddresses(userId);
    return ApiResponse.success(res, addresses, "Addresses retrieved");
  }
);

export const createAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;

    if (!userId) {
      return ApiResponse.unauthorized(res, "Authentication required");
    }

    const schema = z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      phone: z.string().min(10, "Phone must be at least 10 digits"),
      addressLine1: z.string().min(5, "Address is required"),
      addressLine2: z.string().optional(),
      city: z.string().min(2, "City is required"),
      state: z.string().min(2, "State is required"),
      pincode: z.string().min(4, "Pincode is required"),
      country: z.string().optional(),
      addressType: z.enum(["home", "work", "other"]).optional(),
      isDefault: z.boolean().optional(),
    });

    const data = schema.parse(req.body);
    const address = await userService.createUserAddress(userId, data);

    return ApiResponse.created(res, address, "Address created");
  }
);

export const updateAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;

    if (!userId) {
      return ApiResponse.unauthorized(res, "Authentication required");
    }

    const id = String(req.params.id ?? "");

    const schema = z.object({
      name: z.string().min(2).optional(),
      phone: z.string().min(10).optional(),
      addressLine1: z.string().min(5).optional(),
      addressLine2: z.string().optional(),
      city: z.string().min(2).optional(),
      state: z.string().min(2).optional(),
      pincode: z.string().min(4).optional(),
      country: z.string().optional(),
      addressType: z.enum(["home", "work", "other"]).optional(),
      isDefault: z.boolean().optional(),
    });

    const data = schema.parse(req.body);
    const address = await userService.updateUserAddress(userId, id, data);

    return ApiResponse.success(res, address, "Address updated");
  }
);

export const deleteAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req as AuthenticatedRequest;

    if (!userId) {
      return ApiResponse.unauthorized(res, "Authentication required");
    }

    const id = String(req.params.id ?? "");
    if (!id) {
      return ApiResponse.badRequest(res, "Address ID is required");
    }
    await userService.deleteUserAddress(userId, id);

    return ApiResponse.success(res, null, "Address deleted");
  }
);
