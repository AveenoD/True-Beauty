import { Router } from "express";
import * as paymentController from "../controllers/payment.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();

router.use(authenticateUser);

router.post("/initiate", paymentController.initiatePayment);
router.post("/verify", paymentController.verifyPayment);
router.get("/status/:orderId", paymentController.getPaymentStatus);

export default router;
