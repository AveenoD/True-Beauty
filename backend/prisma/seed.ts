import prisma from "../src/config/database";

async function seed() {
  console.log("Seeding subscription plans...");

  const plans = [
    {
      name: "Starter",
      description: "Perfect for individuals getting started",
      price: 999,
      duration: "monthly" as const,
      maxProducts: 100,
      maxOrders: null,
      features: [
        "Up to 100 products",
        "Basic analytics dashboard",
        "Email support",
        "Standard templates",
        "1GB storage",
      ],
      sortOrder: 1,
    },
    {
      name: "Professional",
      description: "Ideal for growing businesses",
      price: 1499,
      duration: "monthly" as const,
      maxProducts: 1000,
      maxOrders: null,
      features: [
        "Up to 1,000 products",
        "Advanced analytics & reporting",
        "Priority email & chat support",
        "Custom templates",
        "10GB storage",
        "API access",
        "Multi-user accounts",
      ],
      sortOrder: 2,
    },
    {
      name: "Enterprise",
      description: "For large scale operations",
      price: 1999,
      duration: "monthly" as const,
      maxProducts: null,
      maxOrders: null,
      features: [
        "Unlimited products",
        "Real-time analytics",
        "24/7 dedicated support",
        "White-label customization",
        "Unlimited storage",
        "Full API access",
        "Unlimited users",
        "Custom integrations",
      ],
      sortOrder: 3,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: plan.name.toLowerCase() },
      update: plan,
      create: {
        id: plan.name.toLowerCase(),
        ...plan,
      },
    });
    console.log(`  ${plan.name} plan created/updated`);
  }

  const demoAdmin = await prisma.admin.findFirst({
    where: { email: { equals: "demo@truebeauty.com", mode: "insensitive" } },
    select: { id: true },
  });
  if (demoAdmin) {
    const professional = await prisma.subscriptionPlan.findUnique({
      where: { id: "professional" },
      select: { id: true },
    });
    if (professional) {
      const now = new Date();
      const y = now.getFullYear();
      const m = now.getMonth();
      const startDate = new Date(y, m, 1, 0, 0, 0, 0);
      const expiryDate = new Date(y, m + 1, 1, 0, 0, 0, 0);
      await prisma.adminSubscription.upsert({
        where: { adminId: demoAdmin.id },
        create: {
          adminId: demoAdmin.id,
          planId: professional.id,
          startDate,
          expiryDate,
          status: "active",
          autoRenew: false,
        },
        update: {
          planId: professional.id,
          startDate,
          expiryDate,
          status: "active",
          autoRenew: false,
        },
      });
      console.log("  demo@truebeauty.com subscription ensured (current calendar month)");
    }
  }

  console.log("Seed complete!");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });