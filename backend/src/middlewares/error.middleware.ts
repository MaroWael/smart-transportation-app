// ---------------------------------------------------------------
// Smart Transportation — Error & 404 middleware
// ---------------------------------------------------------------

import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('Unhandled error:', err);

  res.status(500).json({
    status: 'error',
    message:
      process.env.NODE_ENV === 'development' && err instanceof Error
        ? err.message
        : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && err instanceof Error
      ? { stack: err.stack }
      : {}),
  });
};

export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
};
