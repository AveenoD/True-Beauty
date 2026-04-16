require("dotenv").config();
const { Client } = require("pg");

async function main() {
  const token = process.argv[2];
  if (!token) {
    console.error("Usage: node scripts/check-refresh-token.js <refreshToken>");
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const r = await client.query(
    'select id, type, "userId", "expiresAt", "revokedAt", "createdAt" from auth_token where token=$1 limit 5',
    [token]
  );
  console.log(r.rows);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

