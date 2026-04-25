import prisma from "../config/database";
import { PaginatedResult } from "../types";
import { AppError } from "../middleware/errorHandler";

async function checkPlanProductLimit(adminId: string): Promise<void> {
  const subscription = await prisma.adminSubscription.findUnique({
    where: { adminId },
    select: {
      status: true,
      expiryDate: true,
      plan: {
        select: { maxProducts: true },
      },
    },
  });

  if (!subscription || subscription.status !== "active") {
    throw new AppError(
      403,
      "No active subscription. Please subscribe to a plan to add products."
    );
  }

  if (subscription.expiryDate && subscription.expiryDate < new Date()) {
    throw new AppError(403, "Subscription expired. Please renew your plan.");
  }

  const maxProducts = subscription.plan?.maxProducts;
  if (maxProducts === null || maxProducts === undefined) {
    return; // Unlimited
  }

  const currentCount = await prisma.product.count({
    where: { adminId, deletedAt: null },
  });

  if (currentCount >= maxProducts) {
    throw new AppError(
      403,
      `Product limit reached. Your ${subscription.plan?.maxProducts}-product plan allows a maximum of ${maxProducts} products. Please upgrade your plan.`
    );
  }
}

export async function listProducts(adminId: string, query: { page?: number; limit?: number; categoryId?: string; search?: string; status?: string }) {
  const page = query.page || 1;
  const limit = Math.min(query.limit || 20, 100);
  const skip = (page - 1) * limit;

  const where: any = { adminId, deletedAt: null };
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.search) where.name = { contains: query.search, mode: "insensitive" };
  if (query.status && query.status !== "all") where.status = query.status;

  const [data, total] = await Promise.all([
    prisma.product.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.product.count({ where }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function createProduct(adminId: string, data: {
  name: string; categoryId?: string; categoryName?: string; price: number;
  discountPrice?: number; stock?: number; description?: string; image?: string;
  images?: string[]; sku?: string; status?: string; isAffiliateProduct?: boolean;
}) {
  // Check plan product limit before creating
  await checkPlanProductLimit(adminId);

  // Validate categoryId if provided
  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, adminId, isActive: true },
    });
    if (!category) {
      throw new Error("Category not found or inactive. Please provide a valid categoryId.");
    }
  }

  // Auto-generate SKU from product name if not provided
  const finalSku = data.sku || generateSku(data.name);

  return prisma.product.create({
    data: {
      adminId,
      name: data.name,
      categoryId: data.categoryId,
      categoryName: data.categoryName,
      price: data.price,
      discountPrice: data.discountPrice,
      stock: data.stock || 0,
      description: data.description,
      image: data.image,
      images: data.images || [],
      sku: finalSku,
      status: data.status || "active",
      stockStatus: (data.stock || 0) > 0 ? "in_stock" : "out_of_stock",
    },
  });
}

export async function getProduct(adminId: string, id: string) {
  return prisma.product.findFirst({ where: { id, adminId, deletedAt: null } });
}

export async function updateProduct(adminId: string, id: string, data: Partial<{
  name: string;
  categoryId: string;
  categoryName: string;
  price: number;
  discountPrice: number;
  stock: number;
  description: string;
  image: string;
  images: string[];
  sku: string;
  status: string;
}>) {
  const product = await prisma.product.findFirst({ where: { id, adminId, deletedAt: null } });
  if (!product) return null;

  const updateData: any = { ...data };
  if (data.stock !== undefined) {
    updateData.stockStatus = data.stock > 0 ? "in_stock" : "out_of_stock";
  }

  return prisma.product.update({ where: { id }, data: updateData });
}

export async function deleteProduct(adminId: string, id: string) {
  return prisma.product.updateMany({
    where: { id, adminId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}

export async function adjustInventory(adminId: string, data: {
  productId: string;
  operation: "add" | "reduce" | "set";
  quantity: number;
  reason: string;
  note?: string;
  referenceId?: string;
}) {
  const product = await prisma.product.findFirst({ where: { id: data.productId, adminId, deletedAt: null } });
  if (!product) throw new Error("Product not found");

  // Get or create Inventory record for this product
  let inventory = await prisma.inventory.findFirst({ where: { productId: data.productId } });
  if (!inventory) {
    inventory = await prisma.inventory.create({
      data: {
        productId: data.productId,
        quantity: product.stock,
        availableQty: product.stock,
      },
    });
  }

  const previousQty = inventory.quantity;
  let newQty: number;

  if (data.operation === "add") {
    newQty = previousQty + data.quantity;
  } else if (data.operation === "reduce") {
    newQty = Math.max(0, previousQty - data.quantity);
  } else {
    newQty = data.quantity;
  }

  const updated = await prisma.product.update({
    where: { id: data.productId },
    data: {
      stock: newQty,
      stockStatus: newQty > 0 ? "in_stock" : "out_of_stock",
    },
  });

  // Update inventory record
  await prisma.inventory.update({
    where: { id: inventory.id },
    data: {
      quantity: newQty,
      availableQty: newQty,
      lastUpdated: new Date(),
      updatedBy: adminId,
    },
  });

  // Determine actual change amount for the log
  const actualChange = newQty - previousQty;

  // Create inventory log with correct inventoryId (from Inventory, not Product)
  await prisma.inventoryLog.create({
    data: {
      inventoryId: inventory.id,
      changeType: data.operation === "set"
        ? (actualChange > 0 ? "add" : "remove")
        : data.operation,
      changeAmount: data.quantity,
      previousQty,
      newQty: updated.stock,
      reason: data.reason + (data.note ? ` | ${data.note}` : ""),
      referenceId: data.referenceId,
      adminId,
    },
  });

  return updated;
}

function generateSku(productName: string): string {
  // Extract key words from product name (first letter of each word)
  const words = productName.trim().split(/\s+/);
  const prefix = words
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .substring(0, 4);

  // Generate random suffix
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `TB-${prefix}-${random}`;
}
