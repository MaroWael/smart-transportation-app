// ---------------------------------------------------------------
// Smart Transportation — Prisma seed script
// ---------------------------------------------------------------
// Creates the first ADMIN user from ADMIN_EMAIL and ADMIN_PASSWORD.
// Idempotent: skips if an ADMIN already exists.
// Fails with a clear message if ADMIN_EMAIL or ADMIN_PASSWORD is missing.
// ---------------------------------------------------------------

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { env } from '../src/config/env';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    throw new Error(
      'ADMIN_EMAIL and ADMIN_PASSWORD must be set in backend/.env to run the seed.'
    );
  }

  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (existingAdmin) {
    console.log('⏩  Admin already exists, skipping seed.');
    return;
  }

  const passwordHash = await hash(env.ADMIN_PASSWORD, 10);

  await prisma.user.create({
    data: {
      fullName: 'Admin',
      email: env.ADMIN_EMAIL,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log(`✅  Admin user created (${env.ADMIN_EMAIL}).`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
