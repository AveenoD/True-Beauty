import { NextFunction, Response } from "express";
import prisma from "../config/database";
import { ApiResponse } from "../utils/ApiResponse";
import { verifySuperAdminToken } from "../utils/superadminJwt";
import { Request } from "express";

export type SuperAdminRequest = Request & { superAdminId?: string };

export async function authenticateSuperAdmin(
  req: SuperAdminRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return ApiResponse.unauthorized(res, "No token provided");
    }

    const token = authHeader.split(" ")[1];
    const payload = verifySuperAdminToken(token);

    const sa = await prisma.superAdmin.findUnique({ where: { id: payload.sub } });
    if (!sa) {
      return ApiResponse.unauthorized(res, "SuperAdmin not found");
    }

    req.superAdminId = sa.id;
    next();
  } catch (e) {
    next(e as Error);
  }
}

