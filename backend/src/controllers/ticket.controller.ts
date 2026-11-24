// ---------------------------------------------------------------
// Smart Transportation — Ticket Validation Controller
// ---------------------------------------------------------------

import { NextFunction, Request, Response } from 'express';
import { AppError } from '../middlewares/error.middleware';
import { validateTicketSchema } from '../validators/ticket.validator';
import {
  getRecentValidations,
  validateTicket,
} from '../services/ticket.service';

export const validateTicketHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = validateTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      next(
        new AppError(
          'Invalid ticket validation input',
          400,
          parsed.error.flatten().fieldErrors
        )
      );
      return;
    }

    const result = await validateTicket(req.user!.id, parsed.data);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getValidationsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await getRecentValidations(req.user!.id, req.user!.role);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
