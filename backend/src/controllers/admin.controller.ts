import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as adminService from "../services/admin.service";
import { AuthenticatedRequest } from "../types";

export const register = asyncHandler(
  async (req: Request, res: Response) => {
    const schema = z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Invalid email address"),
      phone: z.string().min(10, "Phone number must be at least 10 digits"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      role: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const result = await adminService.registerAdmin(data);

    return ApiResponse.created(
      res,
      result,
      "Admin registration successful"
    );
  }
);

export const login = asyncHandler(
  async (req: Request, res: Response) => {
    const schema = z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(1, "Password is required"),
    });

    const data = schema.parse(req.body);
    const result = await adminService.loginAdmin(data);

    return ApiResponse.success(res, result, "Admin login successful");
  }
);

export const logout = asyncHandler(
  async (req: Request, res: Response) => {
    const schema = z.object({
      refreshToken: z.string().optional(),
    });

    const { refreshToken } = schema.parse(req.body);
    const adminId = (req as AuthenticatedRequest).adminId;

    await adminService.logoutAdmin(adminId, refreshToken);

    return ApiResponse.success(res, null, "Logout successful");
  }
);

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const schema = z.object({
      refreshToken: z.string().min(1, "Refresh token is required"),
    });

    const { refreshToken } = schema.parse(req.body);
    const result = await adminService.refreshAdminToken(refreshToken);

    return ApiResponse.success(res, result, "Token refreshed");
  }
);
