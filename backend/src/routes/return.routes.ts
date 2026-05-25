import { Router } from "express";
import * as returnController from "../controllers/return.controller";
import { requireTenant } from "../middleware/tenant";
import { authenticateTenantUser } from "../middleware/userTenantAuth";

const router = Router();
router.use(requireTenant);
router.use(authenticateTenantUser);

router.post("/", returnController.create);
router.get("/", returnController.list);
router.get("/:id", returnController.getOne);

export default router;
