// ---------------------------------------------------------------
// Smart Transportation — Transport API tests
// ---------------------------------------------------------------
// Vitest + Supertest testing of Metro, Station, and Bus endpoints.
// Prisma client is mocked — no real database queries are run.
// ---------------------------------------------------------------

import { describe, it, expect, beforeEach, vi } from 'vitest';
import supertest from 'supertest';

// Set required env vars before imports
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

const validToken = signToken(mockUser.id);
const authHeader = `Bearer ${validToken}`;

const mockLine1Id = '11111111-1111-1111-1111-111111111111';
const mockLine2Id = '22222222-2222-2222-2222-222222222222';
const mockStationSadatId = '44444444-4444-4444-4444-444444444444';
const mockStationHelwanId = '55555555-5555-5555-5555-555555555555';
const mockBusRouteId = '66666666-6666-6666-6666-666666666666';
const mockBusStopId = '77777777-7777-7777-7777-777777777777';

beforeEach(() => {
  vi.restoreAllMocks();
  // Default: authenticate middleware resolves user
  vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
});

// ===============================================================
// GET /api/metro/lines
// ===============================================================
describe('GET /api/metro/lines', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await supertest(app).get('/api/metro/lines');
    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 200 with list of lines and station counts', async () => {
    const mockLines = [
      {
        id: mockLine1Id,
        number: 1,
        nameEn: 'Line 1 (Helwan - New El-Marg)',
        color: '#D32F2F',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { lineStations: 35 },
      },
      {
        id: mockLine2Id,
        number: 2,
        nameEn: 'Line 2 (Shubra El-Kheima - El-Mounib)',
        color: '#2E7D32',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { lineStations: 20 },
      },
    ];

    vi.spyOn(prisma.metroLine, 'findMany').mockResolvedValue(mockLines as any);

    const res = await supertest(app)
      .get('/api/metro/lines')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].number).toBe(1);
    expect(res.body.data[0].stationCount).toBe(35);
    expect(res.body.data[1].number).toBe(2);
    expect(res.body.data[1].stationCount).toBe(20);
  });
});

// ===============================================================
// GET /api/metro/lines/:id
// ===============================================================
describe('GET /api/metro/lines/:id', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await supertest(app).get(`/api/metro/lines/${mockLine1Id}`);
    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 400 when line id is not a valid uuid', async () => {
    const res = await supertest(app)
      .get('/api/metro/lines/invalid-uuid')
      .set('Authorization', authHeader);

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.errors).toBeDefined();
  });

  it('returns 404 when line id is unknown', async () => {
    vi.spyOn(prisma.metroLine, 'findUnique').mockResolvedValue(null);

    const res = await supertest(app)
      .get(`/api/metro/lines/${mockLine1Id}`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Metro line not found');
  });

  it('returns 200 with line detail, ordered stations, and interchange flags', async () => {
    const mockLineDetail = {
      id: mockLine1Id,
      number: 1,
      nameEn: 'Line 1 (Helwan - New El-Marg)',
      color: '#D32F2F',
      createdAt: new Date(),
      updatedAt: new Date(),
      lineStations: [
        {
          order: 1,
          station: {
            id: mockStationHelwanId,
            nameEn: 'Helwan',
            lat: 29.849,
            lng: 31.334,
            lineStations: [
              {
                line: { id: mockLine1Id, number: 1, color: '#D32F2F' },
              },
            ],
          },
        },
        {
          order: 19,
          station: {
            id: mockStationSadatId,
            nameEn: 'Sadat',
            lat: 30.0444,
            lng: 31.2357,
            lineStations: [
              {
                line: { id: mockLine1Id, number: 1, color: '#D32F2F' },
              },
              {
                line: { id: mockLine2Id, number: 2, color: '#2E7D32' },
              },
            ],
          },
        },
      ],
    };

    vi.spyOn(prisma.metroLine, 'findUnique').mockResolvedValue(mockLineDetail as any);

    const res = await supertest(app)
      .get(`/api/metro/lines/${mockLine1Id}`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.id).toBe(mockLine1Id);
    expect(res.body.data.stations).toHaveLength(2);
    expect(res.body.data.stations[0].nameEn).toBe('Helwan');
    expect(res.body.data.stations[0].order).toBe(1);
    expect(res.body.data.stations[0].isInterchange).toBe(false);
    expect(res.body.data.stations[0].lines).toHaveLength(1);

    expect(res.body.data.stations[1].nameEn).toBe('Sadat');
    expect(res.body.data.stations[1].order).toBe(19);
    expect(res.body.data.stations[1].isInterchange).toBe(true);
    expect(res.body.data.stations[1].lines).toHaveLength(2);
    expect(res.body.data.stations[1].lines[0].number).toBe(1);
    expect(res.body.data.stations[1].lines[1].number).toBe(2);
  });
});

