require("dotenv").config();
const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const result = await client.query(
    'select phone, count(*) as c from "user" where phone is not null group by phone having count(*) > 1 order by c desc, phone asc limit 50'
  );

  console.log(`duplicatePhones=${result.rows.length}`);
  if (result.rows.length) {
    console.log(result.rows);
  }

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

