import prisma from "../config/database";

// ============================================================
// CART
// ============================================================

export async function getCart(userId: string) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          discountPrice: true,
          stock: true,
          stockStatus: true,
          image: true,
          category: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const subtotal = items.reduce((sum, item) => {
    const price = item.product.discountPrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  return {
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    itemCount: items.length,
  };
}

export async function addToCart(userId: string, data: {
  productId: string;
  quantity: number;
}) {
  // Check product exists and is available
  const product = await prisma.product.findFirst({
    where: { id: data.productId, deletedAt: null, status: "active" },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  // Check stock
  if (product.stock < data.quantity) {
    throw new Error(`Only ${product.stock} items available in stock`);
  }

  const price = product.discountPrice ?? product.price;

  // Upsert: if item already in cart, update quantity
  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId, productId: data.productId } },
  });

  if (existing) {
    const newQty = existing.quantity + data.quantity;
    if (product.stock < newQty) {
      throw new Error(`Only ${product.stock} items available in stock`);
    }

    const updated = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty, price },
      include: { product: { select: { id: true, name: true, price: true, image: true } } },
    });
    return updated;
  }

  return prisma.cartItem.create({
    data: {
      userId,
      productId: data.productId,
      quantity: data.quantity,
      price,
    },
    include: { product: { select: { id: true, name: true, price: true, image: true } } },
  });
}

export async function updateCartItem(userId: string, itemId: string, data: {
  quantity: number;
}) {
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, userId },
    include: { product: true },
  });

  if (!item) {
    throw new Error("Cart item not found");
  }

  if (data.quantity <= 0) {
    // Remove item if quantity is 0 or less
    await prisma.cartItem.delete({ where: { id: itemId } });
    return null;
  }

  if (item.product.stock < data.quantity) {
    throw new Error(`Only ${item.product.stock} items available in stock`);
  }

  const price = item.product.discountPrice ?? item.product.price;

  return prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity: data.quantity, price },
    include: { product: { select: { id: true, name: true, price: true, image: true } } },
  });
}

export async function removeCartItem(userId: string, itemId: string) {
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, userId },
  });

  if (!item) {
    throw new Error("Cart item not found");
  }

  await prisma.cartItem.delete({ where: { id: itemId } });
  return { success: true };
}

export async function clearCart(userId: string) {
  await prisma.cartItem.deleteMany({ where: { userId } });
  return { success: true };
}

// ============================================================
// WISHLIST
// ============================================================

export async function getWishlist(userId: string) {
  return prisma.wishlistItem.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          discountPrice: true,
          stock: true,
          stockStatus: true,
          image: true,
          category: true,
        },
      },
    },
    orderBy: { addedAt: "desc" },
  });
}

export async function addToWishlist(userId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null, status: "active" },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  // Check if already in wishlist
  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (existing) {
    return existing;
  }

  return prisma.wishlistItem.create({
    data: { userId, productId },
    include: {
      product: {
        select: { id: true, name: true, price: true, image: true },
      },
    },
  });
}

export async function removeFromWishlist(userId: string, productId: string) {
  const item = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });

  if (!item) {
    throw new Error("Item not found in wishlist");
  }

  await prisma.wishlistItem.delete({
    where: { userId_productId: { userId, productId } },
  });

  return { success: true };
}
