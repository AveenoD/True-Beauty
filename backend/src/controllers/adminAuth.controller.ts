import { Request, Response } from "express";
import * as adminAuthService from "../services/adminAuth.service";
import { ApiResponse } from "../utils/ApiResponse";
import { AuthenticatedRequest } from "../types";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, slug } = req.body;

    if (!name || !email || !password) {
      return ApiResponse.badRequest(res, "Name, email and password are required");
    }

    if (password.length < 8) {
      return ApiResponse.badRequest(res, "Password must be at least 8 characters");
    }

    const result = await adminAuthService.registerAdmin({ name, email, password, slug });
    return ApiResponse.success(res, result, "Admin registered successfully", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return ApiResponse.badRequest(res, message);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return ApiResponse.badRequest(res, "Email and password are required");
    }

    const result = await adminAuthService.loginAdmin({ email, password });
    return ApiResponse.success(res, result, "Login successful");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return ApiResponse.unauthorized(res, message);
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    await adminAuthService.logoutAdmin(req.adminId!, refreshToken);
    return ApiResponse.success(res, null, "Logged out successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Logout failed";
    return ApiResponse.badRequest(res, message);
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    if (!refreshToken) {
      return ApiResponse.badRequest(res, "Refresh token is required");
    }

    const result = await adminAuthService.refreshAdminToken(refreshToken);
    return ApiResponse.success(res, result, "Token refreshed");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Token refresh failed";
    return ApiResponse.unauthorized(res, message);
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.admin) {
      return ApiResponse.unauthorized(res, "Not authenticated");
    }
    const { password: _, ...adminWithoutPassword } = req.admin;
    return ApiResponse.success(res, adminWithoutPassword);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get profile";
    return ApiResponse.error(res, message);
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return ApiResponse.badRequest(res, "Current password and new password are required");
    }
    const result = await adminAuthService.changePassword(req.adminId!, { currentPassword, newPassword });
    return ApiResponse.success(res, result, "Password changed successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to change password";
    return ApiResponse.badRequest(res, message);
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, profilePhoto } = req.body;
    const result = await adminAuthService.updateProfile(req.adminId!, { name, profilePhoto });
    return ApiResponse.success(res, result, "Profile updated");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return ApiResponse.error(res, message);
  }
};
