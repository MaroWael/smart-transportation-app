// ---------------------------------------------------------------
// Smart Transportation — Auth middleware
// ---------------------------------------------------------------
// authenticate: verifies the Bearer JWT (signature + expiry), loads
// the user from the DB, and rejects if missing or inactive. Never
// trusts a role from the request.
// ---------------------------------------------------------------

import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../config/prisma';
import { AppError } from './error.middleware';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AppError('Unauthorized', 401));
    return;
  }

  const token = authHeader.slice(7).trim();

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    next(new AppError('Unauthorized', 401));
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });

  if (!user) {
    next(new AppError('Unauthorized', 401));
    return;
  }

  if (!user.isActive) {
    next(new AppError('Account is inactive', 403));
    return;
  }

  // Never trust a role from the request; the DB-loaded user is the
  // source of truth.
  req.user = user;
  next();
};

// Role-based access control. Runs after authenticate (which loads req.user
// from the DB). Returns 403 when the user's role is not in the allowed list.
export const authorizeRoles = (...roles: string[]) => {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    const user = _req.user;
    if (!user) {
      next(new AppError('Unauthorized', 401));
      return;
    }
    if (!roles.includes(user.role)) {
      next(new AppError('Forbidden', 403));
      return;
    }
    next();
  };
};
