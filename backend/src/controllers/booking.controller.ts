// ---------------------------------------------------------------
// Smart Transportation — Booking controller
// ---------------------------------------------------------------

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  confirmBookingPayment,
  createBooking,
  createStripeCheckoutForBooking,
  getBookingById,
  getMyBookings,
  verifyStripeCheckoutForBooking,
} from '../services/booking.service';
import {
  confirmPaymentSchema,
  createBookingSchema,
} from '../validators/booking.validator';
import { uuidParamSchema } from '../validators/transport.validator';
import { AppError } from '../middlewares/error.middleware';

export const validateBookingId = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    uuidParamSchema.parse(req.params);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      next(new AppError('Invalid booking id', 400, error.flatten().fieldErrors));
      return;
    }
    next(error);
  }
};

export const createBookingHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = createBookingSchema.parse(req.body);
    const data = await createBooking(req.user!.id, parsed);
    res.status(201).json({
      status: 'ok',
      data,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      next(
        new AppError('Invalid booking request', 400, error.flatten().fieldErrors)
      );
      return;
    }
    next(error);
  }
};

export const confirmBookingPaymentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = confirmPaymentSchema.parse(req.body ?? {});
    const data = await confirmBookingPayment(
      req.user!.id,
      req.params.id,
      parsed.outcome,
      parsed.paymentMethodToken
    );
    res.status(200).json({
      status: 'ok',
      data,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      next(
        new AppError(
          'Invalid payment confirmation request',
          400,
          error.flatten().fieldErrors
        )
      );
      return;
    }
    next(error);
  }
};

export const listMyBookingsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await getMyBookings(req.user!.id);
    res.status(200).json({
      status: 'ok',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getBookingHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await getBookingById(req.user!.id, req.params.id);
    res.status(200).json({
      status: 'ok',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const createStripeCheckoutHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
    const host = req.get('host') || 'localhost:5000';
    const backendOrigin = `${proto}://${host}`;
    const appReturnUrl =
      typeof req.body?.appReturnUrl === 'string'
        ? req.body.appReturnUrl
        : undefined;

    const data = await createStripeCheckoutForBooking(
      req.user!.id,
      req.params.id,
      backendOrigin,
      appReturnUrl
    );
    res.status(200).json({
      status: 'ok',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyStripeCheckoutHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await verifyStripeCheckoutForBooking(
      req.user!.id,
      req.params.id
    );
    res.status(200).json({
      status: 'ok',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const stripeReturnPageHandler = (req: Request, res: Response): void => {
  const status = req.query.status === 'success' ? 'success' : 'cancel';
  const appReturn =
    typeof req.query.appReturn === 'string' ? req.query.appReturn : '';
  const safeDeepLink =
    appReturn && /^(exp|smarttransportation|https?):\/\//i.test(appReturn)
      ? appReturn
      : '';

  const title =
    status === 'success'
      ? 'Payment Completed!'
      : 'Payment Cancelled';
  const subtitle =
    status === 'success'
      ? 'Returning you to Smart Transportation App to display your QR ticket…'
      : 'You cancelled the Stripe checkout. Close this window to return to the app.';

  res.status(200).type('html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F6F3EA; color: #26352C; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; }
    .card { background: #FFFFFF; border: 1px solid #D4CFC3; border-top: 5px solid ${status === 'success' ? '#294B3A' : '#A45A3F'}; border-radius: 12px; padding: 28px 24px; max-width: 380px; width: 100%; text-align: center; box-shadow: 0 6px 20px rgba(0,0,0,0.06); }
    h1 { color: ${status === 'success' ? '#294B3A' : '#A45A3F'}; font-size: 22px; margin: 0 0 10px 0; }
    p { font-size: 14px; line-height: 1.5; color: #475569; margin: 0 0 18px 0; }
    .btn { display: inline-block; background: #294B3A; color: #FFFFFF; text-decoration: none; padding: 11px 22px; border-radius: 8px; font-weight: 600; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${subtitle}</p>
    ${safeDeepLink ? `<a class="btn" href="${safeDeepLink}">Return to App</a>` : ''}
  </div>
  ${safeDeepLink ? `<script>setTimeout(function(){ window.location.href = ${JSON.stringify(safeDeepLink)}; }, 400);</script>` : ''}
</body>
</html>`);
};
