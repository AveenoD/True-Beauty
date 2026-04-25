import { NextFunction, Response } from "express";
import prisma from "../config/database";
import { ApiResponse } from "../utils/ApiResponse";
import { AuthenticatedRequest } from "../types";

const TENANT_HEADER = "x-tenant-slug";
const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/;

export async function requireTenant(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const raw =
      (req.headers[TENANT_HEADER] as string | undefined) ??
      (req.headers[TENANT_HEADER.toLowerCase()] as string | undefined);

    const slug = (Array.isArray(raw) ? raw[0] : raw)?.trim().toLowerCase();
    if (!slug) {
      return ApiResponse.badRequest(res, "X-Tenant-Slug header is required");
    }

    if (!SLUG_REGEX.test(slug)) {
      return ApiResponse.badRequest(res, "Invalid X-Tenant-Slug");
    }

    const admin = await prisma.admin.findFirst({
      where: { slug, isActive: true },
      select: { id: true, slug: true },
    });

    if (!admin?.id) {
      return ApiResponse.notFound(res, "Tenant not found");
    }

    req.tenantAdminId = admin.id;
    req.tenantSlug = admin.slug ?? slug;

    return next();
  } catch (error) {
    return next(error);
  }
}

