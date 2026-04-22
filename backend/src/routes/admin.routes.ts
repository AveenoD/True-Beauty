import { Router } from "express";
import * as adminAuthController from "../controllers/adminAuth.controller";
import { authenticateAdmin } from "../middleware/adminAuth";

const router = Router();

// Public auth routes
router.post("/register", adminAuthController.register);
router.post("/login", adminAuthController.login);
router.post("/refresh-token", adminAuthController.refreshToken);
router.post("/logout", adminAuthController.logout);

// Protected profile routes
router.get("/profile", authenticateAdmin, adminAuthController.getProfile);
router.put("/profile", authenticateAdmin, adminAuthController.updateProfile);
router.put("/profile/password", authenticateAdmin, adminAuthController.changePassword);

export default router;
