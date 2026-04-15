import { Router } from "express";
import * as orderController from "../controllers/order.controller";
import { authenticateAdmin } from "../middleware/auth";

const router = Router();

router.use(authenticateAdmin);

router.get("/", orderController.listAdminOrders);
router.get("/:id", orderController.getAdminOrder);
router.put("/:id/status", orderController.updateOrderStatus);
router.post("/:id/cancel", orderController.cancelAdminOrder);

export default router;
