const { Pool } = require('pg');
const p = new Pool({ host: 'localhost', port: 5433, user: 'postgres', password: 'postgres', database: 'truebeauty' });

async function renameColumns() {
  try {
    // Category table
    await p.query('ALTER TABLE category RENAME COLUMN admin_id TO adminId');
    await p.query('ALTER TABLE category RENAME COLUMN is_active TO isActive');
    await p.query('ALTER TABLE category RENAME COLUMN sort_order TO sortOrder');
    await p.query('ALTER TABLE category RENAME COLUMN created_at TO createdAt');
    await p.query('ALTER TABLE category RENAME COLUMN updated_at TO updatedAt');
    console.log('Category columns renamed');

    // Product table
    await p.query('ALTER TABLE product RENAME COLUMN category_id TO categoryId');
    await p.query('ALTER TABLE product RENAME COLUMN category_name TO categoryName');
    console.log('Product columns renamed');

    // Coupon table
    await p.query('ALTER TABLE coupon RENAME COLUMN admin_id TO adminId');
    console.log('Coupon column renamed');

    console.log('All columns renamed to camelCase successfully');
  } catch (e) {
    if (e.code === '42703') {
      console.log('Column already renamed or does not exist:', e.message);
    } else {
      console.error('Error:', e.message);
    }
  } finally {
    await p.end();
  }
}

renameColumns();
