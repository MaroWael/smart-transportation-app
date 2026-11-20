// ---------------------------------------------------------------
// Smart Transportation — Bus service
// ---------------------------------------------------------------
// Business logic for bus routes and stops.
// Avoids N+1 queries via Prisma include/select.
// ---------------------------------------------------------------

import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';

export interface BusRouteSummary {
  id: string;
  code: string;
  nameEn: string;
  createdAt: Date;
  updatedAt: Date;
  stopCount: number;
}

export interface BusStopItem {
  id: string;
  nameEn: string;
  lat: number;
  lng: number;
  order: number;
}

export interface BusRouteDetail {
  id: string;
  code: string;
  nameEn: string;
  createdAt: Date;
  updatedAt: Date;
  stops: BusStopItem[];
}

export const getBusRoutes = async (): Promise<BusRouteSummary[]> => {
  const routes = await prisma.busRoute.findMany({
    orderBy: { code: 'asc' },
    include: {
      _count: {
        select: { routeStops: true },
      },
    },
  });

  return routes.map((r) => ({
    id: r.id,
    code: r.code,
    nameEn: r.nameEn,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    stopCount: r._count.routeStops,
  }));
};

export const getBusRouteById = async (id: string): Promise<BusRouteDetail> => {
  const route = await prisma.busRoute.findUnique({
    where: { id },
    include: {
      routeStops: {
        orderBy: { order: 'asc' },
        include: {
          stop: true,
        },
      },
    },
  });

  if (!route) {
    throw new AppError('Bus route not found', 404);
  }

  const stops: BusStopItem[] = route.routeStops.map((rs) => ({
    id: rs.stop.id,
    nameEn: rs.stop.nameEn,
    lat: rs.stop.lat,
    lng: rs.stop.lng,
    order: rs.order,
  }));

  return {
    id: route.id,
    code: route.code,
    nameEn: route.nameEn,
    createdAt: route.createdAt,
    updatedAt: route.updatedAt,
    stops,
  };
};
