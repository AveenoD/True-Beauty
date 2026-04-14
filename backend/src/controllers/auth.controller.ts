import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as authService from "../services/auth.service";

export const register = asyncHandler(
  async (req: Request, res: Response) => {
    const schema = z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Invalid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      phone: z.string().optional(),
      referralCode: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const result = await authService.registerUser(data);

    return ApiResponse.created(
      res,
      result,
      "Registration successful. Please verify your email."
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
    const result = await authService.loginUser(data);

    return ApiResponse.success(res, result, "Login successful");
  }
);

export const logout = asyncHandler(
  async (req: Request, res: Response) => {
    const schema = z.object({
      refreshToken: z.string().optional(),
    });

    const { refreshToken } = schema.parse(req.body);
    const userId = (req as any).userId;

    await authService.logoutUser(userId, refreshToken);

    return ApiResponse.success(res, null, "Logout successful");
  }
);

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const schema = z.object({
      refreshToken: z.string().min(1, "Refresh token is required"),
    });

    const { refreshToken } = schema.parse(req.body);
    const result = await authService.refreshUserToken(refreshToken);

    return ApiResponse.success(res, result, "Token refreshed");
  }
);

export const verifyEmail = asyncHandler(
  async (req: Request, res: Response) => {
    // Token can be in query param or body
    const token = (req.query.token as string) || req.body?.token;

    if (!token) {
      return ApiResponse.badRequest(res, "Verification token is required");
    }

    const result = await authService.verifyEmail(token);
    return ApiResponse.success(res, result, "Email verified successfully");
  }
);

export const resendVerification = asyncHandler(
  async (req: Request, res: Response) => {
    const schema = z.object({
      email: z.string().email("Invalid email address"),
    });

    const { email } = schema.parse(req.body);
    const result = await authService.resendVerificationEmail(email);
    return ApiResponse.success(res, result, "Verification email sent if account exists");
  }
);

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const schema = z.object({
      email: z.string().email("Invalid email address"),
    });

    const { email } = schema.parse(req.body);
    const result = await authService.forgotPassword(email);

    return ApiResponse.success(res, result, "Password reset email sent");
  }
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const schema = z.object({
      token: z.string().min(1, "Reset token is required"),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
    });

    const { token, newPassword } = schema.parse(req.body);
    const result = await authService.resetPassword(token, newPassword);

    return ApiResponse.success(res, result, "Password reset successful");
  }
);