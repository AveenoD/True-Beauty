import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { authenticateAdmin } from "../middleware/auth";

const router = Router();

// --- Public Admin Auth Routes ---
router.post("/auth/register", adminController.register);
router.post("/auth/login", adminController.login);
router.post("/auth/refresh-token", adminController.refreshToken);

// --- Protected Admin Routes (require auth) ---
router.use(authenticateAdmin);

router.post("/auth/logout", adminController.logout);

export default router;
