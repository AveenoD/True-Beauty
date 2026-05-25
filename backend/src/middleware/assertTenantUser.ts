import { NextFunction, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { AuthenticatedRequest } from "../types";

/**
 * Ensures the authenticated user belongs to the tenant resolved by requireTenant.
 * Mount after requireTenant + authenticateUser.
 */
export async function assertTenantUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const tenantAdminId = req.tenantAdminId;
  if (!tenantAdminId) {
    return ApiResponse.badRequest(res, "Tenant context missing");
  }

  const user = req.user;
  if (!user?.adminId || user.adminId !== tenantAdminId) {
    return ApiResponse.forbidden(res, "Access denied for this store");
  }

  return next();
}
