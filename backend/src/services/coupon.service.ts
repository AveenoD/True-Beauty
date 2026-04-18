import prisma from "../config/database";

export async function listCoupons(adminId: string) {
  return prisma.coupon.findMany({
    where: { adminId },
    include: {
      applicableProducts: true,
      applicableCategories: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCoupon(adminId: string, data: {
  code: string; discountType: string; discountValue: number; description?: string;
  minimumOrderAmount?: number; usageLimitTotal?: number; usageLimitPerUser?: number;
  maxDiscountCap?: number; applicableRole?: string; startDate?: Date; endDate?: Date;
  applicableProductIds?: string[]; applicableCategories?: string[];
}) {
  const coupon = await prisma.coupon.create({
    data: {
      adminId,
      code: data.code.toUpperCase(),
      description: data.description,
      discountType: data.discountType as any,
      discountValue: data.discountValue,
      minimumOrderAmount: data.minimumOrderAmount,
      usageLimitTotal: data.usageLimitTotal,
      usageLimitPerUser: data.usageLimitPerUser,
      maxDiscountCap: data.maxDiscountCap,
      applicableRole: (data.applicableRole as any) || "all",
      startDate: data.startDate,
      endDate: data.endDate,
      applicableProducts: data.applicableProductIds ? {
        create: data.applicableProductIds.map((productId) => ({ productId })),
      } : undefined,
      applicableCategories: data.applicableCategories ? {
        create: data.applicableCategories.map((category) => ({ category })),
      } : undefined,
    },
  });
  return coupon;
}

export async function updateCoupon(adminId: string, id: string, data: Partial<{
  code; description; discountType; discountValue; minimumOrderAmount;
  usageLimitTotal; usageLimitPerUser; maxDiscountCap; applicableRole; isActive; startDate; endDate;
}>) {
  const coupon = await prisma.coupon.findFirst({ where: { id, adminId } });
  if (!coupon) return null;

  return prisma.coupon.update({
    where: { id },
    data: {
      ...data,
      ...(data.code ? { code: data.code.toUpperCase() } : {}),
    },
  });
}

export async function deleteCoupon(adminId: string, id: string) {
  return prisma.coupon.deleteMany({ where: { id, adminId } });
}

export async function validateCoupon(code: string, userId: string, subTotal: number, adminId: string) {
  const coupon = await prisma.coupon.findFirst({
    where: { code: code.toUpperCase(), adminId, isActive: true },
  });

  if (!coupon) throw new Error("Invalid coupon code");
  if (coupon.startDate && coupon.startDate > new Date()) throw new Error("Coupon not yet active");
  if (coupon.endDate && coupon.endDate < new Date()) throw new Error("Coupon expired");
  if (coupon.usageLimitTotal && coupon.usageLimitTotal <= 0) throw new Error("Coupon usage limit reached");

  const discount = coupon.discountType === "percentage"
    ? Math.min((subTotal * coupon.discountValue) / 100, coupon.maxDiscountCap ?? Infinity)
    : coupon.discountValue;

  if (coupon.minimumOrderAmount && subTotal < coupon.minimumOrderAmount) {
    throw new Error(`Minimum order amount is ${coupon.minimumOrderAmount}`);
  }

  return { coupon, discount: Math.round(discount * 100) / 100 };
}
