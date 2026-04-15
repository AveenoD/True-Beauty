import prisma from "../config/database";
import crypto from "crypto";

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `TB-${timestamp}-${random}`;
}

const SHIPPING_COST = 0; // Free shipping for now
const TAX_RATE = 0; // No tax for now

export async function placeOrder(userId: string, data: {
  shippingAddressId: string;
  billingAddressId?: string;
  paymentMethod: string;
  couponCode?: string;
  notes?: string;
}) {
  // Get cart items
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    throw new Error("Cart is empty");
  }

  // Validate shipping address
  const shippingAddress = await prisma.address.findFirst({
    where: { id: data.shippingAddressId, userId },
  });

  if (!shippingAddress) {
    throw new Error("Shipping address not found");
  }

  // Check stock for all items
  for (const item of cartItems) {
    if (item.product.deletedAt) {
      throw new Error(`Product "${item.product.name}" is no longer available`);
    }
    if (item.product.status !== "active") {
      throw new Error(`Product "${item.product.name}" is not available`);
    }
    if (item.product.stock < item.quantity) {
      throw new Error(`Insufficient stock for "${item.product.name}". Only ${item.product.stock} available.`);
    }
  }

  // Calculate totals
  const subTotal = cartItems.reduce((sum, item) => {
    const price = item.product.discountPrice ?? item.product.price;
    return sum + price * item.quantity;
  }, 0);

  let discount = 0;
  let couponApplied = null;

  // Apply coupon if provided
  if (data.couponCode) {
    couponApplied = await prisma.coupon.findUnique({
      where: { code: data.couponCode },
    });

    if (!couponApplied || !couponApplied.isActive) {
      throw new Error("Invalid or inactive coupon code");
    }

    if (couponApplied.startDate && new Date() < couponApplied.startDate) {
      throw new Error("Coupon is not yet active");
    }

    if (couponApplied.endDate && new Date() > couponApplied.endDate) {
      throw new Error("Coupon has expired");
    }

    if (couponApplied.usageLimitTotal !== null) {
      const usageCount = await prisma.order.count({ where: { couponId: couponApplied.id } });
      if (usageCount >= couponApplied.usageLimitTotal) {
        throw new Error("Coupon usage limit reached");
      }
    }

    if (couponApplied.minimumOrderAmount && subTotal < couponApplied.minimumOrderAmount) {
      throw new Error(`Minimum order amount of ₹${couponApplied.minimumOrderAmount} required for this coupon`);
    }

    if (couponApplied.discountType === "percentage") {
      discount = (subTotal * couponApplied.discountValue) / 100;
      if (couponApplied.maxDiscountCap) {
        discount = Math.min(discount, couponApplied.maxDiscountCap);
      }
    } else {
      discount = couponApplied.discountValue;
    }
  }

  const tax = Math.round((subTotal - discount) * TAX_RATE * 100) / 100;
  const shipping = SHIPPING_COST;
  const totalAmount = Math.round((subTotal - discount + tax + shipping) * 100) / 100;

  const orderNumber = generateOrderNumber();

  // Use transaction for order creation
  const order = await prisma.$transaction(async (tx) => {
    // Create order
    const newOrder = await tx.order.create({
      data: {
        userId,
        orderNumber,
        orderStatus: "pending",
        paymentStatus: "pending",
        paymentMethod: data.paymentMethod as "upi" | "card" | "netbanking" | "cod",
        refundStatus: "none",
        shippingAddressId: data.shippingAddressId,
        billingAddressId: data.billingAddressId,
        couponId: couponApplied?.id,
        notes: data.notes,
        productsCount: cartItems.length,
        subTotal: Math.round(subTotal * 100) / 100,
        discount: Math.round(discount * 100) / 100,
        tax,
        shipping,
        totalAmount,
      },
    });

    // Create order items
    for (const item of cartItems) {
      const price = item.product.discountPrice ?? item.product.price;
      const itemTotal = Math.round(price * item.quantity * 100) / 100;
      const itemDiscount = Math.round((item.product.price - price) * item.quantity * 100) / 100;

      await tx.orderItem.create({
        data: {
          orderId: newOrder.id,
          productId: item.productId,
          productName: item.product.name,
          productImage: item.product.image,
          quantity: item.quantity,
          price,
          discount: itemDiscount,
          tax: 0,
          total: itemTotal,
        },
      });

      // Deduct stock
      const inventory = await tx.inventory.findUnique({
        where: { productId: item.productId },
      });

      if (inventory) {
        const newAvailable = inventory.availableQty - item.quantity;
        await tx.inventory.update({
          where: { productId: item.productId },
          data: {
            quantity: inventory.quantity - item.quantity,
            availableQty: newAvailable >= 0 ? newAvailable : 0,
            lastUpdated: new Date(),
          },
        });

        await tx.inventoryLog.create({
          data: {
            inventoryId: inventory.id,
            changeType: "order_placed",
            changeAmount: item.quantity,
            previousQty: inventory.availableQty,
            newQty: newAvailable >= 0 ? newAvailable : 0,
            reason: `Order ${orderNumber}`,
            referenceId: newOrder.id,
          },
        });
      }
    }

    // Create payment record
    await tx.payment.create({
      data: {
        orderId: newOrder.id,
        amount: totalAmount,
        currency: "INR",
        status: "pending",
        method: data.paymentMethod,
      },
    });

    // Clear cart
    await tx.cartItem.deleteMany({ where: { userId } });

    return newOrder;
  });

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
    paymentStatus: order.paymentStatus,
    message: "Order placed successfully. Proceed to payment.",
  };
}

