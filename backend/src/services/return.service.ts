import prisma from "../config/database";

export async function createReturn(userId: string, data: { orderId: string; productId?: string; quantity?: number; reason: string; images?: string[] }) {
  const order = await prisma.order.findFirst({ where: { id: data.orderId, userId } });
  if (!order) throw new Error("Order not found");

  return prisma.returnRequest.create({
    data: {
      orderId: data.orderId,
      userId,
      productId: data.productId,
      quantity: data.quantity || 1,
      reason: data.reason,
      images: data.images || [],
      status: "requested",
    },
    include: { timeline: true },
  });
}

export async function listReturns(userId: string) {
  return prisma.returnRequest.findMany({
    where: { userId },
    include: { timeline: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getReturn(userId: string, returnId: string) {
  return prisma.returnRequest.findFirst({
    where: { id: returnId, userId },
    include: { timeline: { orderBy: { createdAt: "desc" } } },
  });
}
