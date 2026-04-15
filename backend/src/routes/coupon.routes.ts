import { Router } from "express";
import * as couponController from "../controllers/coupon.controller";
import { authenticateAdmin } from "../middleware/auth";

const router = Router();

router.use(authenticateAdmin);

router.get("/", couponController.listCoupons);
router.get("/:id", couponController.getCoupon);
router.post("/", couponController.createCoupon);
router.put("/:id", couponController.updateCoupon);
router.delete("/:id", couponController.deleteCoupon);
router.post("/:id/toggle-active", couponController.toggleCouponActive);

export default router;
