import prisma from "../config/database";

export async function getCart(userId: string) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true, name: true, price: true, discountPrice: true,
          image: true, stock: true, stockStatus: true, adminId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const subtotal = items.reduce((sum, item) => {
    const price = item.product.discountPrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  return {
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      product: item.product,
    })),
    summary: {
      subtotal,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      uniqueItemCount: items.length,
    },
  };
}

export async function addToCart(userId: string, data: { productId: string; quantity: number }) {
  const product = await prisma.product.findFirst({
    where: { id: data.productId, deletedAt: null },
  });
  if (!product) throw new Error("Product not found");
  if (product.stock < data.quantity) throw new Error("Insufficient stock");

  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId, productId: data.productId } },
  });

  if (existing) {
    return prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + data.quantity, price: product.discountPrice ?? product.price },
    });
  }

  return prisma.cartItem.create({
    data: {
      userId,
      productId: data.productId,
      quantity: data.quantity,
      price: product.discountPrice ?? product.price,
    },
  });
}

export async function updateCartItem(userId: string, itemId: string, quantity: number) {
  if (quantity <= 0) {
    return removeCartItem(userId, itemId);
  }

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, userId },
    include: { product: true },
  });
  if (!item) throw new Error("Cart item not found");
  if (item.product.stock < quantity) throw new Error("Insufficient stock");

  return prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });
}

export async function removeCartItem(userId: string, itemId: string) {
  await prisma.cartItem.deleteMany({
    where: { id: itemId, userId },
  });
}

export async function clearCart(userId: string) {
  await prisma.cartItem.deleteMany({
    where: { userId },
  });
}
