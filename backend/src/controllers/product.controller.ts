import { Request, Response } from "express";
import * as productService from "../services/product.service";
import { ApiResponse } from "../utils/ApiResponse";
import { AuthenticatedRequest } from "../types";

export const list = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page, limit, categoryId, search, status } = req.query;
    const result = await productService.listProducts(req.adminId!, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      categoryId: categoryId as string,
      search: search as string,
      status: status as string,
    });
    return ApiResponse.success(res, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list products";
    return ApiResponse.error(res, message);
  }
};

export const create = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, categoryId, categoryName, price, discountPrice, stock, description, image, images, sku, status } = req.body;
    if (!name || !price) return ApiResponse.badRequest(res, "Name and price are required");

    const product = await productService.createProduct(req.adminId!, { name, categoryId, categoryName, price, discountPrice, stock, description, image, images, sku, status });
    return ApiResponse.success(res, product, "Product created", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    return ApiResponse.error(res, message);
  }
};

export const getOne = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const product = await productService.getProduct(req.adminId!, req.params.id);
    if (!product) return ApiResponse.notFound(res, "Product not found");
    return ApiResponse.success(res, product);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get product";
    return ApiResponse.error(res, message);
  }
};

export const update = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const product = await productService.updateProduct(req.adminId!, req.params.id, req.body);
    if (!product) return ApiResponse.notFound(res, "Product not found");
    return ApiResponse.success(res, product, "Product updated");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update product";
    return ApiResponse.error(res, message);
  }
};

export const remove = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await productService.deleteProduct(req.adminId!, req.params.id);
    return ApiResponse.success(res, null, "Product deleted");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete product";
    return ApiResponse.error(res, message);
  }
};

export const adjustInventory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId, operation, quantity, reason, note, referenceId } = req.body;
    if (!productId || !operation || quantity === undefined || !reason) {
      return ApiResponse.badRequest(res, "productId, operation, quantity, and reason are required");
    }
    if (!["add", "reduce", "set"].includes(operation)) {
      return ApiResponse.badRequest(res, "operation must be 'add', 'reduce', or 'set'");
    }
    const product = await productService.adjustInventory(req.adminId!, { productId, operation, quantity, reason, note, referenceId });
    return ApiResponse.success(res, product, "Inventory adjusted");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to adjust inventory";
    return ApiResponse.error(res, message);
  }
};
