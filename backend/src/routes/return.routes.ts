import { Router } from "express";
import * as returnController from "../controllers/return.controller";
import { authenticateAdmin } from "../middleware/auth";

const router = Router();

router.use(authenticateAdmin);

router.get("/", returnController.listAdminReturns);
router.get("/:id", returnController.getAdminReturn);
router.put("/:id/status", returnController.updateReturnStatus);

export default router;
