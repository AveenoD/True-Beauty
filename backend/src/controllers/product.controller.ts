import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as productService from "../services/product.service";
import { AuthenticatedRequest } from "../types";

// --- Admin Product CRUD ---

const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  price: z.number().min(0, "Price must be positive"),
  discountPrice: z.number().min(0).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  stock: z.number().int().min(0).optional(),
  stockStatus: z.string().optional(),
  status: z.string().optional(),
  image: z.string().url().optional().or(z.string().optional()),
  images: z.array(z.string()).optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  stockThreshold: z.number().int().min(0).optional(),
  stockLocation: z.string().optional(),
  supplier: z.string().optional(),
  inventoryNotes: z.string().optional(),
});

const updateProductSchema = createProductSchema.partial();

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const data = createProductSchema.parse(req.body);
    const adminId = (req as AuthenticatedRequest).adminId!;
    const product = await productService.createProduct(adminId, data);
    return ApiResponse.created(res, product, "Product created successfully");
  }
);

export const updateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const data = updateProductSchema.parse(req.body);
    const adminId = (req as AuthenticatedRequest).adminId!;
    const product = await productService.updateProduct(adminId, req.params.id, data);
    return ApiResponse.success(res, product, "Product updated successfully");
  }
);

export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = (req as AuthenticatedRequest).adminId!;
    await productService.deleteProduct(adminId, req.params.id);
    return ApiResponse.success(res, null, "Product deleted successfully");
  }
);

export const getProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const adminId = (req as AuthenticatedRequest).adminId!;
    const product = await productService.getProduct(adminId, req.params.id);
    return ApiResponse.success(res, product);
  }
);

export const listProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const query = listQuerySchema.parse(req.query);
    const adminId = (req as AuthenticatedRequest).adminId!;
    const result = await productService.listProducts(adminId, query);
    return ApiResponse.paginated(res, result.data, result.pagination);
  }
);

// --- Public Store Products ---

const publicListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export const listPublicProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const query = publicListQuerySchema.parse(req.query);
    const result = await productService.listPublicProducts(query);
    return ApiResponse.paginated(res, result.data, result.pagination);
  }
);

export const getPublicProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const product = await productService.getPublicProduct(req.params.id);
    return ApiResponse.success(res, product);
  }
);
