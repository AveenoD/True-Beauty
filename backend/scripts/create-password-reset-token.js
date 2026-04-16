require("dotenv").config();
const { Client } = require("pg");
const crypto = require("crypto");

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node scripts/create-password-reset-token.js <email>");
    process.exit(1);
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const u = await client.query('select id from "user" where email=$1 limit 1', [
    email,
  ]);
  const userId = u.rows[0]?.id;
  if (!userId) {
    console.error("User not found");
    process.exit(1);
  }

  await client.query(
    'insert into auth_token (id, token, type, "userId", "expiresAt", "createdAt") values (gen_random_uuid()::text, $1, $2, $3, $4, now())',
    [tokenHash, "password_reset", userId, expiresAt]
  );

  await client.end();
  console.log(rawToken);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

