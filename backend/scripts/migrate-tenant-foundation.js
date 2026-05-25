/**
 * Phase 1: Tenant foundation migration (idempotent where possible).
 * Run: npm run db:tenant-foundation
 */
require("dotenv/config");
const { Pool } = require("pg");

function getConnectionString() {
  const raw =
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5433/truebeauty?schema=public";
  return raw.replace(/\?.*$/, "");
}

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

async function detectUserAdminColumn(client) {
  const { rows } = await client.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'user'
       AND column_name IN ('adminId', 'admin_id')`
  );
  if (rows.some((r) => r.column_name === "adminId")) return "adminId";
  if (rows.some((r) => r.column_name === "admin_id")) return "admin_id";
  return "adminId";
}

async function tableExists(client, tableName) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    [tableName]
  );
  return rows.length > 0;
}

async function ensureUniqueSlug(client, base) {
  let slug = base;
  if (!SLUG_REGEX.test(slug)) slug = slugify(slug);
  if (!slug) slug = "tenant";

  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? slug : `${slug}-${i}`;
    if (!SLUG_REGEX.test(candidate)) continue;
    const { rows } = await client.query(
      `SELECT id FROM admin WHERE slug = $1 LIMIT 1`,
      [candidate]
    );
    if (rows.length === 0) return candidate;
  }
  return `${slug}-${Date.now().toString().slice(-6)}`.slice(0, 30);
}

async function backfillAdminSlugs(client) {
  const { rows: admins } = await client.query(
    `SELECT id, name, email, slug FROM admin ORDER BY "createdAt" ASC NULLS LAST, id ASC`
  );

  for (const a of admins) {
    if (a.slug && SLUG_REGEX.test(a.slug)) continue;

    const baseFromEmail = slugify((a.email || "").split("@")[0]);
    const base = baseFromEmail || slugify(a.name) || "tenant";
    const slug = await ensureUniqueSlug(client, base);

    await client.query(
      `UPDATE admin SET slug = $1, "updatedAt" = now() WHERE id = $2`,
      [slug, a.id]
    );
    console.log(`  Admin slug: ${a.email} → ${slug}`);
  }
}

async function getDefaultAdminId(client) {
  const demo = await client.query(
    `SELECT id, slug FROM admin
     WHERE lower(email) = lower($1) AND "isActive" = true
     LIMIT 1`,
    ["demo@truebeauty.com"]
  );
  if (demo.rows[0]?.id) return demo.rows[0];

  const withSlug = await client.query(
    `SELECT id, slug FROM admin
     WHERE slug IS NOT NULL AND slug <> '' AND "isActive" = true
     ORDER BY "createdAt" ASC NULLS LAST
     LIMIT 1`
  );
  if (withSlug.rows[0]?.id) return withSlug.rows[0];

  const any = await client.query(
    `SELECT id, slug FROM admin WHERE "isActive" = true ORDER BY "createdAt" ASC NULLS LAST LIMIT 1`
  );
  if (!any.rows[0]?.id) {
    throw new Error("No active admin found. Run seed-admin.js first.");
  }
  return any.rows[0];
}

async function seedTenantDomains(client, adminId) {
  const hosts = [
    { host: "localhost", kind: "storefront", isPrimary: true },
    { host: "127.0.0.1", kind: "storefront", isPrimary: false },
  ];

  for (const h of hosts) {
    await client.query(
      `INSERT INTO tenant_domain (id, "adminId", host, kind, "isPrimary", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3::"TenantDomainKind", $4, now())
       ON CONFLICT (host) DO UPDATE SET
         "adminId" = EXCLUDED."adminId",
         kind = EXCLUDED.kind,
         "isPrimary" = EXCLUDED."isPrimary"`,
      [adminId, h.host, h.kind, h.isPrimary]
    );
    console.log(`  TenantDomain: ${h.host} → admin ${adminId}`);
  }
}

async function migrate() {
  const pool = new Pool({ connectionString: getConnectionString() });
  const client = await pool.connect();
  const userAdminCol = await detectUserAdminColumn(client);
  const qCol = `"${userAdminCol}"`;

  try {
    await client.query("BEGIN");
    console.log("Phase 1 migration starting...");
    console.log(`  User tenant column: ${userAdminCol}\n`);

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "TenantDomainKind" AS ENUM ('storefront', 'admin_panel');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    if (!(await tableExists(client, "tenant_domain"))) {
      await client.query(`
        CREATE TABLE tenant_domain (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "adminId" TEXT NOT NULL REFERENCES admin(id) ON DELETE CASCADE,
          host TEXT NOT NULL,
          kind "TenantDomainKind" NOT NULL DEFAULT 'storefront',
          "isPrimary" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT tenant_domain_host_key UNIQUE (host)
        );
      `);
      await client.query(
        `CREATE INDEX IF NOT EXISTS tenant_domain_adminId_idx ON tenant_domain("adminId");`
      );
      console.log("1) tenant_domain table created");
    } else {
      console.log("1) tenant_domain table already exists");
    }

    console.log("2) Backfilling admin slugs...");
    await backfillAdminSlugs(client);

    const defaultAdmin = await getDefaultAdminId(client);
    console.log(`3) Default admin: ${defaultAdmin.id} (slug=${defaultAdmin.slug})`);

    const orphan = await client.query(
      `SELECT COUNT(*)::int AS c FROM "user" WHERE ${qCol} IS NULL`
    );
    if (orphan.rows[0].c > 0) {
      await client.query(
        `UPDATE "user" SET ${qCol} = $1, "updatedAt" = now() WHERE ${qCol} IS NULL`,
        [defaultAdmin.id]
      );
      console.log(`   Backfilled ${orphan.rows[0].c} users`);
    }

    const dupes = await client.query(`
      SELECT ${qCol}, lower(email) AS email, COUNT(*)::int AS c
      FROM "user"
      GROUP BY ${qCol}, lower(email)
      HAVING COUNT(*) > 1
    `);
    if (dupes.rows.length > 0) {
      console.error("Duplicate (adminId, email) pairs:", dupes.rows);
      throw new Error("Resolve duplicate tenant emails before migration");
    }

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE "user"
          ADD CONSTRAINT user_admin_tenant_fkey
          FOREIGN KEY (${qCol}) REFERENCES admin(id) ON DELETE RESTRICT;
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await client.query(`ALTER TABLE "user" ALTER COLUMN ${qCol} SET NOT NULL`);
    console.log("4) user.adminId NOT NULL");

    await client.query(`ALTER TABLE "user" DROP CONSTRAINT IF EXISTS user_email_key`);
    await client.query(`DROP INDEX IF EXISTS user_email_key`);

    const compositeIdx =
      userAdminCol === "adminId"
        ? "user_adminId_email_key"
        : "user_admin_id_email_key";
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ${compositeIdx}
      ON "user" (${qCol}, email)
    `);
    console.log("5) Composite unique (adminId, email) applied");

    await client.query(
      `UPDATE admin SET slug = 'tenant-' || substring(id, 1, 8) WHERE slug IS NULL OR slug = ''`
    );
    await client.query(`ALTER TABLE admin ALTER COLUMN slug SET NOT NULL`);
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE admin ADD CONSTRAINT admin_slug_key UNIQUE (slug);
      EXCEPTION
        WHEN duplicate_object THEN NULL;
        WHEN duplicate_table THEN NULL;
      END $$;
    `);
    console.log("6) admin.slug NOT NULL + UNIQUE");

    console.log("7) Seeding tenant domains...");
    await seedTenantDomains(client, defaultAdmin.id);

    await client.query("COMMIT");
    console.log("\nPhase 1 migration completed successfully.");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("\nMigration failed:", e.message);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
