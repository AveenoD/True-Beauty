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
  images?: string[]; sku?: string; status?: string;
}) {
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
      sku: data.sku,
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

  const previousQty = product.stock;
  const newQty = previousQty + data.changeAmount;

  const updated = await prisma.product.update({
    where: { id: data.productId },
    data: {
      stock: Math.max(0, newQty),
      stockStatus: newQty > 0 ? "in_stock" : "out_of_stock",
    },
  });

  await prisma.inventoryLog.create({
    data: {
      inventoryId: data.productId,
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
