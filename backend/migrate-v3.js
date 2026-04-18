const { Pool } = require('pg');
const p = new Pool({ host: 'localhost', port: 5433, user: 'postgres', password: 'postgres', database: 'truebeauty' });

async function migrate() {
  try {
    // Add slug to Admin
    await p.query(`ALTER TABLE admin ADD COLUMN IF NOT EXISTS slug TEXT`);

    // Create Category table
    await p.query(`
      CREATE TABLE IF NOT EXISTS category (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id TEXT NOT NULL REFERENCES admin(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        image TEXT,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(admin_id, slug)
      )`);

    // Add categoryId and categoryName to Product
    await p.query(`ALTER TABLE product ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES category(id)`);
    await p.query(`ALTER TABLE product ADD COLUMN IF NOT EXISTS category_name TEXT`);

    // Add adminId and description to Coupon (nullable for initial data)
    await p.query(`ALTER TABLE coupon ADD COLUMN IF NOT EXISTS admin_id TEXT`);
    await p.query(`ALTER TABLE coupon ADD COLUMN IF NOT EXISTS description TEXT`);
    await p.query(`ALTER TABLE coupon DROP CONSTRAINT IF EXISTS coupon_admin_id_fkey`);
    await p.query(`ALTER TABLE coupon ADD CONSTRAINT coupon_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES admin(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED`);
    await p.query(`DROP INDEX IF EXISTS coupon_admin_id_code_key`);
    await p.query(`CREATE UNIQUE INDEX coupon_admin_id_code_key ON coupon(admin_id, code)`);

    // Add index on product adminId
    try {
      await p.query(`CREATE INDEX IF NOT EXISTS product_admin_id_idx ON product(admin_id)`);
    } catch (e) { /* ignore */ }

    console.log('Schema migration completed successfully');
  } catch (e) {
    console.error('Migration error:', e.message);
  } finally {
    await p.end();
  }
}

migrate();
