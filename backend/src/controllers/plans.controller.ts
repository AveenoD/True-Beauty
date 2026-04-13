import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as plansService from "../services/plans.service";

export const listPlans = asyncHandler(
  async (_req: Request, res: Response) => {
    const plans = await plansService.listPlans();
    return ApiResponse.success(res, plans, "Plans retrieved");
  }
);

export const listAddons = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const schema = z.object({
      id: z.string().uuid("Invalid plan ID"),
    });

    const { id: planId } = schema.parse(req.params);
    const addons = await plansService.listAddonsForPlan(planId);

    return ApiResponse.success(res, addons, "Addons retrieved");
  }
);