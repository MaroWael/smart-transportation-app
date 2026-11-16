// ---------------------------------------------------------------
// Smart Transportation — Express application
// ---------------------------------------------------------------
// Creates and configures the Express app. The app is exported (as a
// named export) so it can be reused by both:
//   - src/server.ts  -> local development (calls app.listen)
//   - api/index.ts   -> Vercel serverless entry (exported as default,
//                       no app.listen)
//
// Middleware order:
//   1. env validation (imported, runs on module load)
//   2. JSON body parsing
//   3. CORS
//   4. dev request logging
//   5. API routes (mounted under /api)
//   6. 404 handler
//   7. centralized error handler
// ---------------------------------------------------------------

import express, { Application } from 'express';
import cors from 'cors';
import { env } from './config/env';
import healthRouter from './routes/health.route';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

export const app: Application = express();

// 1. JSON request parsing
app.use(express.json());

// 2. CORS — restrict to the frontend URL in production, allow all in dev
app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
  })
);

// 3. Request logging for development
if (env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// 4. API routes (all mounted under /api)
app.use('/api', healthRouter);

// 5. 404 handler (after routes)
app.use(notFoundHandler);

// 6. Centralized error-handling handler (last)
app.use(errorHandler);
