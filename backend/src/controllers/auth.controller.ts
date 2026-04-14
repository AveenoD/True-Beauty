import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as authService from "../services/auth.service";
import {
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies,
  getRefreshTokenFromCookie,
} from "../utils/cookies";

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

    // Set httpOnly cookies
    setAccessTokenCookie(res, result.accessToken);
    setRefreshTokenCookie(res, result.refreshToken);

    // Return user data without tokens (tokens in cookies)
    return ApiResponse.created(
      res,
      { user: result.user },
      "Registration successful"
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

    // Set httpOnly cookies
    setAccessTokenCookie(res, result.accessToken);
    setRefreshTokenCookie(res, result.refreshToken);

    // Return user data without tokens (tokens in cookies)
    return ApiResponse.success(res, { user: result.user }, "Login successful");
  }
);

export const logout = asyncHandler(
  async (req: Request, res: Response) => {
    // Get refresh token from cookie or body
    const bodyRefreshToken = req.body?.refreshToken;
    const cookieRefreshToken = getRefreshTokenFromCookie(req);
    const refreshToken = bodyRefreshToken || cookieRefreshToken;

    const userId = (req as any).userId;

    await authService.logoutUser(userId, refreshToken);

    // Clear cookies
    clearAuthCookies(res);

    return ApiResponse.success(res, null, "Logout successful");
  }
);

export const refreshTokenHandler = asyncHandler(
  async (req: Request, res: Response) => {
    // Get refresh token from cookie (preferred) or body
    const bodyRefreshToken = req.body?.refreshToken;
    const cookieRefreshToken = getRefreshTokenFromCookie(req);
    const refreshToken = bodyRefreshToken || cookieRefreshToken;

    if (!refreshToken) {
      return ApiResponse.badRequest(res, "Refresh token is required");
    }

    const result = await authService.refreshUserToken(refreshToken);

    // Set new httpOnly cookies (token rotation)
    setAccessTokenCookie(res, result.accessToken);
    setRefreshTokenCookie(res, result.refreshToken);

    // Return only accessToken (refresh is in cookie)
    return ApiResponse.success(
      res,
      { accessToken: result.accessToken },
      "Token refreshed"
    );
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
      oldPassword: z.string().min(1, "Current password is required"),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
    });

    const { token, oldPassword, newPassword } = schema.parse(req.body);
    const result = await authService.resetPassword(token, oldPassword, newPassword);

    return ApiResponse.success(res, result, "Password reset successful");
  }
);