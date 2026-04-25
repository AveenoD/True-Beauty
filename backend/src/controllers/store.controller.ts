import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as storeService from "../services/store.service";

export const listProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantAdminId = (req as any).tenantAdminId as string | undefined;
    if (!tenantAdminId) {
      return ApiResponse.badRequest(res, "Tenant context missing");
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
    const result = await storeService.listProducts(tenantAdminId, query);

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
    const tenantAdminId = (req as any).tenantAdminId as string | undefined;
    if (!tenantAdminId) {
      return ApiResponse.badRequest(res, "Tenant context missing");
    }

    const id = z.string().min(1).parse(req.params.id);
    const product = await storeService.getProduct(tenantAdminId, id);

    return ApiResponse.success(res, product, "Product retrieved");
  }
);

export const listServices = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantAdminId = (req as any).tenantAdminId as string | undefined;
    if (!tenantAdminId) {
      return ApiResponse.badRequest(res, "Tenant context missing");
    }

    const schema = z.object({
      page: z.coerce.number().min(1).optional(),
      limit: z.coerce.number().min(1).max(100).optional(),
      category: z.string().optional(),
      search: z.string().optional(),
      status: z.string().optional(),
    });

    const query = schema.parse(req.query);
    const result = await storeService.listServices(tenantAdminId, query);

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
    const tenantAdminId = (req as any).tenantAdminId as string | undefined;
    if (!tenantAdminId) {
      return ApiResponse.badRequest(res, "Tenant context missing");
    }

    const id = z.string().min(1).parse(req.params.id);
    const service = await storeService.getService(tenantAdminId, id);

    return ApiResponse.success(res, service, "Service retrieved");
  }
);