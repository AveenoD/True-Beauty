import { Router } from "express";
import * as orderController from "../controllers/order.controller";
import { requireTenant } from "../middleware/tenant";
import { authenticateTenantUser } from "../middleware/userTenantAuth";

const router = Router();
router.use(requireTenant);
router.use(authenticateTenantUser);

router.post("/", orderController.createOrder);
router.get("/", orderController.listOrders);
router.get("/:id", orderController.getOrder);
router.put("/:id/cancel", orderController.cancelOrder);

export default router;
