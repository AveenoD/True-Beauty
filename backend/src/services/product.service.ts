import prisma from "../config/database";

const DEFAULT_STOCK_STATUS = "in_stock";
const DEFAULT_STATUS = "active";

export async function createProduct(adminId: string, data: {
  name: string;
  category: string;
  price: number;
  discountPrice?: number;
  commissionRate?: number;
  stock?: number;
  stockStatus?: string;
  status?: string;
  image?: string;
  images?: string[];
  description?: string;
  sku?: string;
  stockThreshold?: number;
  stockLocation?: string;
  supplier?: string;
  inventoryNotes?: string;
}) {
  const product = await prisma.product.create({
    data: {
      adminId,
      name: data.name,
      category: data.category,
      price: data.price,
      discountPrice: data.discountPrice,
      commissionRate: data.commissionRate,
      stock: data.stock ?? 0,
      stockStatus: data.stockStatus ?? DEFAULT_STOCK_STATUS,
      status: data.status ?? DEFAULT_STATUS,
      image: data.image,
      images: data.images ?? [],
      description: data.description,
      sku: data.sku,
      stockThreshold: data.stockThreshold,
      stockLocation: data.stockLocation,
      supplier: data.supplier,
      inventoryNotes: data.inventoryNotes,
    },
  });

  // Auto-create inventory record
  const initialQty = data.stock ?? 0;
  await prisma.inventory.create({
    data: {
      productId: product.id,
      quantity: initialQty,
      reservedQty: 0,
      availableQty: initialQty,
      updatedBy: adminId,
    },
  });

  // Auto-create inventory log
  if (initialQty > 0) {
    await prisma.inventoryLog.create({
      data: {
        inventoryId: product.id,
        changeType: "initial_stock",
        changeAmount: initialQty,
        previousQty: 0,
        newQty: initialQty,
        reason: "Initial stock on product creation",
        adminId,
      },
    });
  }

  return product;
}

export async function updateProduct(adminId: string, productId: string, data: {
  name?: string;
  category?: string;
  price?: number;
  discountPrice?: number;
  commissionRate?: number;
  stock?: number;
  stockStatus?: string;
  status?: string;
  image?: string;
  images?: string[];
  description?: string;
  sku?: string;
  stockThreshold?: number;
  stockLocation?: string;
  supplier?: string;
  inventoryNotes?: string;
}) {
  // Verify ownership
  const existing = await prisma.product.findFirst({
    where: { id: productId, adminId },
  });

  if (!existing) {
    throw new Error("Product not found");
  }

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      name: data.name,
      category: data.category,
      price: data.price,
      discountPrice: data.discountPrice,
      commissionRate: data.commissionRate,
      stock: data.stock,
      stockStatus: data.stockStatus,
      status: data.status,
      image: data.image,
      images: data.images,
      description: data.description,
      sku: data.sku,
      stockThreshold: data.stockThreshold,
      stockLocation: data.stockLocation,
      supplier: data.supplier,
      inventoryNotes: data.inventoryNotes,
    },
  });

  // If stock was updated, sync inventory
  if (data.stock !== undefined) {
    const inventory = await prisma.inventory.findUnique({
      where: { productId },
    });

    if (inventory) {
      const diff = data.stock - inventory.quantity;
      await prisma.inventory.update({
        where: { productId },
        data: {
          quantity: data.stock,
          availableQty: data.stock - inventory.reservedQty,
          lastUpdated: new Date(),
          updatedBy: adminId,
        },
      });

      await prisma.inventoryLog.create({
        data: {
          inventoryId: inventory.id,
          changeType: diff >= 0 ? "stock_increase" : "stock_decrease",
          changeAmount: Math.abs(diff),
          previousQty: inventory.quantity,
          newQty: data.stock,
          reason: "Stock updated via product edit",
          adminId,
        },
      });
    }
  }

  return product;
}

export async function deleteProduct(adminId: string, productId: string) {
  const existing = await prisma.product.findFirst({
    where: { id: productId, adminId },
  });

  if (!existing) {
    throw new Error("Product not found");
  }

  // Soft delete
  return prisma.product.update({
    where: { id: productId },
    data: {
      deletedAt: new Date(),
      status: "deleted",
    },
  });
}

export async function getProduct(adminId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, adminId },
    include: {
      inventory: true,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
}

export async function listProducts(adminId: string, options: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  status?: string;
  sort?: string;
  order?: string;
}) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    adminId,
    deletedAt: null,
  };

  if (options.category) {
    where.category = options.category;
  }

  if (options.status) {
    where.status = options.status;
  }

  if (options.search) {
    where.OR = [
      { name: { contains: options.search, mode: "insensitive" } },
      { description: { contains: options.search, mode: "insensitive" } },
      { sku: { contains: options.search, mode: "insensitive" } },
    ];
  }

  const validSortFields = ["name", "price", "stock", "createdAt", "updatedAt"];
  const sortField = validSortFields.includes(options.sort ?? "") ? options.sort : "createdAt";
  const sortOrder = options.order === "asc" ? "asc" : "desc";

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortField]: sortOrder },
      include: {
        inventory: true,
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

// Public store-facing product listing
export async function listPublicProducts(options: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  order?: string;
}) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    deletedAt: null,
    status: "active",
  };

  if (options.category) {
    where.category = options.category;
  }

  if (options.minPrice !== undefined || options.maxPrice !== undefined) {
    where.price = {};
    if (options.minPrice !== undefined) {
      (where.price as Record<string, number>).gte = options.minPrice;
    }
    if (options.maxPrice !== undefined) {
      (where.price as Record<string, number>).lte = options.maxPrice;
    }
  }

  if (options.search) {
    where.OR = [
      { name: { contains: options.search, mode: "insensitive" } },
      { description: { contains: options.search, mode: "insensitive" } },
    ];
  }

  const validSortFields = ["name", "price", "stock", "createdAt"];
  const sortField = validSortFields.includes(options.sort ?? "") ? options.sort : "createdAt";
  const sortOrder = options.order === "asc" ? "asc" : "desc";

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortField]: sortOrder },
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

export async function getPublicProduct(productId: string) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      deletedAt: null,
      status: "active",
    },
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
      stockThreshold: true,
      supplier: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
}
