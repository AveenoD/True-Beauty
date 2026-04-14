import { Router } from "express";
import { authenticateUser } from "../middleware/auth";
import * as affiliateController from "../controllers/affiliate.controller";

const router = Router();

// All affiliate routes require authentication
router.use(authenticateUser);

// Apply to become affiliate (generates referralCode)
router.post("/apply", affiliateController.applyAffiliate);

// Get own affiliate profile
router.get("/profile", affiliateController.getAffiliateProfile);

// Get affiliate statistics (referrals, earnings, orders)
router.get("/stats", affiliateController.getAffiliateStats);

// Get wallet balance and transaction history
router.get("/wallet", affiliateController.getWalletHistory);

// Request withdrawal
router.post("/wallet/withdraw", affiliateController.requestWithdrawal);

// List withdrawal history
router.get("/wallet/withdrawals", affiliateController.getWithdrawalHistory);

// Update bank details
router.put("/bank-details", affiliateController.updateBankDetails);

export default router;