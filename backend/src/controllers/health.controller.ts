// ---------------------------------------------------------------
// Smart Transportation — Health controller
// ---------------------------------------------------------------
// GET /api/health
// Reports application status, environment, and actual Neon database
// connectivity (verified with a lightweight query).
// ---------------------------------------------------------------

import { Request, Response } from 'express';
import { prisma } from '../config/prisma';

export const healthCheck = async (
  _req: Request,
  res: Response
): Promise<void> => {
  let dbConnected = false;
  let dbError: string | null = null;

  try {
    // Lightweight connectivity check against Neon
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
  } catch (error) {
    dbError =
      error instanceof Error ? error.message : 'Unknown database error';
  }

  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'ok' : 'degraded',
    environment: process.env.NODE_ENV ?? 'development',
    database: {
      connected: dbConnected,
      ...(dbError ? { error: dbError } : {}),
    },
    timestamp: new Date().toISOString(),
  });
};
