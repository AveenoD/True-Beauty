import prisma from "../config/database";

export async function listProducts(
  tenantId: string,
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
  }
) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    deletedAt: null,
    status: "active",
    adminId: tenantId, // RULE #1: Tenant scope filter
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
        category: true,
        price: true,
        discountPrice: true,
        stock: true,
        stockStatus: true,
        image: true,
        images: true,
        description: true,
        commissionRate: true,
        isAffiliateProduct: true,
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

export async function getProduct(tenantId: string, id: string) {
  const product = await prisma.product.findFirst({
    where: {
      id,
      deletedAt: null,
      status: "active",
      adminId: tenantId, // RULE #1: Tenant scope filter
    },
    select: {
      id: true,
      name: true,
      category: true,
      price: true,
      discountPrice: true,
      stock: true,
      stockStatus: true,
      status: true,
      image: true,
      images: true,
      description: true,
      commissionRate: true,
      isAffiliateProduct: true,
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

  return product;
}

export async function listServices(
  tenantId: string,
  query: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    status?: string;
  }
) {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    status: "active",
    adminId: tenantId, // RULE #1: Tenant scope filter
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

export async function getService(tenantId: string, id: string) {
  const service = await prisma.myService.findFirst({
    where: {
      id,
      status: "active",
      adminId: tenantId, // RULE #1: Tenant scope filter
    },
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
