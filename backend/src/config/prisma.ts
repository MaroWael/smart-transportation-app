// ---------------------------------------------------------------
// Smart Transportation — Prisma Client singleton
// ---------------------------------------------------------------
// A module-level singleton prevents creating a new PrismaClient on
// every request / serverless invocation, which would exhaust the
// Neon connection pool. The instance is reused for the lifetime of
// the (warm) function instance.
//
// DATABASE_URL (pooled, with pgbouncer) is read automatically from
// process.env by PrismaClient. On Vercel this comes from Project
// Settings → Environment Variables; locally from backend/.env.
// ---------------------------------------------------------------

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
