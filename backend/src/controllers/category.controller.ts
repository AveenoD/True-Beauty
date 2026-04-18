import { Request, Response } from "express";
import * as categoryService from "../services/category.service";
import { ApiResponse } from "../utils/ApiResponse";
import { AuthenticatedRequest } from "../types";

export const list = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = await categoryService.listCategories(req.adminId!);
    return ApiResponse.success(res, categories);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list categories";
    return ApiResponse.error(res, message);
  }
};

export const create = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, slug, image, sortOrder } = req.body;
    if (!name) return ApiResponse.badRequest(res, "Name is required");

    const category = await categoryService.createCategory(req.adminId!, { name, slug, image, sortOrder });
    return ApiResponse.success(res, category, "Category created", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create category";
    return ApiResponse.error(res, message);
  }
};

export const getOne = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const category = await categoryService.getCategory(req.adminId!, req.params.id);
    if (!category) return ApiResponse.notFound(res, "Category not found");
    return ApiResponse.success(res, category);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get category";
    return ApiResponse.error(res, message);
  }
};

export const update = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, slug, image, isActive, sortOrder } = req.body;
    const category = await categoryService.updateCategory(req.adminId!, req.params.id, { name, slug, image, isActive, sortOrder });
    if (!category) return ApiResponse.notFound(res, "Category not found");
    return ApiResponse.success(res, category, "Category updated");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update category";
    return ApiResponse.error(res, message);
  }
};

export const remove = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await categoryService.deleteCategory(req.adminId!, req.params.id);
    return ApiResponse.success(res, null, "Category deleted");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete category";
    return ApiResponse.error(res, message);
  }
};
