import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = global as unknown as {
    prisma: PrismaClient;
    pgPool: Pool;
};

if (!globalForPrisma.pgPool) {
    globalForPrisma.pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
}

const pool = globalForPrisma.pgPool;
const adapter = new PrismaPg(pool);

export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

// Alias for code that explicitly wants the base (non-extended) client
export const basePrisma = prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
