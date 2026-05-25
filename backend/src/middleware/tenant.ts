import { NextFunction, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { AuthenticatedRequest } from "../types";
import {
  resolveTenantFromRequest,
  TenantResolutionError,
} from "../services/tenantResolver.service";

export async function requireTenant(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const resolved = await resolveTenantFromRequest(req);

    req.tenantAdminId = resolved.tenantAdminId;
    req.tenantSlug = resolved.tenantSlug;
    req.tenantResolvedVia = resolved.resolvedVia;

    return next();
  } catch (error) {
    if (error instanceof TenantResolutionError) {
      if (error.code === "missing" || error.code === "invalid_slug") {
        return ApiResponse.badRequest(res, error.message);
      }
      return ApiResponse.notFound(res, error.message);
    }
    return next(error);
  }
}
