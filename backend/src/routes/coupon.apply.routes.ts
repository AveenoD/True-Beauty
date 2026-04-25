import { Router } from "express";
import { authenticateUser } from "../middleware/auth";
import { requireTenant } from "../middleware/tenant";
import prisma from "../config/database";

const router = Router();

// POST /coupon/apply - User applies coupon to their cart
router.post("/apply", requireTenant, authenticateUser, async (req, res) => {
  try {
    const { code, subTotal, adminId } = req.body;
    if (!code || !subTotal) {
      return res.status(400).json({ success: false, message: "code and subTotal required" });
    }

    const coupon = await prisma.coupon.findFirst({
      where: { code: code.toUpperCase(), adminId, isActive: true },
    });

    if (!coupon) throw new Error("Invalid coupon code");
    if (coupon.startDate && coupon.startDate > new Date()) throw new Error("Coupon not yet active");
    if (coupon.endDate && coupon.endDate < new Date()) throw new Error("Coupon expired");

    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = (subTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountCap) discount = Math.min(discount, coupon.maxDiscountCap);
    } else {
      discount = coupon.discountValue;
    }

    discount = Math.round(discount * 100) / 100;
    return res.json({ success: true, data: { coupon: { id: coupon.id, code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue }, discount } });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Failed" });
  }
});

export default router;