export async function listUserOrders(userId: string, options: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { userId };
  if (options.status) {
    where.orderStatus = options.status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        payment: true,
        shippingAddress: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    data: orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getUserOrder(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: {
      items: true,
      payment: true,
      shippingAddress: true,
      billingAddress: true,
      coupon: true,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
}

export async function cancelUserOrder(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (!["pending", "confirmed"].includes(order.orderStatus)) {
    throw new Error(`Cannot cancel order with status: ${order.orderStatus}`);
  }

  // Restore inventory
  const items = await prisma.orderItem.findMany({
    where: { orderId },
  });

  for (const item of items) {
    const inventory = await prisma.inventory.findUnique({
      where: { productId: item.productId },
    });

    if (inventory) {
      const newQty = inventory.quantity + item.quantity;
      await prisma.inventory.update({
        where: { productId: item.productId },
        data: {
          quantity: newQty,
          availableQty: inventory.availableQty + item.quantity,
          lastUpdated: new Date(),
        },
      });

      await prisma.inventoryLog.create({
        data: {
          inventoryId: inventory.id,
          changeType: "order_cancelled",
          changeAmount: item.quantity,
          previousQty: inventory.availableQty,
          newQty: inventory.availableQty + item.quantity,
          reason: `Order ${order.orderNumber} cancelled`,
          referenceId: orderId,
        },
      });
    }
  }

  return prisma.order.update({
    where: { id: orderId },
    data: {
      orderStatus: "cancelled",
      paymentStatus: order.paymentStatus === "paid" ? "refunded" : order.paymentStatus,
    },
  });
}

// ============================================================
// ADMIN ORDER MANAGEMENT
// ============================================================

export async function listAdminOrders(adminId: string, options: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const skip = (page - 1) * limit;

  // Admin sees all orders from their tenant (via product adminId)
  // For now, admin sees all orders (multi-tenant filtering can be added later)
  const where: Record<string, unknown> = {};

  if (options.status) {
    where.orderStatus = options.status;
  }

  if (options.search) {
    where.OR = [
      { orderNumber: { contains: options.search, mode: "insensitive" } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: { include: { product: { select: { adminId: true } } } },
        payment: true,
        shippingAddress: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  // Filter to only this admin's products
  const filteredOrders = orders.filter(order =>
    order.items.some(item => item.product.adminId === adminId)
  );

  return {
    data: filteredOrders,
    pagination: {
      page,
      limit,
      total: filteredOrders.length,
      totalPages: Math.ceil(filteredOrders.length / limit),
    },
  };
}

export async function getAdminOrder(adminId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      items: { include: { product: true } },
      payment: true,
      shippingAddress: true,
      billingAddress: true,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // Verify admin owns at least one product in the order
  const ownsProduct = order.items.some(item => item.product.adminId === adminId);
  if (!ownsProduct) {
    throw new Error("Order not found");
  }

  return order;
}

export async function updateOrderStatus(adminId: string, orderId: string, data: {
  status: string;
}) {
  const order = await prisma.order.findFirst({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const validStatuses = ["pending", "confirmed", "preparing", "shipped", "out_for_delivery", "delivered", "cancelled", "returned", "refunded"];

  if (!validStatuses.includes(data.status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }

  return prisma.order.update({
    where: { id: orderId },
    data: {
      orderStatus: data.status as "pending" | "confirmed" | "preparing" | "shipped" | "out_for_delivery" | "delivered" | "cancelled" | "returned" | "refunded",
    },
  });
}

export async function cancelAdminOrder(adminId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (!["pending", "confirmed"].includes(order.orderStatus)) {
    throw new Error(`Cannot cancel order with status: ${order.orderStatus}`);
  }

  // Restore inventory
  const items = await prisma.orderItem.findMany({
    where: { orderId },
  });

  for (const item of items) {
    const inventory = await prisma.inventory.findUnique({
      where: { productId: item.productId },
    });

    if (inventory) {
      const newQty = inventory.quantity + item.quantity;
      await prisma.inventory.update({
        where: { productId: item.productId },
        data: {
          quantity: newQty,
          availableQty: inventory.availableQty + item.quantity,
          lastUpdated: new Date(),
        },
      });
    }
  }

  return prisma.order.update({
    where: { id: orderId },
    data: {
      orderStatus: "cancelled",
      paymentStatus: order.paymentStatus === "paid" ? "refunded" : order.paymentStatus,
    },
  });
}
