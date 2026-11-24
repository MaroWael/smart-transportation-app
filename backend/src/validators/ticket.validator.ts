// ---------------------------------------------------------------
// Smart Transportation — Ticket Validation Zod Schemas
// ---------------------------------------------------------------

import { z } from 'zod';

export const validateTicketSchema = z
  .object({
    qrPayload: z.string().trim().min(1).max(256).optional(),
    ticketCode: z.string().trim().min(1).max(64).optional(),
    stationName: z.string().trim().min(1).max(120).optional(),
  })
  .refine((data) => Boolean(data.qrPayload || data.ticketCode), {
    message: 'Either qrPayload or ticketCode is required',
  });

export type ValidateTicketInput = z.infer<typeof validateTicketSchema>;
