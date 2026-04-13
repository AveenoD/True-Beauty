import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as storeService from "../services/store.service";

/**
 * Tenant Identification for Public Store Endpoints
 *
 * Public store endpoints (products, services) need to identify which
 * tenant's products to show. We use the `X-Tenant-ID` header.
 *
 * Flow:
 * 1. Frontend sends `X-Tenant-ID: <adminId>` header with every request
 * 2. Backend validates the header exists
 * 3. Backend filters products/services by adminId (tenant)
 *
 * For authenticated users, tenantId comes from the auth middleware.
 */

// Tenant extraction from request
function getTenantId(req: Request): string | null {
  // Check X-Tenant-ID header first (for public store)
  const tenantHeader = req.headers["x-tenant-id"];
  if (typeof tenantHeader === "string" && tenantHeader) {
    return tenantHeader;
  }
  return null;
}

export const listProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return ApiResponse.badRequest(
        res,
        "Tenant ID required. Send X-Tenant-ID header."
      );
    }

    const schema = z.object({
      page: z.coerce.number().min(1).optional(),
      limit: z.coerce.number().min(1).max(100).optional(),
      category: z.string().optional(),
      search: z.string().optional(),
      minPrice: z.coerce.number().min(0).optional(),
      maxPrice: z.coerce.number().min(0).optional(),
      status: z.string().optional(),
      sort: z.string().optional(),
      order: z.enum(["asc", "desc"]).optional(),
    });

    const query = schema.parse(req.query);
    const result = await storeService.listProducts(tenantId, query);

    return ApiResponse.paginated(
      res,
      result.data,
      result.pagination,
      "Products retrieved"
    );
  }
);

export const getProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return ApiResponse.badRequest(
        res,
        "Tenant ID required. Send X-Tenant-ID header."
      );
    }

    const { id } = req.params;
    const product = await storeService.getProduct(tenantId, id);

    return ApiResponse.success(res, product, "Product retrieved");
  }
);

export const listServices = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return ApiResponse.badRequest(
        res,
        "Tenant ID required. Send X-Tenant-ID header."
      );
    }

    const schema = z.object({
      page: z.coerce.number().min(1).optional(),
      limit: z.coerce.number().min(1).max(100).optional(),
      category: z.string().optional(),
      search: z.string().optional(),
      status: z.string().optional(),
    });

    const query = schema.parse(req.query);
    const result = await storeService.listServices(tenantId, query);

    return ApiResponse.paginated(
      res,
      result.data,
      result.pagination,
      "Services retrieved"
    );
  }
);

export const getService = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantId = getTenantId(req);

    if (!tenantId) {
      return ApiResponse.badRequest(
        res,
        "Tenant ID required. Send X-Tenant-ID header."
      );
    }

    const { id } = req.params;
    const service = await storeService.getService(tenantId, id);

    return ApiResponse.success(res, service, "Service retrieved");
  }
);
