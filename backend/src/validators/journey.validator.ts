// ---------------------------------------------------------------
// Smart Transportation — Journey & Fare validators
// ---------------------------------------------------------------

import { z } from 'zod';

const metroJourneySchema = z
  .object({
    transportType: z.literal('METRO'),
    originStationId: z.string().uuid('originStationId must be a valid UUID'),
    destinationStationId: z.string().uuid('destinationStationId must be a valid UUID'),
  })
  .strict();

const busJourneySchema = z
  .object({
    transportType: z.literal('BUS'),
    busRouteId: z.string().uuid('busRouteId must be a valid UUID'),
    originStopId: z.string().uuid('originStopId must be a valid UUID'),
    destinationStopId: z.string().uuid('destinationStopId must be a valid UUID'),
  })
  .strict();

export const calculateJourneySchema = z.discriminatedUnion('transportType', [
  metroJourneySchema,
  busJourneySchema,
]);

export type CalculateJourneyInput = z.infer<typeof calculateJourneySchema>;
