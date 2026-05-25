import { Router, Response } from "express";
import { requireTenant } from "../middleware/tenant";
import { authenticateTenantUser } from "../middleware/userTenantAuth";
import prisma from "../config/database";
import { AuthenticatedRequest } from "../types";

const router = Router();

// POST /coupon/apply - User applies coupon to their cart (tenant-scoped)
router.post(
  "/apply",
  requireTenant,
  ...authenticateTenantUser,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { code, subTotal } = req.body;
      const tenantAdminId = req.tenantAdminId!;

      if (!code || subTotal === undefined || subTotal === null) {
        return res.status(400).json({ success: false, message: "code and subTotal required" });
      }

      const coupon = await prisma.coupon.findFirst({
        where: {
          code: String(code).toUpperCase(),
          adminId: tenantAdminId,
          isActive: true,
        },
      });

      if (!coupon) throw new Error("Invalid coupon code");
      if (coupon.startDate && coupon.startDate > new Date()) throw new Error("Coupon not yet active");
      if (coupon.endDate && coupon.endDate < new Date()) throw new Error("Coupon expired");

      const sub = Number(subTotal);
      let discount = 0;
      if (coupon.discountType === "percentage") {
        discount = (sub * coupon.discountValue) / 100;
        if (coupon.maxDiscountCap) discount = Math.min(discount, coupon.maxDiscountCap);
      } else {
        discount = coupon.discountValue;
      }

      discount = Math.round(discount * 100) / 100;
      return res.json({
        success: true,
        data: {
          coupon: {
            id: coupon.id,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
          },
          discount,
        },
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed",
      });
    }
  }
);

export default router;
