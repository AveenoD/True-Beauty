import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import * as userController from "../controllers/user.controller";
import * as meController from "../controllers/me.controller";
import { requireTenant } from "../middleware/tenant";
import { authenticateTenantUser } from "../middleware/userTenantAuth";

const router = Router();

// --- Public Auth Routes ---
router.use(requireTenant);
router.get("/verify-email", authController.verifyEmail);
router.post("/register", authController.register);
router.post("/resend-verification", authController.resendVerification);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// --- Protected Routes (auth + same tenant as X-Tenant-Slug / Host) ---
router.use(authenticateTenantUser);

router.get("/me", meController.me);
router.post("/logout", authController.logout);
router.post("/change-password", authController.changePassword);
router.delete("/delete-account", authController.deleteAccount);
router.get("/profile", userController.getProfile);
router.put("/profile", userController.updateProfile);
router.get("/addresses", userController.getAddresses);
router.post("/addresses", userController.createAddress);
router.put("/addresses/:id", userController.updateAddress);
router.delete("/addresses/:id", userController.deleteAddress);

export default router;