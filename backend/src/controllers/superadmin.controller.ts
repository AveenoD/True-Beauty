import { Request, Response } from "express";
import { z } from "zod";
import type { AdminVerificationStatus } from "@prisma/client";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as superadminService from "../services/superadmin.service";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const schema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  });

  const { email, password } = schema.parse(req.body);
  const result = await superadminService.loginSuperAdmin(email, password);
  return ApiResponse.success(res, result, "Login successful");
});

export const verifyAdminOnboarding = asyncHandler(async (req: Request, res: Response) => {
  const id = z.string().min(1).parse(req.params.id);
  const superAdminId = req.superAdminId;
  if (!superAdminId) {
    return ApiResponse.unauthorized(res, "SuperAdmin context missing");
  }

  const schema = z.object({
    status: z.enum(["pending_review", "approved", "rejected"]),
    note: z.string().max(2000).optional().nullable(),
  });

  const data = schema.parse(req.body);
  const admin = await superadminService.verifyTenantAdminOnboarding(id, superAdminId, {
    status: data.status as AdminVerificationStatus,
    note: data.note,
  });

  return ApiResponse.success(res, admin, "Verification updated");
});

export const listAdmins = asyncHandler(async (_req: Request, res: Response) => {
  const admins = await superadminService.listTenantAdmins();
  return ApiResponse.success(res, admins, "Admins retrieved");
});

export const getAdmin = asyncHandler(async (req: Request, res: Response) => {
  const id = z.string().min(1).parse(req.params.id);
  const admin = await superadminService.getTenantAdminById(id);
  return ApiResponse.success(res, admin, "Admin retrieved");
});

export const disableAdmin = asyncHandler(async (req: Request, res: Response) => {
  const id = z.string().min(1).parse(req.params.id);
  const admin = await superadminService.setTenantAdminActive(id, false);
  return ApiResponse.success(res, admin, "Admin disabled");
});

export const enableAdmin = asyncHandler(async (req: Request, res: Response) => {
  const id = z.string().min(1).parse(req.params.id);
  const admin = await superadminService.setTenantAdminActive(id, true);
  return ApiResponse.success(res, admin, "Admin enabled");
});

