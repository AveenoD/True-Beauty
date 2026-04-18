import prisma from "../config/database";

export async function getWishlist(userId: string) {
  return prisma.wishlistItem.findMany({
    where: { userId },
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

export async function addToWishlist(userId: string, productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId, deletedAt: null } });
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
