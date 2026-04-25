import { Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { AuthenticatedRequest } from "../types";

export async function me(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return ApiResponse.unauthorized(res, "Unauthorized");
  }
  return ApiResponse.success(res, req.user, "Me");
}

