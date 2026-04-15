import prisma from "../config/database";

// ============================================================
// SERVICE BOOKINGS (User side)
// ============================================================

export async function createBooking(userId: string, data: {
  serviceId: string;
  bookingDate: string;
  bookingTime: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  couponCode?: string;
}) {
  const service = await prisma.myService.findFirst({
    where: { id: data.serviceId, status: "active" },
  });

  if (!service) {
    throw new Error("Service not found or not available");
  }

  // Check if slot is available
  const existingBooking = await prisma.serviceBooking.findFirst({
    where: {
      serviceId: data.serviceId,
      bookingDate: new Date(data.bookingDate),
      bookingTime: data.bookingTime,
      status: { in: ["pending", "confirmed"] },
    },
  });

  if (existingBooking) {
    throw new Error("This time slot is already booked. Please choose another time.");
  }

  let totalAmount = service.discountedPrice ?? service.price;
  let discountAmount = 0;

  // Apply coupon if provided
  if (data.couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: data.couponCode },
    });

    if (coupon && coupon.isActive) {
      if (coupon.discountType === "percentage") {
        discountAmount = (totalAmount * coupon.discountValue) / 100;
      } else {
        discountAmount = coupon.discountValue;
      }
      totalAmount = Math.max(0, totalAmount - discountAmount);
    }
  }

  const booking = await prisma.serviceBooking.create({
    data: {
      userId,
      serviceId: data.serviceId,
      bookingDate: new Date(data.bookingDate),
      bookingTime: data.bookingTime,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      notes: data.notes,
      couponCode: data.couponCode,
      discountAmount,
      totalAmount,
      status: service.bookingConfirmationMode === "instant" ? "confirmed" : "pending",
    },
  });

  // Update service booking count
  await prisma.myService.update({
    where: { id: data.serviceId },
    data: { totalBookings: { increment: 1 } },
  });

  return booking;
}

export async function listUserBookings(userId: string, options: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { userId };
  if (options.status) {
    where.status = options.status;
  }

  const [bookings, total] = await Promise.all([
    prisma.serviceBooking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        service: {
          select: { id: true, name: true, category: true, price: true, discountedPrice: true, image: true },
        },
      },
    }),
    prisma.serviceBooking.count({ where }),
  ]);

  return {
    data: bookings,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getUserBooking(userId: string, bookingId: string) {
  const booking = await prisma.serviceBooking.findFirst({
    where: { id: bookingId, userId },
    include: {
      service: true,
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  return booking;
}

export async function cancelUserBooking(userId: string, bookingId: string) {
  const booking = await prisma.serviceBooking.findFirst({
    where: { id: bookingId, userId },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (!["pending", "confirmed"].includes(booking.status)) {
    throw new Error("Cannot cancel a completed or already cancelled booking");
  }

  return prisma.serviceBooking.update({
    where: { id: bookingId },
    data: { status: "cancelled" },
  });
}

// ============================================================
// ADMIN SERVICE MANAGEMENT
// ============================================================

export async function createService(adminId: string, data: {
  name: string;
  category: string;
  description?: string;
  duration?: string;
  price: number;
  discountedPrice?: number;
  images?: string[];
  howToUseText?: string;
  workingHours?: string;
  workingDays?: string;
  bookingConfirmationMode?: string;
  status?: string;
}) {
  return prisma.myService.create({
    data: {
      adminId,
      name: data.name,
      category: data.category,
      description: data.description,
      duration: data.duration,
      price: data.price,
      discountedPrice: data.discountedPrice,
      images: data.images ?? [],
      howToUseType: "text",
      howToUseText: data.howToUseText,
      workingHours: data.workingHours,
      workingDays: data.workingDays,
      bookingConfirmationMode: (data.bookingConfirmationMode as "instant" | "after_24h") || "instant",
      status: data.status || "active",
    },
  });
}

export async function updateService(adminId: string, serviceId: string, data: {
  name?: string;
  category?: string;
  description?: string;
  duration?: string;
  price?: number;
  discountedPrice?: number;
  images?: string[];
  howToUseText?: string;
  workingHours?: string;
  workingDays?: string;
  bookingConfirmationMode?: string;
  status?: string;
}) {
  const existing = await prisma.myService.findFirst({
    where: { id: serviceId, adminId },
  });

  if (!existing) {
    throw new Error("Service not found");
  }

  return prisma.myService.update({
    where: { id: serviceId },
    data: {
      name: data.name,
      category: data.category,
      description: data.description,
      duration: data.duration,
      price: data.price,
      discountedPrice: data.discountedPrice,
      images: data.images,
      howToUseText: data.howToUseText,
      workingHours: data.workingHours,
      workingDays: data.workingDays,
      bookingConfirmationMode: data.bookingConfirmationMode as "instant" | "after_24h" | undefined,
      status: data.status,
    },
  });
}

export async function deleteService(adminId: string, serviceId: string) {
  const existing = await prisma.myService.findFirst({
    where: { id: serviceId, adminId },
  });

  if (!existing) {
    throw new Error("Service not found");
  }

  return prisma.myService.update({
    where: { id: serviceId },
    data: { status: "deleted" },
  });
}

export async function getService(adminId: string, serviceId: string) {
  const service = await prisma.myService.findFirst({
    where: { id: serviceId, adminId },
  });

  if (!service) {
    throw new Error("Service not found");
  }

  return service;
}

export async function listServices(adminId: string, options: {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
}) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { adminId };
  if (options.status) {
    where.status = options.status;
  }
  if (options.category) {
    where.category = options.category;
  }

  const [services, total] = await Promise.all([
    prisma.myService.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.myService.count({ where }),
  ]);

  return {
    data: services,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function listAdminBookings(adminId: string, options: {
  page?: number;
  limit?: number;
  status?: string;
  date?: string;
}) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (options.status) {
    where.status = options.status;
  }
  if (options.date) {
    where.bookingDate = new Date(options.date);
  }

  const [bookings, total] = await Promise.all([
    prisma.serviceBooking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { bookingDate: "asc" },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        service: { select: { id: true, name: true, adminId: true } },
      },
    }),
    prisma.serviceBooking.count({ where }),
  ]);

  // Filter to admin's services
  const filtered = bookings.filter(b => b.service.adminId === adminId);

  return {
    data: filtered,
    pagination: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) },
  };
}

export async function updateBookingStatus(adminId: string, bookingId: string, data: {
  status: string;
}) {
  const booking = await prisma.serviceBooking.findFirst({
    where: { id: bookingId },
    include: { service: true },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.service.adminId !== adminId) {
    throw new Error("Booking not found");
  }

  const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
  if (!validStatuses.includes(data.status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }

  return prisma.serviceBooking.update({
    where: { id: bookingId },
    data: { status: data.status as "pending" | "confirmed" | "completed" | "cancelled" },
  });
}
