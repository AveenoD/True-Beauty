import { Request, Response } from "express";
import path from "path";
import { uploadToCloudinary } from "../utils/cloudinary";
import { ApiResponse } from "../utils/ApiResponse";
import { AuthenticatedRequest } from "../types";

export const uploadProfilePhoto = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const file = (req as any).file;
    if (!file) {
      return ApiResponse.badRequest(res, "No file uploaded");
    }

    const filePath = file.path;
    const adminId = req.adminId!;
    const publicId = `admin_${adminId}_profile_${Date.now()}`;

    const url = await uploadToCloudinary(filePath, "admin_profiles", publicId);

    return ApiResponse.success(res, { url }, "Profile photo uploaded", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return ApiResponse.error(res, message);
  }
};

export const uploadProductImage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const file = (req as any).file;
    if (!file) {
      return ApiResponse.badRequest(res, "No file uploaded");
    }

    const filePath = file.path;
    const timestamp = Date.now();
    const publicId = `product_${req.adminId}_${timestamp}`;

    const url = await uploadToCloudinary(filePath, "products", publicId);

    return ApiResponse.success(res, { url }, "Image uploaded", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return ApiResponse.error(res, message);
  }
};

export const uploadCategoryImage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const file = (req as any).file;
    if (!file) {
      return ApiResponse.badRequest(res, "No file uploaded");
    }

    const filePath = file.path;
    const timestamp = Date.now();
    const publicId = `category_${req.adminId}_${timestamp}`;

    const url = await uploadToCloudinary(filePath, "categories", publicId);

    return ApiResponse.success(res, { url }, "Image uploaded", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return ApiResponse.error(res, message);
  }
};