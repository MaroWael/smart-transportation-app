// ---------------------------------------------------------------
// Smart Transportation — Station service
// ---------------------------------------------------------------
// Business logic for stations search and filtering.
// Avoids N+1 queries via Prisma include/select.
// ---------------------------------------------------------------

import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { StationLineSummary } from './metro.service';

export interface StationSummary {
  id: string;
  nameEn: string;
  lat: number;
  lng: number;
  createdAt: Date;
  updatedAt: Date;
  lines: StationLineSummary[];
  isInterchange: boolean;
}

export const getStations = async (filters: {
  q?: string;
  lineId?: string;
}): Promise<StationSummary[]> => {
  const where: Prisma.StationWhereInput = {};

  if (filters.q) {
    where.nameEn = {
      contains: filters.q,
      mode: 'insensitive',
    };
  }

  if (filters.lineId) {
    where.lineStations = {
      some: {
        lineId: filters.lineId,
      },
    };
  }

  const stations = await prisma.station.findMany({
    where,
    orderBy: { nameEn: 'asc' },
    include: {
      lineStations: {
        include: {
          line: {
            select: {
              id: true,
              number: true,
              color: true,
            },
          },
        },
      },
    },
  });

  return stations.map((s) => {
    const stationLines = s.lineStations
      .map((ls) => ({
        id: ls.line.id,
        number: ls.line.number,
        color: ls.line.color,
      }))
      .sort((a, b) => a.number - b.number);

    return {
      id: s.id,
      nameEn: s.nameEn,
      lat: s.lat,
      lng: s.lng,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      lines: stationLines,
      isInterchange: stationLines.length > 1,
    };
  });
};
