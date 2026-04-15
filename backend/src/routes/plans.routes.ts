import { Router } from "express";
import * as plansController from "../controllers/plans.controller";
import * as onboardingController from "../controllers/onboarding.controller";

const router = Router();

// Public plans routes (no auth required)
router.get("/", plansController.listPlans);
router.get("/addons", onboardingController.getAddons);
router.get("/:id/addons", plansController.listAddons);

export default router;