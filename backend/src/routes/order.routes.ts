import { Router } from "express";
import * as orderController from "../controllers/order.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();
router.use(authenticateUser);

router.post("/", orderController.createOrder);
router.get("/", orderController.listOrders);
router.get("/:id", orderController.getOrder);
router.put("/:id/cancel", orderController.cancelOrder);

export default router;
