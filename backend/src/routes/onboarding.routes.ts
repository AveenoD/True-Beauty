import { Router } from "express";
import { authenticateAdmin } from "../middleware/auth";
import * as onboardingController from "../controllers/onboarding.controller";

const router = Router();

/**
 * ONBOARDING WIZARD ROUTES
 * All routes require admin authentication
 */

// Step 1: Get onboarding progress
router.get("/progress", authenticateAdmin, onboardingController.getProgress);

// Step 2: Save business details
router.put("/business-details", authenticateAdmin, onboardingController.saveBusinessDetails);

// Step 3: Select plan and addons
router.post("/select-plan", authenticateAdmin, onboardingController.selectPlanAndAddons);

// Step 4: Upload KYC documents
router.post("/kyc-documents", authenticateAdmin, onboardingController.uploadKycDocuments);

// Step 5: Save bank details
router.put("/bank-details", authenticateAdmin, onboardingController.saveBankDetails);

// Step 6: Complete onboarding
router.post("/complete", authenticateAdmin, onboardingController.completeOnboarding);

export default router;
