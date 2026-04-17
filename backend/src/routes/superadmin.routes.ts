import { Router } from "express";
import * as superadminController from "../controllers/superadmin.controller";
import { authenticateSuperAdmin } from "../middleware/superadminAuth";

const router = Router();

router.post("/login", superadminController.login);

router.use(authenticateSuperAdmin);

router.put("/admins/:id/verify", superadminController.verifyAdminOnboarding);
router.get("/admins", superadminController.listAdmins);
router.get("/admins/:id", superadminController.getAdmin);
router.put("/admins/:id/disable", superadminController.disableAdmin);
router.put("/admins/:id/enable", superadminController.enableAdmin);

export default router;

