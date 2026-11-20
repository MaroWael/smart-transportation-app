// ---------------------------------------------------------------
// Smart Transportation — Metro controller
// ---------------------------------------------------------------

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { getMetroLines, getMetroLineById } from '../services/metro.service';
import { uuidParamSchema } from '../validators/transport.validator';
import { AppError } from '../middlewares/error.middleware';

export const validateMetroLineId = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    uuidParamSchema.parse(req.params);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      next(new AppError('Invalid id parameter', 400, error.flatten().fieldErrors));
      return;
    }
    next(error);
  }
};

export const listMetroLines = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await getMetroLines();
    res.status(200).json({
      status: 'ok',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getMetroLine = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await getMetroLineById(req.params.id);
    res.status(200).json({
      status: 'ok',
      data,
    });
  } catch (error) {
    next(error);
  }
};
