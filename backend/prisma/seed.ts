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
    console.log('⏩  Admin already exists, skipping admin seed.');
  } else {
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

  // Seed default STATION_EMPLOYEE demo account for QR ticket validation
  const staffEmail = 'staff@smarttransit.eg';
  const existingStaff = await prisma.user.findUnique({
    where: { email: staffEmail },
  });

  if (existingStaff) {
    console.log('⏩  Station employee already exists, skipping staff seed.');
  } else {
    const staffPasswordHash = await hash('Staff1234!', 10);
    await prisma.user.create({
      data: {
        fullName: 'Station Staff',
        email: staffEmail,
        passwordHash: staffPasswordHash,
        role: 'STATION_EMPLOYEE',
        isActive: true,
      },
    });
    console.log(`✅  Station employee created (${staffEmail} / Staff1234!).`);
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
