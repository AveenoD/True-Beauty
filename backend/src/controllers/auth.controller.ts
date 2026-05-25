import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as authService from "../services/auth.service";
import { AuthenticatedRequest } from "../types";
import {
  clearRefreshTokenCookie,
  getRefreshTokenFromRequest,
  setRefreshTokenCookie,
} from "../utils/authCookies";

export const verifyEmail = asyncHandler(
  async (req: Request, res: Response) => {
    const token = z
      .string()
      .min(1, "Token is required")
      .parse(req.query.token as string);
    await authService.verifyEmailWithToken(token);
    return ApiResponse.success(res, { verified: true }, "Email verified");
  }
);

export const register = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantAdminId = (req as AuthenticatedRequest).tenantAdminId;
    if (!tenantAdminId) {
      return ApiResponse.badRequest(res, "Tenant context missing");
    }

    const schema = z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Invalid email address"),
      password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
      phone: z.string().optional(),
      referralCode: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const result = await authService.registerUser(tenantAdminId, data);

    return ApiResponse.created(
      res,
      {
        user: result.user,
        ...(process.env.NODE_ENV !== "production"
          ? { verifyUrl: result.verifyUrl }
          : {}),
      },
      "Registration successful. Please verify your email to sign in."
    );
  }
);

export const resendVerification = asyncHandler(
  async (req: Request, res: Response) => {
    const schema = z.object({
      email: z.string().email("Invalid email address"),
    });
    const tenantAdminId = (req as AuthenticatedRequest).tenantAdminId;
    if (!tenantAdminId) {
      return ApiResponse.badRequest(res, "Tenant context missing");
    }
    const { email } = schema.parse(req.body);
    const result = await authService.resendVerificationEmail(tenantAdminId, email);
    return ApiResponse.success(res, result, "Verification email sent");
  }
);

export const login = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantAdminId = (req as AuthenticatedRequest).tenantAdminId;
    if (!tenantAdminId) {
      return ApiResponse.badRequest(res, "Tenant context missing");
    }

    const schema = z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(1, "Password is required"),
    });

    const data = schema.parse(req.body);
    const result = await authService.loginUser(tenantAdminId, data);

    setRefreshTokenCookie(res, result.refreshToken);

    return ApiResponse.success(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      "Login successful"
    );
  }
);

export const logout = asyncHandler(
  async (req: Request, res: Response) => {
    const schema = z.object({
      refreshToken: z.string().optional(),
    });

    const parsed = schema.parse(req.body);
    const userId = (req as any).userId;
    const refreshToken =
      parsed.refreshToken ?? getRefreshTokenFromRequest(req);

    await authService.logoutUser(userId, refreshToken);
    clearRefreshTokenCookie(res);

    return ApiResponse.success(res, null, "Logout successful");
  }
);

export const refreshToken = asyncHandler(
  async (req: Request, res: Response) => {
    const schema = z.object({
      refreshToken: z.string().optional(),
    });

    const parsed = schema.parse(req.body);
    const refreshToken =
      parsed.refreshToken ?? getRefreshTokenFromRequest(req);

    if (!refreshToken) {
      return ApiResponse.unauthorized(res, "Refresh token missing");
    }

    const result = await authService.refreshUserToken(refreshToken);
    setRefreshTokenCookie(res, result.refreshToken);

    return ApiResponse.success(
      res,
      { accessToken: result.accessToken },
      "Token refreshed"
    );
  }
);

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantAdminId = (req as AuthenticatedRequest).tenantAdminId;
    if (!tenantAdminId) {
      return ApiResponse.badRequest(res, "Tenant context missing");
    }
    const schema = z.object({
      email: z.string().email("Invalid email address"),
    });

    const { email } = schema.parse(req.body);
    const result = await authService.forgotPassword(tenantAdminId, email);

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

export const changePassword = asyncHandler(
  async (req: Request, res: Response) => {
    const schema = z.object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
    });
    const data = schema.parse(req.body);
    const userId = (req as any).userId as string;
    const result = await authService.changePassword(userId, data);
    return ApiResponse.success(res, result, "Password changed");
  }
);

export const deleteAccount = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).userId as string;
    const result = await authService.deleteAccount(userId);
    clearRefreshTokenCookie(res);
    return ApiResponse.success(res, result, "Account deleted");
  }
);