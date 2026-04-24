const pg = require('pg');
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5433/truebeauty?schema=public' });

const newAdminId = '0b61a7f0-5daa-49ae-97fb-b4f39c63489d';
const oldAdminId = 'e5d33188-ddfd-4d62-8af8-8a64caf3bac0';

async function main() {
  // Create subscription for the new admin if it doesn't exist
  const existing = await pool.query('SELECT id FROM admin_subscription WHERE "adminId" = $1', [newAdminId]);

  if (existing.rows.length === 0) {
    // Check if old admin has a subscription
    const oldSub = await pool.query('SELECT * FROM admin_subscription WHERE "adminId" = $1', [oldAdminId]);

    if (oldSub.rows.length > 0) {
      await pool.query(
        'UPDATE admin_subscription SET "adminId" = $1 WHERE "adminId" = $2',
        [newAdminId, oldAdminId]
      );
      console.log('Subscription reassigned from old admin to new admin');
    } else {
      // Create new subscription with professional plan
      await pool.query(
        'INSERT INTO admin_subscription (id, "adminId", "planId", "startDate", "expiryDate", status, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          pgv4(),
          newAdminId,
          'professional',
          new Date().toISOString(),
          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          'active',
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );
      console.log('Subscription created for new admin');
    }
  } else {
    console.log('Admin already has subscription');
  }

  const subs = await pool.query('SELECT s.*, p.name as plan_name FROM admin_subscription s JOIN subscription_plan p ON s."planId" = p.id WHERE s."adminId" = $1', [newAdminId]);
  console.log('Subscription:', JSON.stringify(subs.rows));
  await pool.end();
}

function pgv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

main().then(() => process.exit(0)).catch(e => { console.error(e.message); process.exit(1); });