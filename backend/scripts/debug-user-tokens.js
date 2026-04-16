require("dotenv").config();
const { Client } = require("pg");

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node scripts/debug-user-tokens.js <email>");
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const u = await client.query('select id from "user" where email=$1 limit 1', [
    email,
  ]);
  const userId = u.rows[0]?.id;
  if (!userId) {
    console.log("no_user");
    await client.end();
    return;
  }

  const t = await client.query(
    'select type, token, "expiresAt", "revokedAt", "createdAt" from auth_token where "userId"=$1 order by "createdAt" desc limit 15',
    [userId]
  );

  console.log({ userId, tokens: t.rows });
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

