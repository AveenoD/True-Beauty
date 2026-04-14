import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import * as userController from "../controllers/user.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();

// --- Public Auth Routes ---
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// --- Email Verification Routes (public) ---
router.get("/verify-email", authController.verifyEmail);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerification);

// --- Protected Routes (require auth) ---
router.use(authenticateUser);

router.post("/logout", authController.logout);

// Profile routes
router.get("/profile", userController.getProfile);
router.put("/profile", userController.updateProfile);

// Address routes
router.get("/addresses", userController.getAddresses);
router.post("/addresses", userController.createAddress);
router.put("/addresses/:id", userController.updateAddress);
router.delete("/addresses/:id", userController.deleteAddress);

// Notification routes
router.get("/notifications", userController.getNotifications);
router.get("/notifications/unread-count", userController.getUnreadCount);
router.put("/notifications/:id/read", userController.markNotificationRead);
router.put("/notifications/read-all", userController.markAllNotificationsRead);

export default router;