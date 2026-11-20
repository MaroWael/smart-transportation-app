// ---------------------------------------------------------------
// Smart Transportation — Bus controller
// ---------------------------------------------------------------

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { getBusRoutes, getBusRouteById } from '../services/bus.service';
import { uuidParamSchema } from '../validators/transport.validator';
import { AppError } from '../middlewares/error.middleware';

export const validateBusRouteId = (
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

export const listBusRoutes = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await getBusRoutes();
    res.status(200).json({
      status: 'ok',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getBusRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await getBusRouteById(req.params.id);
    res.status(200).json({
      status: 'ok',
      data,
    });
  } catch (error) {
    next(error);
  }
};
