import { Router } from "express";
import * as plansController from "../controllers/plans.controller";

const router = Router();

// Public plans routes (no auth required)
router.get("/", plansController.listPlans);
router.get("/:id/addons", plansController.listAddons);

export default router;