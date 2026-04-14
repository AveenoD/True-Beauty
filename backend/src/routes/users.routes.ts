import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import * as userController from "../controllers/user.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();

// --- Public Auth Routes ---
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshTokenHandler);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// --- Protected Routes (require auth) ---
router.use(authenticateUser);

router.post("/logout", authController.logout);
router.get("/profile", userController.getProfile);
router.put("/profile", userController.updateProfile);
router.get("/addresses", userController.getAddresses);
router.post("/addresses", userController.createAddress);
router.put("/addresses/:id", userController.updateAddress);
router.delete("/addresses/:id", userController.deleteAddress);

export default router;