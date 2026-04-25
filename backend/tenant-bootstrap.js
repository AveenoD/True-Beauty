require("dotenv/config");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5433/truebeauty?schema=public";

const adapter = new PrismaPg(new Pool({ connectionString }));
const prisma = new PrismaClient({ adapter });

const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/;

function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

async function ensureUniqueSlug(base) {
  let slug = base;
  if (!SLUG_REGEX.test(slug)) {
    slug = slugify(slug);
  }
  if (!slug) slug = "tenant";

  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? slug : `${slug}-${i}`;
    if (!SLUG_REGEX.test(candidate)) continue;
    const existing = await prisma.admin.findFirst({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }

  // last resort unique-ish
  return `${slug}-${Date.now().toString().slice(-6)}`.slice(0, 30);
}

async function main() {
  const admins = await prisma.admin.findMany({
    select: { id: true, name: true, email: true, slug: true, lastLoginAt: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Admins found: ${admins.length}`);
  for (const a of admins) {
    console.log(
      `- ${a.email} | id=${a.id} | slug=${a.slug ?? "(null)"} | lastLoginAt=${
        a.lastLoginAt ? a.lastLoginAt.toISOString() : "(null)"
      }`
    );
  }

  // Assign slugs to admins missing them
  const updated = [];
  for (const a of admins) {
    if (a.slug && SLUG_REGEX.test(a.slug)) continue;

    const baseFromEmail = slugify((a.email || "").split("@")[0]);
    const base = baseFromEmail || slugify(a.name) || "tenant";
    const slug = await ensureUniqueSlug(base);

    const row = await prisma.admin.update({
      where: { id: a.id },
      data: { slug },
      select: { id: true, email: true, slug: true },
    });
    updated.push(row);
  }

  if (updated.length) {
    console.log(`Updated slugs (${updated.length}):`);
    for (const u of updated) {
      console.log(`- ${u.email} → ${u.slug}`);
    }
  } else {
    console.log("No admin slugs needed updating.");
  }

  // Delete user so email can be re-registered
  const emailToDelete = "aneesshaikh329@gmail.com";
  const deleted = await prisma.user.deleteMany({ where: { email: emailToDelete } });
  console.log(`Deleted users with email ${emailToDelete}: ${deleted.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

