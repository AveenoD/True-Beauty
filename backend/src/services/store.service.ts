import prisma from "../config/database";

async function getVerifiedOrderIdForReview(userId: string, adminId: string, productId: string) {
  const item = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: { userId, orderStatus: "delivered" },
      product: { adminId },
    },
    select: { orderId: true },
    orderBy: { createdAt: "desc" },
  });

  return item?.orderId ?? null;
}

export async function canUserReviewProduct(userId: string, adminId: string, productId: string) {
  // Ensure product belongs to tenant and exists
  const product = await prisma.product.findFirst({
    where: { id: productId, adminId, deletedAt: null, status: "active" },
    select: { id: true },
  });
  if (!product) {
    return { canReview: false, reason: "product_not_found" as const };
  }

  const orderId = await getVerifiedOrderIdForReview(userId, adminId, productId);
  if (!orderId) {
    return { canReview: false, reason: "not_verified_purchase" as const };
  }

  const already = await prisma.reviewRating.findFirst({
    where: { userId, productId, orderId },
    select: { id: true, status: true },
  });
  if (already) {
    return { canReview: false, reason: "already_reviewed" as const };
  }

  return { canReview: true, orderId };
}

export async function createProductReview(
  userId: string,
  adminId: string,
  productId: string,
  data: { rating: number; comment?: string | null; images?: string[] }
) {
  const can = await canUserReviewProduct(userId, adminId, productId);
  if (!can.canReview) {
    const reason = (can as any).reason as string;
    const message =
      reason === "not_verified_purchase"
        ? "Only verified buyers can write reviews for this product."
        : reason === "already_reviewed"
          ? "You have already reviewed this product."
          : "Product not found";
    const err = new Error(message);
    (err as any).statusCode = reason === "product_not_found" ? 404 : 403;
    (err as any).reason = reason;
    throw err;
  }

  const rating = Math.max(1, Math.min(5, Math.round(Number(data.rating))));
  const comment = typeof data.comment === "string" ? data.comment.trim() : "";
  const images = Array.isArray(data.images)
    ? data.images
        .filter((s) => typeof s === "string")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 5)
    : [];

  return prisma.reviewRating.create({
    data: {
      userId,
      productId,
      orderId: (can as any).orderId,
      rating,
      comment: comment || null,
      images,
      isVerifiedPurchase: true,
      status: "pending",
    },
    select: {
      id: true,
      rating: true,
      comment: true,
      images: true,
      status: true,
      isVerifiedPurchase: true,
      createdAt: true,
      user: { select: { id: true, name: true } },
    },
  });
}

export async function getProductReviewSummary(adminId: string, productId: string) {
  const where = {
    productId,
    status: "approved" as const,
    product: { adminId },
  };

  const [agg, count] = await Promise.all([
    prisma.reviewRating.aggregate({
      where,
      _avg: { rating: true },
    }),
    prisma.reviewRating.count({ where }),
  ]);

  const avg = agg._avg.rating ?? null;
  return { avgRating: avg != null ? Number(avg) : null, reviewCount: count };
}

export async function listProductReviews(
  adminId: string,
  productId: string,
  query: { page?: number; limit?: number } = {}
) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(50, Math.max(1, query.limit || 10));
  const skip = (page - 1) * limit;

  const where = {
    productId,
    status: "approved" as const,
    product: { adminId },
  };

  const [items, total, summary] = await Promise.all([
    prisma.reviewRating.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        rating: true,
        comment: true,
        images: true,
        isVerifiedPurchase: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.reviewRating.count({ where }),
    getProductReviewSummary(adminId, productId),
  ]);

  return {
    data: items,
    summary,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function listProducts(
  adminId: string,
  query: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  sort?: string;
  order?: "asc" | "desc";
}) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    adminId,
    deletedAt: null,
    status: "active",
  };

  if (query.category) {
    // Product model stores category as `categoryName` (string) + `categoryId` (relation)
    where.categoryName = query.category;
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {};
    if (query.minPrice !== undefined) {
      (where.price as Record<string, number>).gte = query.minPrice;
    }
    if (query.maxPrice !== undefined) {
      (where.price as Record<string, number>).lte = query.maxPrice;
    }
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        categoryId: true,
        categoryName: true,
        price: true,
        discountPrice: true,
        stock: true,
        stockStatus: true,
        image: true,
        images: true,
        description: true,
        howToUseText: true,
        howToUseVideo: true,
        commissionRate: true,
        isAffiliateProduct: true,
        isLatestProduct: true,
        sku: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProduct(adminId: string, id: string) {
  const product = await prisma.product.findFirst({
    where: {
      id,
      adminId,
      deletedAt: null,
      status: "active",
    },
    select: {
      id: true,
      name: true,
      categoryId: true,
      categoryName: true,
      price: true,
      discountPrice: true,
      stock: true,
      stockStatus: true,
      status: true,
      image: true,
      images: true,
      description: true,
      howToUseText: true,
      howToUseVideo: true,
      commissionRate: true,
      isAffiliateProduct: true,
      isLatestProduct: true,
      sku: true,
      stockThreshold: true,
      stockLocation: true,
      supplier: true,
      inventoryNotes: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  const summary = await getProductReviewSummary(adminId, id);
  return { ...product, reviewSummary: summary };
}

export async function listServices(
  adminId: string,
  query: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  status?: string;
}) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    adminId,
    status: "active",
  };

  if (query.category) {
    where.category = query.category;
  }

  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [services, total] = await Promise.all([
    prisma.myService.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        duration: true,
        price: true,
        discountedPrice: true,
        images: true,
        howToUseType: true,
        howToUseText: true,
        howToUseVideo: true,
        workingHours: true,
        workingDays: true,
        bookingConfirmationMode: true,
        status: true,
        isFeatured: true,
        totalBookings: true,
        avgRating: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.myService.count({ where }),
  ]);

  return {
    data: services,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getService(adminId: string, id: string) {
  const service = await prisma.myService.findFirst({
    where: { id, adminId, status: "active" },
    select: {
      id: true,
      name: true,
      category: true,
      description: true,
      duration: true,
      price: true,
      discountedPrice: true,
      images: true,
      howToUseType: true,
      howToUseText: true,
      howToUseVideo: true,
      workingHours: true,
      workingDays: true,
      bookingConfirmationMode: true,
      status: true,
      isFeatured: true,
      totalBookings: true,
      avgRating: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!service) {
    throw new Error("Service not found");
  }

  return service;
}
