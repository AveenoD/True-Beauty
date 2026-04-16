import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import { authenticateUser } from "../middleware/auth";
import * as userService from "../services/user.service";

const userIdFromRequest = (req: Request): string => {
  const authReq = req as any;
  return authReq.userId as string;
};

export const getProfile = asyncHandler(
  async (req: Request, res: Response) => {
    await new Promise<void>((resolve, reject) => {
      authenticateUser(req, res, (err?: any) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const userId = userIdFromRequest(req);
    const user = await userService.getUserProfile(userId);

    ApiResponse.success(res, user, "User profile retrieved");
  }
);

export const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    await new Promise<void>((resolve, reject) => {
      authenticateUser(req, res, (err?: any) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const schema = z.object({
      name: z.string().min(2, "Name must be at least 2 characters").optional(),
      phone: z.string().optional(),
      profileImage: z.string().url("Invalid URL").optional(),
    });

    const data = schema.parse(req.body);
    const userId = userIdFromRequest(req);
    const user = await userService.updateUserProfile(userId, data);

    ApiResponse.success(res, user, "Profile updated");
  }
);

export const getAddresses = asyncHandler(
  async (req: Request, res: Response) => {
    await new Promise<void>((resolve, reject) => {
      authenticateUser(req, res, (err?: any) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const userId = userIdFromRequest(req);
    const addresses = await userService.getUserAddresses(userId);

    ApiResponse.success(res, addresses, "Addresses retrieved");
  }
);

export const createAddress = asyncHandler(
  async (req: Request, res: Response) => {
    await new Promise<void>((resolve, reject) => {
      authenticateUser(req, res, (err?: any) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const schema = z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      phone: z.string().min(10, "Phone must be at least 10 digits"),
      addressLine1: z.string().min(5, "Address is required"),
      addressLine2: z.string().optional(),
      city: z.string().min(2, "City is required"),
      state: z.string().min(2, "State is required"),
      pincode: z.string().min(4, "Pincode is required"),
      addressType: z.string().optional(),
      isDefault: z.boolean().optional(),
    });

    const data = schema.parse(req.body);
    const userId = userIdFromRequest(req);
    const address = await userService.createUserAddress(userId, data);

    ApiResponse.created(res, address, "Address created");
  }
);

export const updateAddress = asyncHandler(
  async (req: Request, res: Response) => {
    await new Promise<void>((resolve, reject) => {
      authenticateUser(req, res, (err?: any) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const id = req.params.id as string;

    const schema = z.object({
      name: z.string().min(2).optional(),
      phone: z.string().min(10).optional(),
      addressLine1: z.string().min(5).optional(),
      addressLine2: z.string().optional(),
      city: z.string().min(2).optional(),
      state: z.string().min(2).optional(),
      pincode: z.string().min(4).optional(),
      addressType: z.string().optional(),
      isDefault: z.boolean().optional(),
    });

    const data = schema.parse(req.body);
    const userId = userIdFromRequest(req);
    const address = await userService.updateUserAddress(userId, id, data);

    ApiResponse.success(res, address, "Address updated");
  }
);

export const deleteAddress = asyncHandler(
  async (req: Request, res: Response) => {
    await new Promise<void>((resolve, reject) => {
      authenticateUser(req, res, (err?: any) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const id = req.params.id as string;
    const userId = userIdFromRequest(req);
    await userService.deleteUserAddress(userId, id);

    ApiResponse.success(res, null, "Address deleted");
  }
);