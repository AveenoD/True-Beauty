import prisma from "../config/database";
import { randomUUID } from "crypto";

export async function initiatePayment(orderId: string, method: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  const existing = await prisma.payment.findUnique({ where: { orderId } });
  if (existing) throw new Error("Payment already exists for this order");

  const transactionId = `MOCK-${randomUUID()}`;

  return prisma.payment.create({
    data: {
      orderId,
      amount: order.totalAmount,
      method,
      status: "pending",
      transactionId,
      gatewayResponse: JSON.stringify({ mock: true, message: "Dummy payment initiated" }),
    },
  });
}

export async function verifyPayment(paymentId: string, transactionId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new Error("Payment not found");

  return prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "paid",
      transactionId,
      gatewayResponse: JSON.stringify({ mock: true, verified: true }),
    },
  });
}
