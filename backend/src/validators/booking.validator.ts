// ---------------------------------------------------------------
// Smart Transportation — Booking & Payment validators
// ---------------------------------------------------------------

import { z } from 'zod';
import { calculateJourneySchema } from './journey.validator';

export const createBookingSchema = calculateJourneySchema;

export const confirmPaymentSchema = z
  .object({
    outcome: z.enum(['SUCCEEDED', 'FAILED', 'CANCELLED']).default('SUCCEEDED'),
    paymentMethodToken: z
      .enum([
        'pm_card_visa',
        'pm_card_mastercard',
        'pm_card_chargeDeclined',
        'pm_card_chargeDeclinedInsufficientFunds',
        'pm_card_chargeDeclinedExpiredCard',
        'pm_card_cvcCheckFail',
      ])
      .optional(),
  })
  .strict();

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;
