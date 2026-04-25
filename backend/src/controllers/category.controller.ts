import { Request, Response } from "express";
import { z } from "zod";
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
    const { name, slug } = req.body;
    if (!name) return ApiResponse.badRequest(res, "Name is required");

    const category = await categoryService.createCategory(req.adminId!, { name, slug });
    return ApiResponse.success(res, category, "Category created", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create category";
    return ApiResponse.error(res, message);
  }
};

export const getOne = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    const category = await categoryService.getCategory(req.adminId!, id);
    if (!category) return ApiResponse.notFound(res, "Category not found");
    return ApiResponse.success(res, category);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get category";
    return ApiResponse.error(res, message);
  }
};

export const update = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, slug, isActive } = req.body;
    const id = z.string().min(1).parse(req.params.id);
    const category = await categoryService.updateCategory(req.adminId!, id, { name, slug, isActive });
    if (!category) return ApiResponse.notFound(res, "Category not found");
    return ApiResponse.success(res, category, "Category updated");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update category";
    return ApiResponse.error(res, message);
  }
};

export const remove = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = z.string().min(1).parse(req.params.id);
    await categoryService.deleteCategory(req.adminId!, id);
    return ApiResponse.success(res, null, "Category deleted");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete category";
    return ApiResponse.error(res, message);
  }
};