// ===============================================================
// GET /api/stations
// ===============================================================
describe('GET /api/stations', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await supertest(app).get('/api/stations');
    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 400 when lineId query is not a valid uuid', async () => {
    const res = await supertest(app)
      .get('/api/stations?lineId=invalid-uuid')
      .set('Authorization', authHeader);

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.errors).toBeDefined();
  });

  it('returns 200 with all stations and line summaries', async () => {
    const mockStations = [
      {
        id: mockStationHelwanId,
        nameEn: 'Helwan',
        lat: 29.849,
        lng: 31.334,
        createdAt: new Date(),
        updatedAt: new Date(),
        lineStations: [
          {
            line: { id: mockLine1Id, number: 1, color: '#D32F2F' },
          },
        ],
      },
      {
        id: mockStationSadatId,
        nameEn: 'Sadat',
        lat: 30.0444,
        lng: 31.2357,
        createdAt: new Date(),
        updatedAt: new Date(),
        lineStations: [
          {
            line: { id: mockLine1Id, number: 1, color: '#D32F2F' },
          },
          {
            line: { id: mockLine2Id, number: 2, color: '#2E7D32' },
          },
        ],
      },
    ];

    vi.spyOn(prisma.station, 'findMany').mockResolvedValue(mockStations as any);

    const res = await supertest(app)
      .get('/api/stations')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[1].nameEn).toBe('Sadat');
    expect(res.body.data[1].isInterchange).toBe(true);
    expect(res.body.data[1].lines).toHaveLength(2);
  });

  it('supports filtering by ?q= and ?lineId=', async () => {
    const findManySpy = vi.spyOn(prisma.station, 'findMany').mockResolvedValue([]);

    const res = await supertest(app)
      .get(`/api/stations?q=sadat&lineId=${mockLine1Id}`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(findManySpy).toHaveBeenCalledWith({
      where: {
        nameEn: {
          contains: 'sadat',
          mode: 'insensitive',
        },
        lineStations: {
          some: {
            lineId: mockLine1Id,
          },
        },
      },
      orderBy: { nameEn: 'asc' },
      include: expect.any(Object),
    });
  });
});

// ===============================================================
// GET /api/bus/routes
// ===============================================================
describe('GET /api/bus/routes', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await supertest(app).get('/api/bus/routes');
    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 200 with list of bus routes and stop counts', async () => {
    const mockRoutes = [
      {
        id: mockBusRouteId,
        code: 'BUS-101',
        nameEn: 'Tahrir - New Cairo',
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { routeStops: 8 },
      },
    ];

    vi.spyOn(prisma.busRoute, 'findMany').mockResolvedValue(mockRoutes as any);

    const res = await supertest(app)
      .get('/api/bus/routes')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].code).toBe('BUS-101');
    expect(res.body.data[0].stopCount).toBe(8);
  });
});

// ===============================================================
// GET /api/bus/routes/:id
// ===============================================================
describe('GET /api/bus/routes/:id', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await supertest(app).get(`/api/bus/routes/${mockBusRouteId}`);
    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('returns 400 when route id is not a valid uuid', async () => {
    const res = await supertest(app)
      .get('/api/bus/routes/not-a-uuid')
      .set('Authorization', authHeader);

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('returns 404 when bus route id is unknown', async () => {
    vi.spyOn(prisma.busRoute, 'findUnique').mockResolvedValue(null);

    const res = await supertest(app)
      .get(`/api/bus/routes/${mockBusRouteId}`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Bus route not found');
  });

  it('returns 200 with route details and ordered stops', async () => {
    const mockRouteDetail = {
      id: mockBusRouteId,
      code: 'BUS-101',
      nameEn: 'Tahrir - New Cairo',
      createdAt: new Date(),
      updatedAt: new Date(),
      routeStops: [
        {
          order: 1,
          stop: {
            id: mockBusStopId,
            nameEn: 'Tahrir Square Stop',
            lat: 30.0444,
            lng: 31.2357,
          },
        },
      ],
    };

    vi.spyOn(prisma.busRoute, 'findUnique').mockResolvedValue(mockRouteDetail as any);

    const res = await supertest(app)
      .get(`/api/bus/routes/${mockBusRouteId}`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.id).toBe(mockBusRouteId);
    expect(res.body.data.stops).toHaveLength(1);
    expect(res.body.data.stops[0].nameEn).toBe('Tahrir Square Stop');
    expect(res.body.data.stops[0].order).toBe(1);
  });
});
