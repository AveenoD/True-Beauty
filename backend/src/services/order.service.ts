import prisma from "../config/database";
import crypto from "crypto";
import { PaginatedResult } from "../types";

export function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `TB-${dateStr}-${random}`;
}

export async function createOrder(userId: string, data: {
  shippingAddressId: string;
  billingAddressId?: string;
  couponCode?: string;
  paymentMethod: string;
}) {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });

  if (cartItems.length === 0) throw new Error("Cart is empty");
  if (!cartItems[0]?.product) throw new Error("Cart items invalid");

  let discount = 0;
  let couponId: string | null = null;

  if (data.couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: data.couponCode,
        isActive: true,
        adminId: cartItems[0].product.adminId ?? undefined,
      },
    });
    if (coupon) {
      couponId = coupon.id;
    }
  }

  const subTotal = cartItems.reduce((sum, item) => {
    const price = item.product.discountPrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const productsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const order = await prisma.order.create({
    data: {
      userId,
      orderNumber: generateOrderNumber(),
      subTotal,
      discount,
      totalAmount: subTotal - discount,
      productsCount,
      shippingAddressId: data.shippingAddressId,
      billingAddressId: data.billingAddressId,
      couponId,
      paymentMethod: data.paymentMethod as any,
      items: {
        create: cartItems.map((item) => ({
          productId: item.productId,
          productName: item.product.name,
          productImage: item.product.image,
          quantity: item.quantity,
          price: item.product.discountPrice ?? item.product.price,
          total: (item.product.discountPrice ?? item.product.price) * item.quantity,
        })),
      },
    },
    include: {
      items: true,
      shippingAddress: true,
    },
  });

  // Clear cart after order
  await prisma.cartItem.deleteMany({ where: { userId } });

  // Decrement stock
  for (const item of cartItems) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  return order;
}

export async function listOrders(userId: string, query: { page?: number; limit?: number; status?: string }) {
  const page = query.page || 1;
  const limit = Math.min(query.limit || 20, 100);
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (query.status) where.orderStatus = query.status;

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.count({ where }),
  ]);

  return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

export async function getOrder(userId: string, orderId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true, shippingAddress: true, billingAddress: true, coupon: true },
  });
}

export async function cancelOrder(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
  });

  if (!order) throw new Error("Order not found");
  if (!["pending", "confirmed"].includes(order.orderStatus)) {
    throw new Error("Order cannot be cancelled");
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { orderStatus: "cancelled" },
    include: { items: true },
  });
}
