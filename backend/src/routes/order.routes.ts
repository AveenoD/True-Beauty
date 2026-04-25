import { Router } from "express";
import * as orderController from "../controllers/order.controller";
import { authenticateUser } from "../middleware/auth";
import { requireTenant } from "../middleware/tenant";

const router = Router();
router.use(requireTenant);
router.use(authenticateUser);

router.post("/", orderController.createOrder);
router.get("/", orderController.listOrders);
router.get("/:id", orderController.getOrder);
router.put("/:id/cancel", orderController.cancelOrder);

export default router;
