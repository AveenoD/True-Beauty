import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as authService from "../services/auth.service";

const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, number, and special character";
const passwordStrength = z
  .string()
  .min(8, PASSWORD_POLICY_MESSAGE)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, PASSWORD_POLICY_MESSAGE);

export const register = asyncHandler(
  async (req: Request, res: Response) => {
    const schema = z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Invalid email address"),
      password: passwordStrength,
      phone: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const result = await authService.registerUser(data);

    return ApiResponse.created(
      res,
      result,
      "Registration successful. Please verify your email to login."
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
      newPassword: passwordStrength,
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
      newPassword: passwordStrength,
    });

    const { currentPassword, newPassword } = schema.parse(req.body);
    const userId = (req as any).userId as string;
    const result = await authService.changePassword(
      userId,
      currentPassword,
      newPassword
    );

    return ApiResponse.success(res, result, "Password changed successfully");
  }
);

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    token: z.string().min(1, "Verification token is required"),
  });

  const { token } = schema.parse(req.query);
  await authService.verifyUserEmail(token);

  const redirectBase = process.env.APP_URL || "http://localhost:3000";
  return res.redirect(`${redirectBase}/address?verified=1`);
});

export const resendVerificationEmail = asyncHandler(
  async (req: Request, res: Response) => {
    const schema = z.object({
      email: z.string().email("Invalid email address"),
    });

    const { email } = schema.parse(req.body);
    const result = await authService.resendVerificationEmail(email);
    const message = result.alreadyVerified
      ? "Email is already verified"
      : "Verification email sent";
    return ApiResponse.success(res, result, message);
  }
);