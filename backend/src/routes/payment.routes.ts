import { Router } from "express";
import * as paymentController from "../controllers/payment.controller";
import { authenticateUser } from "../middleware/auth";

const router = Router();
router.use(authenticateUser);

router.post("/initiate", paymentController.initiate);
router.post("/verify", paymentController.verify);

export default router;
