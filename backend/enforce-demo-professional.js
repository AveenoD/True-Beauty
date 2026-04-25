require("dotenv/config");
const { Pool } = require("pg");

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5433/truebeauty?schema=public";

const DEMO_EMAIL = "demo@truebeauty.com";
const PLAN_NAME = "professional";

async function main() {
  const pool = new Pool({ connectionString });

  const adminRes = await pool.query(
    'select id, email, slug, "isActive" from admin where email = $1 limit 1',
    [DEMO_EMAIL]
  );
  const admin = adminRes.rows[0];
  if (!admin?.id) {
    console.log("Demo admin not found:", DEMO_EMAIL);
    await pool.end();
    process.exit(1);
  }

  const planRes = await pool.query(
    'select id, name from subscription_plan where lower(name) = lower($1) limit 1',
    [PLAN_NAME]
  );
  const plan = planRes.rows[0];
  if (!plan?.id) {
    console.log("Plan not found by name:", PLAN_NAME);
    await pool.end();
    process.exit(1);
  }

  const now = new Date();
  const expiry = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  // Upsert (adminId is unique).
  await pool.query(
    `
    insert into admin_subscription
      (id, "adminId", "planId", "startDate", "expiryDate", status, "createdAt", "updatedAt")
    values
      (gen_random_uuid(), $1, $2, $3, $4, 'active', $3, $3)
    on conflict ("adminId") do update
      set "planId" = excluded."planId",
          "startDate" = excluded."startDate",
          "expiryDate" = excluded."expiryDate",
          status = 'active',
          "updatedAt" = excluded."updatedAt"
    `,
    [admin.id, plan.id, now.toISOString(), expiry.toISOString()]
  );

  const subRes = await pool.query(
    `
    select s.id, s.status, s."startDate", s."expiryDate", p.id as plan_id, p.name as plan_name
    from admin_subscription s
    join subscription_plan p on p.id = s."planId"
    where s."adminId" = $1
    `,
    [admin.id]
  );

  console.log("Enforced subscription for demo admin:", {
    admin,
    subscription: subRes.rows[0] ?? null,
  });

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

