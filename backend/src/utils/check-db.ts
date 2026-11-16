// ---------------------------------------------------------------
// Smart Transportation — Database connectivity check
// ---------------------------------------------------------------
// Runs a lightweight query against Neon to verify the connection.
// Usage: npm run prisma:check
// ---------------------------------------------------------------

import 'dotenv/config';
import { prisma } from '../config/prisma';

async function main(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅  Database connection to Neon successful');
  } catch (error) {
    console.error('❌  Database connection failed:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
