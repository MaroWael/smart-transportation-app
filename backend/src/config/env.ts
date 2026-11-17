// ---------------------------------------------------------------
// Smart Transportation — Environment validation
// ---------------------------------------------------------------
// Reads required environment variables and fails fast with a clear
// message if any are missing. Never logs actual secret values.
// ---------------------------------------------------------------

import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  // Neon pooled connection string — used by Prisma Client at runtime
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  // Neon direct connection string — used by Prisma migrations
  DIRECT_URL: z.string().min(1, 'DIRECT_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  // JWT access token lifetime (e.g. "7d", "1h"). Defaults to 7 days.
  JWT_EXPIRES_IN: z.string().default('7d'),
  // Comma-separated list of allowed frontend origins (e.g. "http://localhost:8081,http://localhost:19006")
  FRONTEND_URL: z
    .string()
    .min(1, 'FRONTEND_URL is required')
    .transform((val) =>
      val.split(',').map((s) => s.trim()).filter(Boolean)
    ),
  // Optional seed credentials (used only by prisma/seed.ts).
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌  Missing or invalid environment variables:');
  for (const [field, issues] of Object.entries(
    _env.error.flatten().fieldErrors
  )) {
    console.error(`   • ${field}: ${issues.join(', ')}`);
  }
  console.error(
    '\n   Copy backend/.env.example to backend/.env and fill in your values.'
  );
  process.exit(1);
}

export const env = _env.data;
