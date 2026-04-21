const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5433/truebeauty?schema=public";

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function seed() {
  const email = "admin@truebeauty.com";
  const password = "Admin@1234";
  const name = "True Beauty Admin";

  const hashedPassword = await bcrypt.hash(password, 12);

  const existing = await prisma.admin.findUnique({ where: { email } });

  if (existing) {
    const updated = await prisma.admin.update({
      where: { email },
      data: { password: hashedPassword, isActive: true, role: "admin" },
      select: { id: true, email: true, name: true, role: true },
    });
    console.log("Admin updated:", updated);
  } else {
    const admin = await prisma.admin.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "admin",
        slug: "true-beauty-admin",
      },
      select: { id: true, email: true, name: true, role: true },
    });
    console.log("Admin created:", admin);
  }

  console.log("\n--- LOGIN CREDENTIALS ---");
  console.log("Email:    ", email);
  console.log("Password: ", password);
  console.log("Admin ID: ", (await prisma.admin.findUnique({ where: { email } })).id);

  await prisma.$disconnect();
  await pool.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
