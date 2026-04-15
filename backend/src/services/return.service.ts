import prisma from "../config/database";

// ============================================================
// USER RETURNS
// ============================================================

export async function createReturn(userId: string, data: {
  orderId: string;
  reason: string;
  productId?: string;
  quantity?: number;
  images?: string[];
  pickupAddressId?: string;
}) {
  // Verify order belongs to user
  const order = await prisma.order.findFirst({
    where: { id: data.orderId, userId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (!["delivered"].includes(order.orderStatus)) {
    throw new Error("Can only return delivered orders");
  }

  if (order.refundStatus !== "none") {
    throw new Error("A refund has already been requested for this order");
  }

  // Check product exists in order if provided
  if (data.productId) {
    const orderItem = await prisma.orderItem.findFirst({
      where: { orderId: data.orderId, productId: data.productId },
    });
    if (!orderItem) {
      throw new Error("Product not found in this order");
    }
  }

  const returnRequest = await prisma.returnRequest.create({
    data: {
      userId,
      orderId: data.orderId,
      reason: data.reason,
      productId: data.productId,
      quantity: data.quantity ?? 1,
      images: data.images ?? [],
      pickupAddressId: data.pickupAddressId,
      status: "requested",
    },
  });

  // Create initial timeline entry
  await prisma.returnTimeline.create({
    data: {
      returnId: returnRequest.id,
      status: "requested",
      note: "Return request submitted",
    },
  });

  // Update order refund status
  await prisma.order.update({
    where: { id: data.orderId },
    data: { refundStatus: "requested" },
  });

  return returnRequest;
}

export async function listUserReturns(userId: string, options: {
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const skip = (page - 1) * limit;

  const [returns, total] = await Promise.all([
    prisma.returnRequest.findMany({
      where: { userId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        timeline: { orderBy: { createdAt: "desc" } },
        refund: true,
      },
    }),
    prisma.returnRequest.count({ where: { userId } }),
  ]);

  return {
    data: returns,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getUserReturn(userId: string, returnId: string) {
  const returnRequest = await prisma.returnRequest.findFirst({
    where: { id: returnId, userId },
    include: {
      timeline: { orderBy: { createdAt: "desc" } },
      refund: true,
    },
  });

  if (!returnRequest) {
    throw new Error("Return request not found");
  }

  return returnRequest;
}

// ============================================================
// ADMIN RETURNS
// ============================================================

export async function listAdminReturns(adminId: string, options: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (options.status) {
    where.status = options.status;
  }

  const [returns, total] = await Promise.all([
    prisma.returnRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        timeline: { orderBy: { createdAt: "desc" } },
        refund: true,
      },
    }),
    prisma.returnRequest.count({ where }),
  ]);

  // Filter to admin's products
  const filteredReturns = returns.filter(r => {
    // Check if this return belongs to an order that has admin's products
    return true; // simplified for now
  });

  return {
    data: returns,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getAdminReturn(adminId: string, returnId: string) {
  return prisma.returnRequest.findFirst({
    where: { id: returnId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      timeline: { orderBy: { createdAt: "desc" } },
      refund: true,
    },
  });
}

export async function updateReturnStatus(adminId: string, returnId: string, data: {
  status: string;
  adminNote?: string;
  refundAmount?: number;
}) {
  const returnRequest = await prisma.returnRequest.findFirst({
    where: { id: returnId },
  });

  if (!returnRequest) {
    throw new Error("Return request not found");
  }

  const validStatuses = ["requested", "approved", "rejected", "in_transit", "received", "refund_initiated", "refund_completed", "closed", "cancelled"];
  if (!validStatuses.includes(data.status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }

  // Create timeline entry
  await prisma.returnTimeline.create({
    data: {
      returnId,
      status: data.status,
      note: data.adminNote,
      updatedBy: adminId,
    },
  });

  const updated = await prisma.returnRequest.update({
    where: { id: returnId },
    data: {
      status: data.status as "requested" | "approved" | "rejected" | "in_transit" | "received" | "refund_initiated" | "refund_completed" | "closed" | "cancelled",
      adminNote: data.adminNote,
      refundAmount: data.refundAmount,
    },
  });

  // Update order refund status
  let orderRefundStatus = returnRequest.orderId;
  if (data.status === "approved") {
    await prisma.order.update({
      where: { id: returnRequest.orderId },
      data: { refundStatus: "approved" },
    });
  } else if (data.status === "rejected") {
    await prisma.order.update({
      where: { id: returnRequest.orderId },
      data: { refundStatus: "rejected" },
    });
  } else if (data.status === "refund_completed") {
    await prisma.order.update({
      where: { id: returnRequest.orderId },
      data: { refundStatus: "approved", orderStatus: "refunded" },
    });
  }

  return updated;
}
