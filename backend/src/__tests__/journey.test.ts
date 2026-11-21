// ---------------------------------------------------------------
// Smart Transportation — Journey & Fare Calculation Tests
// ---------------------------------------------------------------

import { describe, it, expect, beforeEach, vi } from 'vitest';
import supertest from 'supertest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://user:pass@localhost/test?pgbouncer=true&sslmode=require';
process.env.DIRECT_URL = 'postgresql://user:pass@localhost/test?sslmode=require';
process.env.JWT_SECRET = 'test-secret-key-for-testing-at-least-32-chars';
process.env.FRONTEND_URL = 'http://localhost:8081';

import { prisma } from '../config/prisma';
import { signToken } from '../utils/jwt';
import { app } from '../app';
import { Role } from '@prisma/client';

const mockUser = {
  id: 'user-uuid-1',
  fullName: 'Transit Passenger',
  email: 'passenger@example.com',
  passwordHash: 'hashed-secret',
  role: 'PASSENGER' as Role,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const authHeader = `Bearer ${signToken(mockUser.id)}`;

const L2_ID = '22222222-2222-2222-2222-222222222222';
const L3_ID = '33333333-3333-3333-3333-333333333333';

const ST_ATTABA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const ST_KITKAT = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const ST_SUDAN = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const ST_ROD_CORR = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const ST_TAWFIKIA = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
const ST_CAIRO_UNI = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
const ST_DOKKI = '11111111-2222-3333-4444-555555555555';

const BUS_ROUTE_ID = '66666666-6666-6666-6666-666666666666';
const STOP_A = '77777777-7777-7777-7777-777777777771';
const STOP_B = '77777777-7777-7777-7777-777777777772';
const STOP_C = '77777777-7777-7777-7777-777777777773';

const mockMetroGraph = [
  {
    id: L2_ID,
    number: 2,
    nameEn: 'Line 2',
    color: '#D32F2F',
    lineStations: [
      {
        stationId: ST_ATTABA,
        order: 1,
        branch: null,
        station: { id: ST_ATTABA, nameEn: 'Attaba', lat: 30.0525, lng: 31.2471 },
      },
      {
        stationId: ST_DOKKI,
        order: 2,
        branch: null,
        station: { id: ST_DOKKI, nameEn: 'Dokki', lat: 30.0384, lng: 31.2119 },
      },
      {
        stationId: ST_CAIRO_UNI,
        order: 3,
        branch: null,
        station: { id: ST_CAIRO_UNI, nameEn: 'Cairo University', lat: 30.0263, lng: 31.2008 },
      },
    ],
  },
  {
    id: L3_ID,
    number: 3,
    nameEn: 'Line 3',
    color: '#2E7D32',
    lineStations: [
      {
        stationId: ST_ATTABA,
        order: 1,
        branch: null,
        station: { id: ST_ATTABA, nameEn: 'Attaba', lat: 30.0525, lng: 31.2471 },
      },
      {
        stationId: ST_KITKAT,
        order: 2,
        branch: null,
        station: { id: ST_KITKAT, nameEn: 'Kit Kat', lat: 30.0635, lng: 31.2132 },
      },
      {
        stationId: ST_SUDAN,
        order: 3,
        branch: 'Rod El-Farag Corridor Branch',
        station: { id: ST_SUDAN, nameEn: 'Sudan', lat: 30.0691, lng: 31.2062 },
      },
      {
        stationId: ST_ROD_CORR,
        order: 4,
        branch: 'Rod El-Farag Corridor Branch',
        station: { id: ST_ROD_CORR, nameEn: 'Rod El-Farag Corridor', lat: 30.1015, lng: 31.1846 },
      },
      {
        stationId: ST_TAWFIKIA,
        order: 5,
        branch: 'Cairo University Branch',
        station: { id: ST_TAWFIKIA, nameEn: 'Tawfikia', lat: 30.0652, lng: 31.2025 },
      },
      {
        stationId: ST_CAIRO_UNI,
        order: 6,
        branch: 'Cairo University Branch',
        station: { id: ST_CAIRO_UNI, nameEn: 'Cairo University', lat: 30.0263, lng: 31.2008 },
      },
    ],
  },
];

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
});

