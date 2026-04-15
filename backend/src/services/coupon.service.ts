import prisma from "../config/database";
import crypto from "crypto";

// Generate a random coupon code
function generateCouponCode(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

// ============================================================
// ADMIN COUPON MANAGEMENT
// ============================================================

export async function createCoupon(adminId: string, data: {
  code?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minimumOrderAmount?: number;
  usageLimitTotal?: number;
  usageLimitPerUser?: number;
  maxDiscountCap?: number;
  applicableRole?: "all" | "customers" | "affiliate";
  startDate?: string;
  endDate?: string;
  applicableProductIds?: string[];
  applicableCategories?: string[];
}) {
  const code = data.code || generateCouponCode();

  // Check if code already exists
  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) {
    throw new Error("Coupon code already exists");
  }

  const coupon = await prisma.coupon.create({
    data: {
      adminId,
      code,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minimumOrderAmount: data.minimumOrderAmount,
      usageLimitTotal: data.usageLimitTotal,
      usageLimitPerUser: data.usageLimitPerUser,
      maxDiscountCap: data.maxDiscountCap,
      applicableRole: data.applicableRole as "all" | "customers" | "affiliate" || "all",
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      isActive: true,
    },
  });

  // Link applicable products
  if (data.applicableProductIds?.length) {
    await prisma.couponApplicableProduct.createMany({
      data: data.applicableProductIds.map(productId => ({
        couponId: coupon.id,
        productId,
      })),
      skipDuplicates: true,
    });
  }

  // Link applicable categories
  if (data.applicableCategories?.length) {
    await prisma.couponApplicableCategory.createMany({
      data: data.applicableCategories.map(category => ({
        couponId: coupon.id,
        category,
      })),
      skipDuplicates: true,
    });
  }

  return coupon;
}

export async function updateCoupon(adminId: string, couponId: string, data: {
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  minimumOrderAmount?: number;
  usageLimitTotal?: number;
  usageLimitPerUser?: number;
  maxDiscountCap?: number;
  applicableRole?: "all" | "customers" | "affiliate";
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}) {
  const existing = await prisma.coupon.findFirst({
    where: { id: couponId, adminId },
  });

  if (!existing) {
    throw new Error("Coupon not found");
  }

  return prisma.coupon.update({
    where: { id: couponId },
    data: {
      discountType: data.discountType,
      discountValue: data.discountValue,
      minimumOrderAmount: data.minimumOrderAmount,
      usageLimitTotal: data.usageLimitTotal,
      usageLimitPerUser: data.usageLimitPerUser,
      maxDiscountCap: data.maxDiscountCap,
      applicableRole: data.applicableRole,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      isActive: data.isActive,
    },
  });
}

export async function deleteCoupon(adminId: string, couponId: string) {
  const existing = await prisma.coupon.findFirst({
    where: { id: couponId, adminId },
  });

  if (!existing) {
    throw new Error("Coupon not found");
  }

  // Soft delete by deactivating
  return prisma.coupon.update({
    where: { id: couponId },
    data: { isActive: false },
  });
}

export async function toggleCouponActive(adminId: string, couponId: string) {
  const existing = await prisma.coupon.findFirst({
    where: { id: couponId, adminId },
  });

  if (!existing) {
    throw new Error("Coupon not found");
  }

  return prisma.coupon.update({
    where: { id: couponId },
    data: { isActive: !existing.isActive },
  });
}

export async function getCoupon(adminId: string, couponId: string) {
  const coupon = await prisma.coupon.findFirst({
    where: { id: couponId, adminId },
    include: {
      applicableProducts: { include: { product: { select: { id: true, name: true, price: true } } } },
      applicableCategories: true,
    },
  });

  if (!coupon) {
    throw new Error("Coupon not found");
  }

  return coupon;
}

export async function listCoupons(adminId: string, options: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { adminId };

  if (options.isActive !== undefined) {
    where.isActive = options.isActive;
  }

  if (options.search) {
    where.code = { contains: options.search, mode: "insensitive" };
  }

  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.coupon.count({ where }),
  ]);

  return {
    data: coupons,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================================
// USER COUPON VALIDATION
// ============================================================

export async function validateCoupon(userId: string, couponCode: string, cartSubtotal: number) {
  const coupon = await prisma.coupon.findUnique({
    where: { code: couponCode },
    include: {
      applicableProducts: true,
      applicableCategories: true,
    },
  });

  if (!coupon) {
    throw new Error("Invalid coupon code");
  }

  if (!coupon.isActive) {
    throw new Error("This coupon is no longer active");
  }

  if (coupon.startDate && new Date() < coupon.startDate) {
    throw new Error("This coupon is not yet active");
  }

  if (coupon.endDate && new Date() > coupon.endDate) {
    throw new Error("This coupon has expired");
  }

  if (coupon.usageLimitTotal !== null) {
    const usageCount = await prisma.order.count({ where: { couponId: coupon.id } });
    if (usageCount >= coupon.usageLimitTotal) {
      throw new Error("This coupon has reached its usage limit");
    }
  }

  if (coupon.usageLimitPerUser !== null) {
    const userUsageCount = await prisma.order.count({
      where: { couponId: coupon.id, userId },
    });
    if (userUsageCount >= coupon.usageLimitPerUser) {
      throw new Error("You have already used this coupon the maximum number of times");
    }
  }

  if (coupon.minimumOrderAmount && cartSubtotal < coupon.minimumOrderAmount) {
    throw new Error(`Minimum order amount of ₹${coupon.minimumOrderAmount} required for this coupon`);
  }

  let discount = 0;
  if (coupon.discountType === "percentage") {
    discount = (cartSubtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscountCap) {
      discount = Math.min(discount, coupon.maxDiscountCap);
    }
  } else {
    discount = Math.min(coupon.discountValue, cartSubtotal);
  }

  return {
    valid: true,
    couponCode: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    calculatedDiscount: Math.round(discount * 100) / 100,
    message: `Coupon applied! You save ₹${Math.round(discount * 100) / 100}`,
  };
}
