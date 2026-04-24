require('dotenv/config');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5433/truebeauty?schema=public";
const adapter = new PrismaPg(new Pool({ connectionString }));
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash('Admin@123', 12);
  const updated = await prisma.admin.update({
    where: { email: 'admin@truebeauty.com' },
    data: { password: hash },
    select: { id: true, name: true, email: true, role: true }
  });
  console.log('Password reset:', JSON.stringify(updated, null, 2));
  await prisma.$disconnect();
}
main().catch(e => { console.error(e.message); process.exit(1); });
