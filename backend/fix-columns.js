const { Pool } = require('pg');
const p = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5433/truebeauty' });

async function fixColumns() {
  try {
    const renameMap = [
      ['category', 'adminid', 'adminId'],
      ['category', 'isactive', 'isActive'],
      ['category', 'sortorder', 'sortOrder'],
      ['category', 'createdat', 'createdAt'],
      ['category', 'updatedat', 'updatedAt'],
      ['product', 'adminid', 'adminId'],
      ['product', 'categoryid', 'categoryId'],
      ['product', 'categoryname', 'categoryName'],
      ['coupon', 'adminid', 'adminId'],
    ];

    for (const [table, from, to] of renameMap) {
      try {
        await p.query(`ALTER TABLE "${table}" RENAME COLUMN "${from}" TO "${to}"`);
        console.log(`Renamed ${table}.${from} -> ${to}`);
      } catch (e) {
        if (e.code === '42703') {
          console.log(`  ${table}.${from} already correct or not found`);
        } else if (e.code === '42701') {
          console.log(`  ${table}.${to} already exists`);
        } else {
          console.error(`  Error renaming ${table}.${from}:`, e.message);
        }
      }
    }
    console.log('Done');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await p.end();
  }
}

fixColumns();
