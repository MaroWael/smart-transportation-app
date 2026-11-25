// ---------------------------------------------------------------
// Smart Transportation — Journey Planning & Fare Calculation Service
// ---------------------------------------------------------------
// Computes shortest path & fare for:
//   - METRO: BFS across all metro lines, interchanges, and diverging
//            branches (e.g., Line 3 splitting at Kit Kat).
//   - BUS:   Ordered stops along a selected bus route (bidirectional).
// ---------------------------------------------------------------

import { TransportType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../middlewares/error.middleware';
import { CalculateJourneyInput } from '../validators/journey.validator';

export interface JourneyFareInfo {
  fareRuleId: string;
  amount: number;
  currency: string;
  pricingModel: 'STATION_TIERS' | 'DISTANCE_BASED';
  minStops: number;
  maxStops: number;
  baseFare?: number;
  ratePerKm?: number;
}

export interface JourneyLineBadge {
  id: string;
  number: number;
  nameEn: string;
  color: string;
}

export interface JourneyTransfer {
  stationId: string;
  stationName: string;
  fromLine: JourneyLineBadge;
  toLine: JourneyLineBadge;
}

export interface JourneyStopNode {
  id: string;
  nameEn: string;
  lat: number;
  lng: number;
  order: number;
  line?: JourneyLineBadge;
}

export interface JourneyCalculationResult {
  transportType: TransportType;
  origin: { id: string; nameEn: string };
  destination: { id: string; nameEn: string };
  busRoute?: { id: string; code: string; nameEn: string };
  stopCount: number;
  distanceKm?: number;
  estimatedMinutes: number;
  fare: JourneyFareInfo;
  transfers: JourneyTransfer[];
  path: JourneyStopNode[];
}

const BUS_RATE_PER_KM = 1.5;
const BUS_MIN_FARE = 10;
const BUS_ROAD_WINDING_FACTOR = 1.25;
const BUS_AVG_SPEED_KMH = 20;

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface GraphEdge {
  toStationId: string;
  line: JourneyLineBadge;
}

interface StationMeta {
  id: string;
  nameEn: string;
  lat: number;
  lng: number;
}

async function resolveFareRule(
  transportType: TransportType,
  stopCount: number
): Promise<JourneyFareInfo> {
  const rule = await prisma.fareRule.findFirst({
    where: {
      transportType,
      isActive: true,
      minStops: { lte: stopCount },
      maxStops: { gte: stopCount },
    },
    orderBy: { price: 'asc' },
  });

  if (!rule) {
    throw new AppError(
      `No active fare rule configured for ${transportType} with ${stopCount} stops`,
      404
    );
  }

  return {
    fareRuleId: rule.id,
    amount: rule.price,
    currency: rule.currency,
    pricingModel: 'STATION_TIERS',
    minStops: rule.minStops,
    maxStops: rule.maxStops,
  };
}

export async function getActiveFareRules(transportType?: TransportType) {
  return prisma.fareRule.findMany({
    where: {
      isActive: true,
      ...(transportType ? { transportType } : {}),
    },
    orderBy: [{ transportType: 'asc' }, { minStops: 'asc' }],
  });
}

async function calculateMetroJourney(
  originStationId: string,
  destinationStationId: string
): Promise<JourneyCalculationResult> {
  if (originStationId === destinationStationId) {
    throw new AppError('Origin and destination stations must be different', 400);
  }

  const lines = await prisma.metroLine.findMany({
    orderBy: { number: 'asc' },
    include: {
      lineStations: {
        orderBy: { order: 'asc' },
        include: {
          station: {
            select: {
              id: true,
              nameEn: true,
              lat: true,
              lng: true,
            },
          },
        },
      },
    },
  });

  const adjacency = new Map<string, GraphEdge[]>();
  const stationMetaMap = new Map<string, StationMeta>();

  const addUndirectedEdge = (a: string, b: string, lineBadge: JourneyLineBadge) => {
    if (!adjacency.has(a)) adjacency.set(a, []);
    if (!adjacency.has(b)) adjacency.set(b, []);
    adjacency.get(a)!.push({ toStationId: b, line: lineBadge });
    adjacency.get(b)!.push({ toStationId: a, line: lineBadge });
  };

  for (const line of lines) {
    const lineBadge: JourneyLineBadge = {
      id: line.id,
      number: line.number,
      nameEn: line.nameEn,
      color: line.color,
    };

    for (const ls of line.lineStations) {
      stationMetaMap.set(ls.station.id, ls.station);
      if (!adjacency.has(ls.station.id)) {
        adjacency.set(ls.station.id, []);
      }
    }

    // Separate main trunk (branch == null) from named diverging branches
    const trunk = line.lineStations.filter((ls) => !ls.branch);
    for (let i = 0; i < trunk.length - 1; i++) {
      addUndirectedEdge(trunk[i].stationId, trunk[i + 1].stationId, lineBadge);
    }

    const branchNames = Array.from(
      new Set(
        line.lineStations
          .map((ls) => ls.branch)
          .filter((b): b is string => Boolean(b))
      )
    );

    const hubStation = trunk.length > 0 ? trunk[trunk.length - 1] : null;

    for (const branchName of branchNames) {
      const branchStations = line.lineStations.filter(
        (ls) => ls.branch === branchName
      );
      if (branchStations.length === 0) continue;

      // Connect the first station of each branch directly to the trunk's branching hub (e.g., Kit Kat)
      if (hubStation) {
        addUndirectedEdge(hubStation.stationId, branchStations[0].stationId, lineBadge);
      }

      for (let i = 0; i < branchStations.length - 1; i++) {
        addUndirectedEdge(
          branchStations[i].stationId,
          branchStations[i + 1].stationId,
          lineBadge
        );
      }
    }
  }

  const originMeta = stationMetaMap.get(originStationId);
  const destMeta = stationMetaMap.get(destinationStationId);

  if (!originMeta || !destMeta) {
    throw new AppError('Origin or destination station not found', 404);
  }

  // State-space Dijkstra minimizing (station hops + transfer penalty).
  // Transfer penalty = 8 stops so staying on the same line (direct route)
  // is strongly preferred over unnecessary line transfers (e.g. Abbassiya -> Cairo University
  // stays directly on Line 3 instead of transferring twice via Nasser & Sadat).
  const TRANSFER_PENALTY = 8;

  interface DijkstraState {
    key: string;
    stationId: string;
    line: JourneyLineBadge | null;
    cost: number;
    hops: number;
    transfers: number;
  }

  const startKey = `${originStationId}|START`;
  const dist = new Map<string, number>([[startKey, 0]]);
  const prev = new Map<
    string,
    { prevKey: string; prevStationId: string; line: JourneyLineBadge }
  >();
  const heap: DijkstraState[] = [
    {
      key: startKey,
      stationId: originStationId,
      line: null,
      cost: 0,
      hops: 0,
      transfers: 0,
    },
  ];

  let bestEndKey: string | null = null;

  while (heap.length > 0) {
    // Extract minimum-cost state (graph has ~90 stations, so linear min-extract is < 0.2ms)
    let bestIdx = 0;
    for (let i = 1; i < heap.length; i++) {
      const a = heap[i];
      const b = heap[bestIdx];
      if (
        a.cost < b.cost ||
        (a.cost === b.cost && a.transfers < b.transfers) ||
        (a.cost === b.cost && a.transfers === b.transfers && a.hops < b.hops)
      ) {
        bestIdx = i;
      }
    }
    const current = heap.splice(bestIdx, 1)[0];

    if (current.cost > (dist.get(current.key) ?? Infinity)) {
      continue;
    }

    if (current.stationId === destinationStationId) {
      bestEndKey = current.key;
      break;
    }

    const edges = adjacency.get(current.stationId) ?? [];
    for (const edge of edges) {
      const isTransfer =
        current.line !== null && current.line.id !== edge.line.id;
      const nextCost = current.cost + 1 + (isTransfer ? TRANSFER_PENALTY : 0);
      const nextKey = `${edge.toStationId}|${edge.line.id}`;

      if (nextCost < (dist.get(nextKey) ?? Infinity)) {
        dist.set(nextKey, nextCost);
        prev.set(nextKey, {
          prevKey: current.key,
          prevStationId: current.stationId,
          line: edge.line,
        });
        heap.push({
          key: nextKey,
          stationId: edge.toStationId,
          line: edge.line,
          cost: nextCost,
          hops: current.hops + 1,
          transfers: current.transfers + (isTransfer ? 1 : 0),
        });
      }
    }
  }

  if (!bestEndKey) {
    throw new AppError('No valid metro route found between selected stations', 404);
  }

  // Reconstruct ordered path and edge lines
  const stationIds: string[] = [];
  const edgeLines: JourneyLineBadge[] = [];
  let cursorKey = bestEndKey;
  while (cursorKey !== startKey) {
    const step = prev.get(cursorKey)!;
    const [stationId] = cursorKey.split('|');
    stationIds.push(stationId);
    edgeLines.push(step.line);
    cursorKey = step.prevKey;
  }
  stationIds.push(originStationId);
  stationIds.reverse();
  edgeLines.reverse();

  // Detect transfer stations where the active line changes
  const transfers: JourneyTransfer[] = [];
  for (let i = 1; i < edgeLines.length; i++) {
    if (edgeLines[i].id !== edgeLines[i - 1].id) {
      const transferMeta = stationMetaMap.get(stationIds[i])!;
      transfers.push({
        stationId: transferMeta.id,
        stationName: transferMeta.nameEn,
        fromLine: edgeLines[i - 1],
        toLine: edgeLines[i],
      });
    }
  }

  const path: JourneyStopNode[] = stationIds.map((id, idx) => {
    const meta = stationMetaMap.get(id)!;
    const activeLine = idx === 0 ? edgeLines[0] : edgeLines[idx - 1];
    return {
      id: meta.id,
      nameEn: meta.nameEn,
      lat: meta.lat,
      lng: meta.lng,
      order: idx + 1,
      line: activeLine,
    };
  });

  const stopCount = path.length;
  const fare = await resolveFareRule('METRO', stopCount);
  const estimatedMinutes = Math.max(
    3,
    Math.round((stopCount - 1) * 2.5 + transfers.length * 4)
  );

  return {
    transportType: 'METRO',
    origin: { id: originMeta.id, nameEn: originMeta.nameEn },
    destination: { id: destMeta.id, nameEn: destMeta.nameEn },
    stopCount,
    estimatedMinutes,
    fare,
    transfers,
    path,
  };
}

async function calculateBusJourney(
  busRouteId: string,
  originStopId: string,
  destinationStopId: string
): Promise<JourneyCalculationResult> {
  if (originStopId === destinationStopId) {
    throw new AppError('Origin and destination bus stops must be different', 400);
  }

  const route = await prisma.busRoute.findUnique({
    where: { id: busRouteId },
    include: {
      routeStops: {
        orderBy: { order: 'asc' },
        include: {
          stop: {
            select: {
              id: true,
              nameEn: true,
              lat: true,
              lng: true,
            },
          },
        },
      },
    },
  });

  if (!route) {
    throw new AppError('Bus route not found', 404);
  }

  const originIdx = route.routeStops.findIndex((rs) => rs.stopId === originStopId);
  const destIdx = route.routeStops.findIndex((rs) => rs.stopId === destinationStopId);

  if (originIdx === -1 || destIdx === -1) {
    throw new AppError(
      'Origin or destination stop does not belong to the selected bus route',
      400
    );
  }

  const slice =
    originIdx <= destIdx
      ? route.routeStops.slice(originIdx, destIdx + 1)
      : route.routeStops.slice(destIdx, originIdx + 1).reverse();

  const path: JourneyStopNode[] = slice.map((rs, idx) => ({
    id: rs.stop.id,
    nameEn: rs.stop.nameEn,
    lat: rs.stop.lat,
    lng: rs.stop.lng,
    order: idx + 1,
  }));

  const stopCount = path.length;

  // Compute road-adjusted route distance in km using Haversine between consecutive bus stops
  let rawKm = 0;
  for (let i = 0; i < path.length - 1; i++) {
    rawKm += haversineKm(path[i].lat, path[i].lng, path[i + 1].lat, path[i + 1].lng);
  }
  const distanceKm = Math.round(rawKm * BUS_ROAD_WINDING_FACTOR * 10) / 10;

  // Bus uses distance-based pricing: Base Fare (from FareRule) + 1.5 EGP/km (min 10 EGP)
  const baseRule = await resolveFareRule('BUS', stopCount);
  const computedAmount = Math.max(
    BUS_MIN_FARE,
    Math.round(baseRule.amount + distanceKm * BUS_RATE_PER_KM)
  );

  const fare: JourneyFareInfo = {
    ...baseRule,
    amount: computedAmount,
    pricingModel: 'DISTANCE_BASED',
    baseFare: baseRule.amount,
    ratePerKm: BUS_RATE_PER_KM,
  };

  // Bus ETA: travel time at ~20 km/h urban speed + 1.5 min dwell per stop
  const estimatedMinutes = Math.max(
    5,
    Math.round((distanceKm / BUS_AVG_SPEED_KMH) * 60 + (stopCount - 1) * 1.5)
  );

  return {
    transportType: 'BUS',
    origin: { id: path[0].id, nameEn: path[0].nameEn },
    destination: {
      id: path[path.length - 1].id,
      nameEn: path[path.length - 1].nameEn,
    },
    busRoute: {
      id: route.id,
      code: route.code,
      nameEn: route.nameEn,
    },
    stopCount,
    distanceKm,
    estimatedMinutes,
    fare,
    transfers: [],
    path,
  };
}

export async function calculateJourney(
  input: CalculateJourneyInput
): Promise<JourneyCalculationResult> {
  if (input.transportType === 'METRO') {
    return calculateMetroJourney(
      input.originStationId,
      input.destinationStationId
    );
  }
  return calculateBusJourney(
    input.busRouteId,
    input.originStopId,
    input.destinationStopId
  );
}
