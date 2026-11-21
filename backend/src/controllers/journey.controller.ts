// ---------------------------------------------------------------
// Smart Transportation — Journey controller
// ---------------------------------------------------------------

import { Request, Response, NextFunction } from 'express';
import { TransportType } from '@prisma/client';
import { ZodError } from 'zod';
import {
  calculateJourney,
  getActiveFareRules,
} from '../services/journey.service';
import { calculateJourneySchema } from '../validators/journey.validator';
import { AppError } from '../middlewares/error.middleware';

export const calculateJourneyHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = calculateJourneySchema.parse(req.body);
    const data = await calculateJourney(parsed);
    res.status(200).json({
      status: 'ok',
      data,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      next(new AppError('Invalid journey request', 400, error.flatten().fieldErrors));
      return;
    }
    next(error);
  }
};

export const listFareRulesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawType = typeof req.query.transportType === 'string'
      ? req.query.transportType.toUpperCase()
      : undefined;

    let transportType: TransportType | undefined;
    if (rawType) {
      if (rawType !== 'METRO' && rawType !== 'BUS') {
        next(new AppError('transportType must be METRO or BUS', 400));
        return;
      }
      transportType = rawType;
    }

    const data = await getActiveFareRules(transportType);
    res.status(200).json({
      status: 'ok',
      data,
    });
  } catch (error) {
    next(error);
  }
};
