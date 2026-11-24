// ---------------------------------------------------------------
// Smart Transportation — Booking routes
// ---------------------------------------------------------------
// Protected routes (authenticated passenger):
//   POST /api/bookings
//   GET  /api/bookings/me
//   GET  /api/bookings/:id
//   POST /api/bookings/:id/confirm-payment
// ---------------------------------------------------------------

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  confirmBookingPaymentHandler,
  createBookingHandler,
  createStripeCheckoutHandler,
  getBookingHandler,
  listMyBookingsHandler,
  stripeReturnPageHandler,
  validateBookingId,
  verifyStripeCheckoutHandler,
} from '../controllers/booking.controller';

const bookingRouter = Router();

// Public redirect landing page after Stripe Checkout completes or cancels
bookingRouter.get('/stripe/return', stripeReturnPageHandler);

bookingRouter.use(authenticate);

bookingRouter.post('/', createBookingHandler);
bookingRouter.get('/me', listMyBookingsHandler);
bookingRouter.get('/:id', validateBookingId, getBookingHandler);
bookingRouter.post(
  '/:id/checkout-session',
  validateBookingId,
  createStripeCheckoutHandler
);
bookingRouter.post(
  '/:id/verify-stripe-session',
  validateBookingId,
  verifyStripeCheckoutHandler
);
bookingRouter.post(
  '/:id/confirm-payment',
  validateBookingId,
  confirmBookingPaymentHandler
);

export default bookingRouter;
