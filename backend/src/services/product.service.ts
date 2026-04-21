import prisma from "../config/database";
import { PaginatedResult } from "../types";

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
  name; categoryId; categoryName; price; discountPrice; stock; description; image; images; sku; status;
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

export async function adjustInventory(adminId: string, data: { productId: string; changeAmount: number; reason: string; referenceId?: string }) {
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
  const newQty = previousQty + data.changeAmount;

  const updated = await prisma.product.update({
    where: { id: data.productId },
    data: {
      stock: Math.max(0, newQty),
      stockStatus: newQty > 0 ? "in_stock" : "out_of_stock",
    },
  });

  // Update inventory record
  await prisma.inventory.update({
    where: { id: inventory.id },
    data: {
      quantity: Math.max(0, newQty),
      availableQty: Math.max(0, newQty),
      lastUpdated: new Date(),
      updatedBy: adminId,
    },
  });

  // Create inventory log with correct inventoryId (from Inventory, not Product)
  await prisma.inventoryLog.create({
    data: {
      inventoryId: inventory.id,  // Use Inventory.id, not productId
      changeType: data.changeAmount > 0 ? "add" : "remove",
      changeAmount: data.changeAmount,
      previousQty,
      newQty: updated.stock,
      reason: data.reason,
      referenceId: data.referenceId,
      adminId,
    },
  });

  return updated;
}

function generateSku(productName: string): string {
  // Extract key words from product name (first letter of each word)
  const words = productName.trim().split(/\s+/);
  const prefix = words.map(w => w[0].toUpperCase()).join("").substring(0, 4);

  // Generate random suffix
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `TB-${prefix}-${random}`;
}
