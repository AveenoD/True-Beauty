/**
 * Phase 4: Seed *.local hosts for multi-tenant local testing.
 * Run after db:tenant-foundation: npm run db:seed-local-tenants
 */
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

function getConnectionString() {
  const raw =
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5433/truebeauty?schema=public";
  return raw.replace(/\?.*$/, "");
}

const DEV_TENANTS = [
  {
    slug: "parlour-a",
    name: "Parlour A (Dev)",
    email: "parlour-a@dev.local",
    password: "Dev@1234",
    storefrontHosts: ["parlour-a.local"],
    adminPanelHosts: ["admin.parlour-a.local"],
  },
  {
    slug: "parlour-b",
    name: "Parlour B (Dev)",
    email: "parlour-b@dev.local",
    password: "Dev@1234",
    storefrontHosts: ["parlour-b.local"],
    adminPanelHosts: ["admin.parlour-b.local"],
  },
];

const LOOPBACK_HOSTS = [
  { host: "localhost", isPrimary: true },
  { host: "127.0.0.1", isPrimary: false },
];

async function upsertDomain(prisma, adminId, host, kind, isPrimary) {
  await prisma.tenantDomain.upsert({
    where: { host },
    create: { adminId, host, kind, isPrimary },
    update: { adminId, kind, isPrimary },
  });
  console.log(`  ${host} (${kind}) → admin ${adminId}`);
}

async function ensureDevAdmin(prisma, spec) {
  const hashed = await bcrypt.hash(spec.password, 12);
  const admin = await prisma.admin.upsert({
    where: { email: spec.email },
    create: {
      name: spec.name,
      email: spec.email,
      password: hashed,
      slug: spec.slug,
      role: "admin",
      isActive: true,
    },
    update: {
      name: spec.name,
      slug: spec.slug,
      isActive: true,
    },
    select: { id: true, email: true, slug: true },
  });
  console.log(`Admin: ${admin.email} (slug=${admin.slug})`);
  return admin;
}

async function main() {
  const pool = new Pool({ connectionString: getConnectionString() });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    console.log("Phase 4: seeding local tenant domains...\n");

    for (const spec of DEV_TENANTS) {
      const admin = await ensureDevAdmin(prisma, spec);
      for (const host of spec.storefrontHosts) {
        await upsertDomain(prisma, admin.id, host, "storefront", true);
      }
      for (const host of spec.adminPanelHosts) {
        await upsertDomain(prisma, admin.id, host, "admin_panel", false);
      }
      console.log("");
    }

    const primary =
      (await prisma.admin.findFirst({
        where: { email: { equals: "admin@truebeauty.com", mode: "insensitive" } },
        select: { id: true, slug: true },
      })) ||
      (await prisma.admin.findFirst({
        where: { slug: "demo" },
        select: { id: true, slug: true },
      })) ||
      (await prisma.admin.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        select: { id: true, slug: true },
      }));

    if (primary) {
      console.log(`Loopback hosts → ${primary.slug} (${primary.id}):`);
      for (const h of LOOPBACK_HOSTS) {
        await upsertDomain(prisma, primary.id, h.host, "storefront", h.isPrimary);
      }
    } else {
      console.warn("No primary admin for localhost mapping.");
    }

    console.log("\n--- Local test URLs (add to hosts file) ---");
    console.log("127.0.0.1  parlour-a.local");
    console.log("127.0.0.1  parlour-b.local");
    console.log("127.0.0.1  admin.parlour-a.local");
    console.log("127.0.0.1  admin.parlour-b.local");
    console.log("\nStorefront: http://parlour-a.local:3002  (X-Tenant-Slug: parlour-a)");
    console.log("Storefront: http://parlour-b.local:3002  (X-Tenant-Slug: parlour-b)");
    console.log("\nDev admin logins: parlour-a@dev.local / parlour-b@dev.local — Dev@1234");
    console.log("\nDone.");
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
