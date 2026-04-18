require('dotenv/config');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const origQuery = pg.Pool.prototype.query;
pg.Pool.prototype.query = function(...args) {
  const sql = typeof args[0] === 'string' ? args[0] : args[0].text;
  console.log('=== SQL:', sql.substring(0, 200));
  return origQuery.apply(this, args);
};

const adapter = new PrismaPg(new pg.Pool({ connectionString: process.env.DATABASE_URL }));
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ adapter });

p.$connect()
  .then(() => p.category.findMany())
  .then(r => { console.log('OK, count:', r.length); p.$disconnect(); })
  .catch(e => { console.log('Error:', e.message.split('\n')[0]); p.$disconnect(); });
