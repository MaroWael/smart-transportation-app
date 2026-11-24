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
import authRouter from './routes/auth.route';
import docsRouter from './routes/docs.route';
import metroRouter from './routes/metro.route';
import stationRouter from './routes/station.route';
import busRouter from './routes/bus.route';
import journeyRouter from './routes/journey.route';
import bookingRouter from './routes/booking.route';
import ticketRouter from './routes/ticket.route';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

export const app: Application = express();

// 1. JSON request parsing
app.use(express.json());

// 2. CORS — restrict to the frontend URL(s) in production
//    env.FRONTEND_URL is a comma-separated list transformed into an array.
//    Requests with no Origin header (e.g. mobile apps) are allowed.
const frontendOrigins = env.FRONTEND_URL;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no Origin header (mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }
      if (frontendOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
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
app.use('/api/auth', authRouter);
app.use('/api/metro', metroRouter);
app.use('/api/stations', stationRouter);
app.use('/api/bus', busRouter);
app.use('/api/journeys', journeyRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/tickets', ticketRouter);
app.use('/api', docsRouter);

// 5. 404 handler (after routes)
app.use(notFoundHandler);

// 6. Centralized error-handling handler (last)
app.use(errorHandler);
