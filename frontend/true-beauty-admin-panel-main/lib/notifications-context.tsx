"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  MOCK_NOTIFICATIONS,
  generateNotificationId,
  type Notification,
  type NotificationCategory,
  type TargetRole,
} from "./notifications-data";

type FilterValue = "all" | "unread" | "send" | NotificationCategory;

interface NotificationsContextValue {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  createNotification: (payload: {
    title: string;
    description: string;
    targetRole: TargetRole;
    redirectLink?: string;
    category: NotificationCategory;
    timestamp?: string;
    imageName?: string;
    locationState?: string;
    locationCity?: string;
    locationPincode?: string;
  }) => void;
  updateNotification: (
    id: string,
    payload: {
      title: string;
      description: string;
      targetRole: TargetRole;
      redirectLink?: string;
      category: NotificationCategory;
      timestamp?: string;
      imageName?: string;
      locationState?: string;
      locationCity?: string;
      locationPincode?: string;
    }
  ) => void;
  filterNotifications: (filter: FilterValue) => Notification[];
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null
);

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    MOCK_NOTIFICATIONS.map((n) => ({ ...n }))
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const createNotification = useCallback(
    (payload: {
      title: string;
      description: string;
      targetRole: TargetRole;
      redirectLink?: string;
      category: NotificationCategory;
      timestamp?: string;
      imageName?: string;
      locationState?: string;
      locationCity?: string;
      locationPincode?: string;
    }) => {
      const iconMap: Record<NotificationCategory, NotificationCategory> = {
        system: "system",
        customers: "customers",
        affiliate_users: "affiliate_users",
        new_products: "new_products",
        new_services: "new_services",
        new_orders: "new_orders",
        withdraw_request: "withdraw_request",
      };
      const newNotif: Notification = {
        id: generateNotificationId(),
        icon: iconMap[payload.category],
        title: payload.title,
        description: payload.description,
        relatedUser: "Admin",
        timestamp: payload.timestamp ?? new Date().toISOString(),
        read: false,
        category: payload.category,
        redirectLink: payload.redirectLink,
        imageName: payload.imageName,
        targetRole: payload.targetRole,
        locationState: payload.locationState,
        locationCity: payload.locationCity,
        locationPincode: payload.locationPincode,
        sentByAdmin: true,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    },
    []
  );

  const updateNotification = useCallback(
    (
      id: string,
      payload: {
        title: string;
        description: string;
        targetRole: TargetRole;
        redirectLink?: string;
        category: NotificationCategory;
        timestamp?: string;
        imageName?: string;
        locationState?: string;
        locationCity?: string;
        locationPincode?: string;
      }
    ) => {
      const iconMap: Record<NotificationCategory, NotificationCategory> = {
        system: "system",
        customers: "customers",
        affiliate_users: "affiliate_users",
        new_products: "new_products",
        new_services: "new_services",
        new_orders: "new_orders",
        withdraw_request: "withdraw_request",
      };

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id
            ? {
                ...n,
                icon: iconMap[payload.category],
                title: payload.title,
                description: payload.description,
                targetRole: payload.targetRole,
                redirectLink: payload.redirectLink,
                category: payload.category,
                timestamp: payload.timestamp ?? n.timestamp,
                imageName: payload.imageName,
                locationState: payload.locationState,
                locationCity: payload.locationCity,
                locationPincode: payload.locationPincode,
                sentByAdmin: true,
              }
            : n
        )
      );
    },
    []
  );

  const filterNotifications = useCallback(
    (filter: FilterValue): Notification[] => {
      let list = [...notifications];
      if (filter === "unread") {
        list = list.filter((n) => !n.read);
      } else if (filter === "send") {
        list = list.filter((n) => n.sentByAdmin === true);
      } else if (filter !== "all") {
        list = list.filter((n) => n.category === filter);
      }
      return list.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    },
    [notifications]
  );

  const value = useMemo(
    () => ({
      notifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      createNotification,
      updateNotification,
      filterNotifications,
    }),
    [
      notifications,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      createNotification,
      updateNotification,
      filterNotifications,
    ]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }
  return ctx;
}
