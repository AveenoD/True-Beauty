import prisma from "../config/database";

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      gender: true,
      emailVerifiedAt: true,
      referralCode: true,
      role: true,
      isActive: true,
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
  data: { name?: string; phone?: string; dateOfBirth?: Date | null; gender?: string | null }
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      gender: true,
      emailVerifiedAt: true,
      referralCode: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

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
      country: data.country ?? "India",
      ...(data.addressType !== undefined ? { addressType: data.addressType } : {}),
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
