// ---------------------------------------------------------------
// Smart Transportation — Transport validators
// ---------------------------------------------------------------
// Zod schemas for Metro, Station, and Bus route requests.
// ---------------------------------------------------------------

import { z } from 'zod';

export const uuidParamSchema = z
  .object({
    id: z.string().uuid('ID must be a valid UUID'),
  })
  .strict();

export const stationsQuerySchema = z
  .object({
    q: z.string().trim().optional(),
    lineId: z.string().uuid('lineId must be a valid UUID').optional(),
  })
  .strip();

export type UuidParamInput = z.infer<typeof uuidParamSchema>;
export type StationsQueryInput = z.infer<typeof stationsQuerySchema>;
