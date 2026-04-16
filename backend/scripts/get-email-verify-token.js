require("dotenv").config();
const { Client } = require("pg");

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node scripts/get-email-verify-token.js <email>");
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const result = await client.query(
    `
    select t.token
    from auth_token t
    join "user" u on u.id = t."userId"
    where u.email = $1
      and t.type = 'email_verify'
    order by t."createdAt" desc
    limit 1
  `,
    [email]
  );

  console.log(result.rows[0]?.token || "");
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

