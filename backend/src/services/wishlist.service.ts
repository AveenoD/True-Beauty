import prisma from "../config/database";

export async function getWishlist(userId: string, adminId: string) {
  return prisma.wishlistItem.findMany({
    where: {
      userId,
      product: {
        adminId,
      },
    },
    include: {
      product: {
        select: {
          id: true, name: true, price: true, discountPrice: true,
          image: true, stock: true, stockStatus: true, categoryId: true,
        },
      },
    },
    orderBy: { addedAt: "desc" },
  });
}

export async function addToWishlist(
  userId: string,
  adminId: string,
  productId: string
) {
  const product = await prisma.product.findFirst({
    where: { id: productId, adminId, deletedAt: null },
    select: { id: true },
  });
  if (!product) throw new Error("Product not found");

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (existing) throw new Error("Already in wishlist");

  return prisma.wishlistItem.create({
    data: { userId, productId },
  });
}

export async function removeFromWishlist(userId: string, itemId: string) {
  await prisma.wishlistItem.deleteMany({
    where: { id: itemId, userId },
  });
}
