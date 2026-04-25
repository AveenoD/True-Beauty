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
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, email: true, name: true, adminId: true, createdAt: true },
  });

  const adminIds = [...new Set(users.map((u) => u.adminId).filter(Boolean))];
  const admins = adminIds.length
    ? await prisma.admin.findMany({
        where: { id: { in: adminIds } },
        select: { id: true, email: true, slug: true, name: true },
      })
    : [];

  const adminMap = new Map(admins.map((a) => [a.id, a]));

  console.log("Recent users (latest 10):");
  for (const u of users) {
    const a = u.adminId ? adminMap.get(u.adminId) : null;
    const tenant = a ? `${a.slug} (${a.email})` : "(unlinked)";
    console.log(
      `- ${u.email} | userId=${u.id} | adminId=${u.adminId ?? "(null)"} | tenant=${tenant} | createdAt=${u.createdAt.toISOString()}`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

