import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();

// All user routes require authentication
router.use(authenticateUser);

router.get("/profile", userController.getProfile);
router.put("/profile", userController.updateProfile);
router.get("/addresses", userController.getAddresses);
router.post("/addresses", userController.createAddress);
router.put("/addresses/:id", userController.updateAddress);
router.delete("/addresses/:id", userController.deleteAddress);

export default router;