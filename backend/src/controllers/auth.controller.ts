// ---------------------------------------------------------------
// Smart Transportation — Auth controller
// ---------------------------------------------------------------
// HTTP layer for /api/auth. Validates input, calls the service,
// and returns responses in the existing { status, ... } envelope.
// ---------------------------------------------------------------

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  register as registerService,
  login as loginService,
  getMe as getMeService,
  updateMe as updateMeService,
} from '../services/auth.service';
import {
  registerSchema,
  loginSchema,
  updateMeSchema,
} from '../validators/auth.validator';
import { AppError } from '../middlewares/error.middleware';

type SafeUserAndToken = { user: { id: string }; token: string };

// Validate request body against a Zod schema. On failure throws an
// AppError (400) whose message carries the Zod issues as an "errors"
// array, matching the agreed error-response format.
const validateBody =
  (schema: any) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new AppError('Invalid input', 400, error.flatten().fieldErrors));
        return;
      }
      next(error);
    }
  };

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await registerService(req.body);
    res.status(201).json({
      status: 'ok',
      data: { user: result.user, token: result.token },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await loginService(req.body);
    res.status(200).json({
      status: 'ok',
      data: { user: result.user, token: result.token },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }
    const user = await getMeService(userId);
    res.status(200).json({ status: 'ok', data: { user } });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }
    const user = await updateMeService(userId, req.body);
    res.status(200).json({ status: 'ok', data: { user } });
  } catch (error) {
    next(error);
  }
};

// Validation middleware exports (applied in routes)
export const validateRegister = validateBody(registerSchema);
export const validateLogin = validateBody(loginSchema);
export const validateUpdateMe = validateBody(updateMeSchema);
