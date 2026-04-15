import prisma from "../config/database";
import crypto from "crypto";

// ============================================================
// PAYMENT - DUMMY IMPLEMENTATION
// No real money changes hands. For Razorpay/Stripe integration later.
// ============================================================

export async function initiatePayment(userId: string, data: {
  orderId: string;
  paymentMethod: string;
}) {
  // Verify order belongs to user
  const order = await prisma.order.findFirst({
    where: { id: data.orderId, userId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.paymentStatus === "paid") {
    throw new Error("Order is already paid");
  }

  // Generate mock payment ID and receipt
  const paymentId = `PAY_${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
  const receipt = `RCP_${Date.now().toString(36).toUpperCase()}`;

  // For COD, payment is immediate
  if (data.paymentMethod === "cod") {
    await prisma.payment.update({
      where: { orderId: data.orderId },
      data: {
        status: "paid",
        method: "cod",
        transactionId: paymentId,
        gatewayResponse: JSON.stringify({ mock: true, receipt }),
      },
    });

    await prisma.order.update({
      where: { id: data.orderId },
      data: {
        paymentStatus: "paid",
        paymentMethod: "cod",
        orderStatus: "confirmed",
      },
    });

    return {
      paymentId,
      orderId: data.orderId,
      amount: order.totalAmount,
      status: "paid",
      paymentMethod: "cod",
      message: "Cash on Delivery confirmed. Your order is confirmed.",
    };
  }

  // For online payments, return mock payment URL
  // In production, this would call Razorpay/Stripe API
  const mockPaymentUrl = `https://checkout.razorpay.com/v1/checkout.js?mock=true&order=${data.orderId}&amount=${order.totalAmount}`;

  // Update payment record with pending status
  await prisma.payment.update({
    where: { orderId: data.orderId },
    data: {
      method: data.paymentMethod,
      transactionId: paymentId,
      gatewayResponse: JSON.stringify({
        mock: true,
        receipt,
        paymentMethod: data.paymentMethod,
        createdAt: new Date().toISOString(),
      }),
    },
  });

  return {
    paymentId,
    orderId: data.orderId,
    amount: order.totalAmount,
    currency: "INR",
    status: "pending",
    paymentMethod: data.paymentMethod,
    paymentUrl: mockPaymentUrl,
    mockReceipt: receipt,
    message: "Payment initiated. Complete payment to confirm order.",
  };
}

export async function verifyPayment(userId: string, data: {
  orderId: string;
  paymentId?: string;
  signature?: string;
}) {
  // In a real integration, we would verify the signature from Razorpay/Stripe
  // For dummy: just mark as paid
  const order = await prisma.order.findFirst({
    where: { id: data.orderId, userId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.paymentStatus === "paid") {
    return {
      orderId: data.orderId,
      status: "paid",
      message: "Order is already paid",
    };
  }

  // DUMMY: always succeed
  const mockTransactionId = `PAY_${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

  await prisma.payment.update({
    where: { orderId: data.orderId },
    data: {
      status: "paid",
      transactionId: mockTransactionId,
      gatewayResponse: JSON.stringify({
        mock: true,
        verified: true,
        razorpay_signature: data.signature ?? "mock_signature",
        verifiedAt: new Date().toISOString(),
      }),
    },
  });

  await prisma.order.update({
    where: { id: data.orderId },
    data: {
      paymentStatus: "paid",
      orderStatus: "confirmed",
    },
  });

  return {
    orderId: data.orderId,
    paymentId: mockTransactionId,
    status: "paid",
    message: "Payment verified and order confirmed",
  };
}

export async function getPaymentStatus(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { payment: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  return {
    orderId,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    amount: order.totalAmount,
    transactionId: order.payment?.transactionId ?? null,
    paidAt: order.payment?.updatedAt ?? null,
  };
}
