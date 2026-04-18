import prisma from "../config/database";
import crypto from "crypto";

export async function listCategories(adminId: string) {
  return prisma.category.findMany({
    where: { adminId },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createCategory(adminId: string, data: { name: string; slug?: string; image?: string; sortOrder?: number }) {
  const slug = data.slug || generateSlug(data.name);

  return prisma.category.create({
    data: {
      adminId,
      name: data.name,
      slug,
      image: data.image,
      sortOrder: data.sortOrder || 0,
    },
  });
}

export async function getCategory(adminId: string, id: string) {
  return prisma.category.findFirst({
    where: { id, adminId },
  });
}

export async function updateCategory(adminId: string, id: string, data: { name?: string; slug?: string; image?: string; isActive?: boolean; sortOrder?: number }) {
  return prisma.category.updateMany({
    where: { id, adminId },
    data,
  }).then(() => prisma.category.findFirst({ where: { id } }));
}

export async function deleteCategory(adminId: string, id: string) {
  return prisma.category.deleteMany({
    where: { id, adminId },
  });
}

function generateSlug(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const random = crypto.randomBytes(3).toString("hex");
  return `${base}-${random}`;
}
