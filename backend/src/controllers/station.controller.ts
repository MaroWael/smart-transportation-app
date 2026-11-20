// ---------------------------------------------------------------
// Smart Transportation — Station controller
// ---------------------------------------------------------------

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { getStations } from '../services/station.service';
import { stationsQuerySchema } from '../validators/transport.validator';
import { AppError } from '../middlewares/error.middleware';

export const validateStationQuery = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    req.query = stationsQuerySchema.parse(req.query) as any;
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      next(
        new AppError('Invalid query parameters', 400, error.flatten().fieldErrors)
      );
      return;
    }
    next(error);
  }
};

export const listStations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { q, lineId } = req.query as { q?: string; lineId?: string };
    const data = await getStations({ q, lineId });
    res.status(200).json({
      status: 'ok',
      data,
    });
  } catch (error) {
    next(error);
  }
};
