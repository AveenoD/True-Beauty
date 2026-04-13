import prisma from "../config/database";

export async function listPlans() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      duration: true,
      features: true,
      maxProducts: true,
      maxOrders: true,
      addonAccess: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return plans;
}

export async function listAddonsForPlan(planId: string) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
    select: { addonAccess: true },
  });

  if (!plan) {
    throw new Error("Plan not found");
  }

  const addons = await prisma.planAddon.findMany({
    where: {
      isActive: true,
      id: { in: plan.addonAccess },
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      features: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return addons;
}
