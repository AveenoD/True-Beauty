const { Pool } = require('pg');
const p = new Pool({ host: 'localhost', port: 5433, user: 'postgres', password: 'postgres', database: 'truebeauty' });

async function migrate() {
  try {
    // Make adminId nullable temporarily for Category
    try {
      await p.query(`ALTER TABLE category ALTER COLUMN admin_id DROP NOT NULL`);
    } catch (e) { /* ignore */ }

    // Make coupon adminId nullable
    try {
      await p.query(`ALTER TABLE coupon ALTER COLUMN admin_id DROP NOT NULL`);
    } catch (e) { /* ignore */ }

    console.log('Schema constraints fixed');
  } catch (e) {
    console.error('Migration error:', e.message);
  } finally {
    await p.end();
  }
}

migrate();
