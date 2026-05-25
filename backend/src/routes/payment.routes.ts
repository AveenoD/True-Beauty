import { Router } from "express";
import * as paymentController from "../controllers/payment.controller";
import { requireTenant } from "../middleware/tenant";
import { authenticateTenantUser } from "../middleware/userTenantAuth";

const router = Router();
router.use(requireTenant);
router.use(authenticateTenantUser);

router.post("/initiate", paymentController.initiate);
router.post("/verify", paymentController.verify);

export default router;
