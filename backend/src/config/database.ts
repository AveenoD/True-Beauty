import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5433/truebeauty?schema=public";
const adapter = new PrismaPg(new pg.Pool({ connectionString }));
const prisma = new PrismaClient({ adapter });

export default prisma;
