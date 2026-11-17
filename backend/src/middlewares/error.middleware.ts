// ---------------------------------------------------------------
// Smart Transportation — Error & 404 middleware
// ---------------------------------------------------------------

import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';

// Operational error that carries an explicit HTTP status code (e.g.
// 400, 401, 403, 404, 409). Used by controllers/services to signal
// expected client or auth errors instead of always returning 500.
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: unknown;

  constructor(message: string, statusCode: number, errors?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const isDev = process.env.NODE_ENV === 'development';

  console.error('Unhandled error:', err);

  const body: { status: string; message: string; errors?: unknown; stack?: string } = {
    status: 'error',
    message:
      isDev && err instanceof Error
        ? err.message
        : statusCode === 500
          ? 'Internal server error'
          : err instanceof Error
            ? err.message
            : 'Internal server error',
  };

  if (err instanceof AppError && err.errors) {
    body.errors = err.errors;
  }

  if (isDev && err instanceof Error) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
};
