import prisma from "../config/database";

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      referralCode: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      emailPreferences: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function updateUserProfile(
  userId: string,
  data: { name?: string; phone?: string; emailPreferences?: boolean }
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      referralCode: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      emailPreferences: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

// ============================================================
// ADDRESSES
// ============================================================

export async function getUserAddresses(userId: string) {
  const addresses = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });

  return addresses;
}

export async function createUserAddress(
  userId: string,
  data: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
    addressType?: string;
    isDefault?: boolean;
  }
) {
  // If this is set as default, unset other defaults
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: {
      userId,
      name: data.name,
      phone: data.phone,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      country: data.country || "India",
      addressType: data.addressType || "home",
      isDefault: data.isDefault || false,
    },
  });

  return address;
}

export async function updateUserAddress(
  userId: string,
  addressId: string,
  data: {
    name?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    addressType?: string;
    isDefault?: boolean;
  }
) {
  // Verify ownership
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!existing) {
    throw new Error("Address not found");
  }

  // If setting as default, unset others
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId, isDefault: true, id: { not: addressId } },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.update({
    where: { id: addressId },
    data,
  });

  return address;
}

export async function deleteUserAddress(userId: string, addressId: string) {
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });

  if (!existing) {
    throw new Error("Address not found");
  }

  await prisma.address.delete({
    where: { id: addressId },
  });

  return { deleted: true };
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export async function getUserNotifications(
  userId: string,
  options: { page?: number; limit?: number; unreadOnly?: boolean } = {}
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(50, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { userId };
  if (options.unreadOnly) {
    where.isRead = false;
  }

  const [notifications, total] = await Promise.all([
    prisma.userNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        message: true,
        imageUrl: true,
        type: true,
        referenceId: true,
        isRead: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.userNotification.count({ where }),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const notification = await prisma.userNotification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  await prisma.userNotification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return { success: true };
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.userNotification.updateMany({
    where: { userId, isRead: false },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return { success: true };
}

export async function getUnreadNotificationCount(userId: string) {
  return prisma.userNotification.count({
    where: { userId, isRead: false },
  });
}

// ============================================================
// CREATE NOTIFICATION (used by other services)
// ============================================================

export async function createNotification(
  userId: string,
  data: {
    title: string;
    message: string;
    type?: string;
    imageUrl?: string;
    referenceId?: string;
  }
) {
  return prisma.userNotification.create({
    data: {
      userId,
      title: data.title,
      message: data.message,
      type: data.type,
      imageUrl: data.imageUrl,
      referenceId: data.referenceId,
      isRead: false,
    },
  });
}