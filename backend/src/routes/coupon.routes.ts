import { Router } from "express";
import * as couponController from "../controllers/coupon.controller";
import { authenticateAdmin } from "../middleware/adminAuth";

const router = Router();

router.use(authenticateAdmin);

router.get("/", couponController.list);
router.post("/", couponController.create);
router.put("/:id", couponController.update);
router.delete("/:id", couponController.remove);

export default router;
