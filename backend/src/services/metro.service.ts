// ---------------------------------------------------------------
// Smart Transportation — Metro service
// ---------------------------------------------------------------
// Business logic for metro lines and line details.
// Avoids N+1 queries via Prisma include/select.
// ---------------------------------------------------------------

import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';

export interface StationLineSummary {
  id: string;
  number: number;
  color: string;
}

export interface MetroLineSummary {
  id: string;
  number: number;
  nameEn: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  stationCount: number;
}

export interface MetroLineStationItem {
  id: string;
  nameEn: string;
  lat: number;
  lng: number;
  order: number;
  branch: string | null;
  lines: StationLineSummary[];
  isInterchange: boolean;
}

export interface MetroLineDetail {
  id: string;
  number: number;
  nameEn: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  branches: string[];
  stations: MetroLineStationItem[];
}

export const getMetroLines = async (): Promise<MetroLineSummary[]> => {
  const lines = await prisma.metroLine.findMany({
    orderBy: { number: 'asc' },
    include: {
      _count: {
        select: { lineStations: true },
      },
    },
  });

  return lines.map((line) => ({
    id: line.id,
    number: line.number,
    nameEn: line.nameEn,
    color: line.color,
    createdAt: line.createdAt,
    updatedAt: line.updatedAt,
    stationCount: line._count.lineStations,
  }));
};

export const getMetroLineById = async (id: string): Promise<MetroLineDetail> => {
  const line = await prisma.metroLine.findUnique({
    where: { id },
    include: {
      lineStations: {
        orderBy: { order: 'asc' },
        include: {
          station: {
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
          },
        },
      },
    },
  });

  if (!line) {
    throw new AppError('Metro line not found', 404);
  }

  const stations: MetroLineStationItem[] = line.lineStations.map((ls) => {
    const stationLines = ls.station.lineStations
      .map((item) => ({
        id: item.line.id,
        number: item.line.number,
        color: item.line.color,
      }))
      .sort((a, b) => a.number - b.number);

    return {
      id: ls.station.id,
      nameEn: ls.station.nameEn,
      lat: ls.station.lat,
      lng: ls.station.lng,
      order: ls.order,
      branch: ls.branch ?? null,
      lines: stationLines,
      isInterchange: stationLines.length > 1,
    };
  });

  const branches = Array.from(
    new Set(
      stations
        .map((s) => s.branch)
        .filter((b): b is string => Boolean(b))
    )
  );

  return {
    id: line.id,
    number: line.number,
    nameEn: line.nameEn,
    color: line.color,
    createdAt: line.createdAt,
    updatedAt: line.updatedAt,
    branches,
    stations,
  };
};
