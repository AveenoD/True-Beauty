const { Pool } = require('pg');
const { randomUUID } = require('crypto');
const bcrypt = require('bcrypt');
const p = new Pool({ host: 'localhost', port: 5433, user: 'postgres', password: 'postgres', database: 'truebeauty' });

async function createAdmin() {
  try {
    const hash = await bcrypt.hash('password123', 10);
    const id = randomUUID();
    const result = await p.query(
      `INSERT INTO "admin"("id","name","email","password","slug") VALUES($1,$2,$3,$4,$5) RETURNING "id","name","email"`,
      [id, 'Test Store', 'admin@test.com', hash, 'test-store']
    );
    console.log('Admin created:', result.rows[0]);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await p.end();
  }
}

createAdmin();
