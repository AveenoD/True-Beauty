require("dotenv").config();
const { Client } = require("pg");

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const preview = await client.query(`
    with ranked as (
      select id, phone,
             row_number() over (partition by phone order by "createdAt" asc, id asc) as rn
      from "user"
      where phone is not null
    )
    select phone, count(*)::int as count
    from ranked
    group by phone
    having count(*) > 1
    order by count desc, phone asc
  `);

  console.log(`duplicatePhonesBefore=${preview.rows.length}`);
  if (!preview.rows.length) {
    await client.end();
    return;
  }
  console.log(preview.rows);

  const updated = await client.query(`
    with ranked as (
      select id,
             row_number() over (partition by phone order by "createdAt" asc, id asc) as rn
      from "user"
      where phone is not null
    )
    update "user" u
    set phone = null
    from ranked r
    where u.id = r.id
      and r.rn > 1
    returning u.id
  `);

  console.log(`nullifiedPhones=${updated.rowCount}`);

  const after = await client.query(`
    select phone, count(*)::int as count
    from "user"
    where phone is not null
    group by phone
    having count(*) > 1
    order by count desc, phone asc
  `);
  console.log(`duplicatePhonesAfter=${after.rows.length}`);

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

