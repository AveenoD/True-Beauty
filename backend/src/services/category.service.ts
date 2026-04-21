import prisma from "../config/database";
import crypto from "crypto";

export async function listCategories(adminId: string) {
  return prisma.category.findMany({
    where: { adminId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCategory(adminId: string, data: { name: string; slug?: string }) {
  // Generate unique slug for this admin
  let slug = data.slug || generateSlug(data.name);

  // Check if slug exists for this admin, if so append random suffix
  const existing = await prisma.category.findFirst({ where: { adminId, slug } });
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  return prisma.category.create({
    data: {
      adminId,
      name: data.name,
      slug,
    },
  });
}

export async function getCategory(adminId: string, id: string) {
  return prisma.category.findFirst({
    where: { id, adminId },
  });
}

export async function updateCategory(adminId: string, id: string, data: { name?: string; slug?: string; isActive?: boolean }) {
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
