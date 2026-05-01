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

export const listProductReviews = asyncHandler(async (req: Request, res: Response) => {
  const tenantAdminId = (req as any).tenantAdminId as string | undefined;
  if (!tenantAdminId) {
    return ApiResponse.badRequest(res, "Tenant context missing");
  }

  const id = z.string().min(1).parse(req.params.id);
  const schema = z.object({
    page: z.coerce.number().min(1).optional(),
    limit: z.coerce.number().min(1).max(50).optional(),
  });
  const query = schema.parse(req.query);

  const result = await storeService.listProductReviews(tenantAdminId, id, query);
  return ApiResponse.success(res, result, "Reviews retrieved");
});

export const canReviewProduct = asyncHandler(async (req: Request, res: Response) => {
  const tenantAdminId = (req as any).tenantAdminId as string | undefined;
  if (!tenantAdminId) {
    return ApiResponse.badRequest(res, "Tenant context missing");
  }
  const userId = (req as any).userId as string | undefined;
  if (!userId) {
    return ApiResponse.unauthorized(res, "No token provided");
  }

  const id = z.string().min(1).parse(req.params.id);
  const result = await storeService.canUserReviewProduct(userId, tenantAdminId, id);
  return ApiResponse.success(res, result, "Review eligibility");
});

export const createProductReview = asyncHandler(async (req: Request, res: Response) => {
  const tenantAdminId = (req as any).tenantAdminId as string | undefined;
  if (!tenantAdminId) {
    return ApiResponse.badRequest(res, "Tenant context missing");
  }
  const userId = (req as any).userId as string | undefined;
  if (!userId) {
    return ApiResponse.unauthorized(res, "No token provided");
  }

  const id = z.string().min(1).parse(req.params.id);
  const schema = z.object({
    rating: z.coerce.number().min(1).max(5),
    comment: z.string().max(2000).optional(),
    images: z.array(z.string().url()).max(5).optional(),
  });
  const data = schema.parse(req.body);

  try {
    const created = await storeService.createProductReview(userId, tenantAdminId, id, {
      rating: data.rating,
      comment: data.comment ?? null,
      images: data.images ?? [],
    });
    return ApiResponse.success(res, created, "Review submitted", 201);
  } catch (err: any) {
    const status = Number(err?.statusCode) || 500;
    const message = err?.message || "Failed to submit review";
    return ApiResponse.error(res, message, status);
  }
});

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