describe('POST /api/journeys/calculate', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await supertest(app).post('/api/journeys/calculate').send({
      transportType: 'METRO',
      originStationId: ST_ATTABA,
      destinationStationId: ST_KITKAT,
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 when origin and destination metro stations are identical', async () => {
    const res = await supertest(app)
      .post('/api/journeys/calculate')
      .set('Authorization', authHeader)
      .send({
        transportType: 'METRO',
        originStationId: ST_KITKAT,
        destinationStationId: ST_KITKAT,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/different/i);
  });

  it('routes between Line 3 Kit Kat branches via Kit Kat (not Rod El-Farag Corridor -> Tawfikia)', async () => {
    vi.spyOn(prisma.metroLine, 'findMany').mockResolvedValue(mockMetroGraph as any);
    vi.spyOn(prisma.fareRule, 'findFirst').mockResolvedValue({
      id: 'fare-1',
      transportType: 'METRO',
      minStops: 1,
      maxStops: 9,
      price: 10,
      currency: 'EGP',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await supertest(app)
      .post('/api/journeys/calculate')
      .set('Authorization', authHeader)
      .send({
        transportType: 'METRO',
        originStationId: ST_SUDAN,
        destinationStationId: ST_TAWFIKIA,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.stopCount).toBe(3);
    expect(res.body.data.path.map((s: any) => s.nameEn)).toEqual([
      'Sudan',
      'Kit Kat',
      'Tawfikia',
    ]);
    expect(res.body.data.fare.amount).toBe(10);
    expect(res.body.data.fare.pricingModel).toBe('STATION_TIERS');
    expect(res.body.data.transfers).toHaveLength(0);
  });

  it('detects interchanges across metro lines', async () => {
    vi.spyOn(prisma.metroLine, 'findMany').mockResolvedValue(mockMetroGraph as any);
    vi.spyOn(prisma.fareRule, 'findFirst').mockResolvedValue({
      id: 'fare-1',
      transportType: 'METRO',
      minStops: 1,
      maxStops: 9,
      price: 10,
      currency: 'EGP',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await supertest(app)
      .post('/api/journeys/calculate')
      .set('Authorization', authHeader)
      .send({
        transportType: 'METRO',
        originStationId: ST_KITKAT,
        destinationStationId: ST_DOKKI,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.transfers.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.fare.amount).toBe(10);
  });

  it('calculates bus journey distance-based fare in reverse direction along a bus route', async () => {
    vi.spyOn(prisma.busRoute, 'findUnique').mockResolvedValue({
      id: BUS_ROUTE_ID,
      code: 'BUS-101',
      nameEn: 'Tahrir - New Cairo',
      routeStops: [
        { stopId: STOP_A, order: 1, stop: { id: STOP_A, nameEn: 'Stop A', lat: 30.0, lng: 31.2 } },
        { stopId: STOP_B, order: 2, stop: { id: STOP_B, nameEn: 'Stop B', lat: 30.02, lng: 31.22 } },
        { stopId: STOP_C, order: 3, stop: { id: STOP_C, nameEn: 'Stop C', lat: 30.05, lng: 31.25 } },
      ],
    } as any);
    vi.spyOn(prisma.fareRule, 'findFirst').mockResolvedValue({
      id: 'fare-bus-1',
      transportType: 'BUS',
      minStops: 1,
      maxStops: 100,
      price: 8,
      currency: 'EGP',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await supertest(app)
      .post('/api/journeys/calculate')
      .set('Authorization', authHeader)
      .send({
        transportType: 'BUS',
        busRouteId: BUS_ROUTE_ID,
        originStopId: STOP_C,
        destinationStopId: STOP_A,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.stopCount).toBe(3);
    expect(res.body.data.distanceKm).toBeGreaterThan(0);
    expect(res.body.data.fare.pricingModel).toBe('DISTANCE_BASED');
    expect(res.body.data.fare.amount).toBeGreaterThanOrEqual(10);
    expect(res.body.data.path.map((s: any) => s.nameEn)).toEqual([
      'Stop C',
      'Stop B',
      'Stop A',
    ]);
  });
});

describe('GET /api/journeys/fare-rules', () => {
  it('returns active fare rules', async () => {
    vi.spyOn(prisma.fareRule, 'findMany').mockResolvedValue([
      {
        id: 'fare-1',
        transportType: 'METRO',
        minStops: 1,
        maxStops: 9,
        price: 8,
        currency: 'EGP',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const res = await supertest(app)
      .get('/api/journeys/fare-rules?transportType=METRO')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].price).toBe(8);
  });
});
