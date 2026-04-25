require("dotenv/config");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5433/truebeauty?schema=public";

const prisma = new PrismaClient({
  adapter: new PrismaPg(new Pool({ connectionString })),
});

async function main() {
  const email = process.argv[2] || "demo@truebeauty.com";
  const admin = await prisma.admin.findUnique({
    where: { email },
    select: { id: true, email: true, slug: true, isActive: true, createdAt: true },
  });
  if (!admin) {
    console.log("Admin not found:", email);
    return;
  }
  const subscription = await prisma.adminSubscription.findUnique({
    where: { adminId: admin.id },
    include: { plan: { select: { id: true, name: true, maxProducts: true } } },
  });
  console.log({ admin, subscription });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

