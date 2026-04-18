import { Response } from "express";
import * as returnService from "../services/return.service";
import { ApiResponse } from "../utils/ApiResponse";
import { AuthenticatedRequest } from "../types";

export const create = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId, productId, quantity, reason, images } = req.body;
    if (!orderId || !reason) return ApiResponse.badRequest(res, "orderId and reason required");
    const ret = await returnService.createReturn(req.userId!, { orderId, productId, quantity, reason, images });
    return ApiResponse.success(res, ret, "Return requested", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create return";
    return ApiResponse.error(res, message);
  }
};

export const list = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const returns = await returnService.listReturns(req.userId!);
    return ApiResponse.success(res, returns);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list returns";
    return ApiResponse.error(res, message);
  }
};

export const getOne = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ret = await returnService.getReturn(req.userId!, req.params.id);
    if (!ret) return ApiResponse.notFound(res, "Return not found");
    return ApiResponse.success(res, ret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get return";
    return ApiResponse.error(res, message);
  }
};
