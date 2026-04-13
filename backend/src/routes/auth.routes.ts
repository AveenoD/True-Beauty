import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();

// Public auth routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/refresh-token", authController.refreshToken);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

export default router;