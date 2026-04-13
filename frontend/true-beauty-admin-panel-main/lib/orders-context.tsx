"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  MOCK_ORDERS,
  type Order,
  type OrderStatus,
  type PaymentStatus,
  type RefundStatus,
} from "./orders-data";
import { useProducts } from "./products-context";
import {
  useStockHistory,
} from "./stock-history-context";

interface OrdersContextValue {
  orders: Order[];
  getOrderById: (id: string) => Order | undefined;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updatePaymentStatus: (id: string, status: PaymentStatus) => void;
  approveRefund: (id: string) => void;
  rejectRefund: (id: string) => void;
  updateTracking: (
    id: string,
    trackingNumber: string,
    trackingUrl?: string
  ) => void;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(() =>
    MOCK_ORDERS.map((o) => ({ ...o }))
  );
  const { products, updateProduct } = useProducts();
  const { recordChange } = useStockHistory();

  const getOrderById = useCallback(
    (id: string) => orders.find((o) => o.id === id),
    [orders]
  );

  const updateOrderField = useCallback(
    <K extends keyof Order>(id: string, field: K, value: Order[K]) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? { ...o, [field]: value, updatedAt: new Date().toISOString() }
            : o
        )
      );
    },
    []
  );

  const updateOrderStatus = useCallback(
    (id: string, status: OrderStatus) => {
      updateOrderField(id, "orderStatus", status);
      const order = orders.find((o) => o.id === id);
      if (!order) return;
      if (
        order.orderStatus === "pending" &&
        (status === "shipped" || status === "delivered")
      ) {
        order.items.forEach((item) => {
          const product = products.find((p) => p.name === item.productName);
          if (!product) return;
          const prev = product.stock;
          if (item.quantity <= 0) return;
          const newStock = Math.max(0, prev - item.quantity);
          if (newStock === prev) return;
          updateProduct(product.id, { stock: newStock });
          recordChange({
            productId: product.id,
            productName: product.name,
            previousStock: prev,
            newStock,
            quantity: item.quantity,
            type: "reduce",
            reason: "Sale / Order",
            note: `Order ${order.id}`,
          });
        });
      }
    },
    [orders, products, updateOrderField, updateProduct, recordChange]
  );

  const updatePaymentStatus = useCallback(
    (id: string, status: PaymentStatus) => {
      updateOrderField(id, "paymentStatus", status);
    },
    [updateOrderField]
  );

  const setRefundStatus = useCallback(
    (id: string, status: RefundStatus) => {
      updateOrderField(id, "refundStatus", status);
    },
    [updateOrderField]
  );

  const approveRefund = useCallback(
    (id: string) => {
      setRefundStatus(id, "approved");
      updatePaymentStatus(id, "refunded");
    },
    [setRefundStatus, updatePaymentStatus]
  );

  const rejectRefund = useCallback(
    (id: string) => {
      setRefundStatus(id, "rejected");
    },
    [setRefundStatus]
  );

  const updateTracking = useCallback(
    (id: string, trackingNumber: string, trackingUrl?: string) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                trackingNumber: trackingNumber || undefined,
                trackingUrl: trackingUrl || undefined,
                updatedAt: new Date().toISOString(),
              }
            : o
        )
      );
    },
    []
  );

  const value: OrdersContextValue = useMemo(
    () => ({
      orders,
      getOrderById,
      updateOrderStatus,
      updatePaymentStatus,
      approveRefund,
      rejectRefund,
      updateTracking,
    }),
    [
      orders,
      getOrderById,
      updateOrderStatus,
      updatePaymentStatus,
      approveRefund,
      rejectRefund,
      updateTracking,
    ]
  );

  return (
    <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}

