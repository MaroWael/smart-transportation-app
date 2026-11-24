// ---------------------------------------------------------------
// Smart Transportation — Staff QR Ticket Validation Tests (O8)
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
import { createSignedQrPayload } from '../utils/qr';
import { app } from '../app';
import { Role } from '@prisma/client';

const PASSENGER_ID = '11111111-1111-1111-1111-111111111111';
const STAFF_ID = '22222222-2222-2222-2222-222222222222';
const BOOKING_ID = '33333333-3333-3333-3333-333333333333';
const TICKET_ID = '44444444-4444-4444-4444-444444444444';

const mockPassenger = {
  id: PASSENGER_ID,
  fullName: 'Passenger One',
  email: 'p1@example.com',
  passwordHash: 'hashed',
  role: 'PASSENGER' as Role,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockStaff = {
  id: STAFF_ID,
  fullName: 'Station Staff',
  email: 'staff@smarttransit.eg',
  passwordHash: 'hashed',
  role: 'STATION_EMPLOYEE' as Role,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const passengerAuth = `Bearer ${signToken(PASSENGER_ID)}`;
const staffAuth = `Bearer ${signToken(STAFF_ID)}`;

function buildTicketRecord(overrides: Record<string, any> = {}) {
  const ticketCode = 'ST-ABCD1234';
  const qrPayload = createSignedQrPayload(ticketCode, BOOKING_ID);
  return {
    id: TICKET_ID,
    bookingId: BOOKING_ID,
    ticketCode,
    qrPayload,
    status: 'ACTIVE',
    issuedAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    usedAt: null,
    booking: {
      id: BOOKING_ID,
      transportType: 'METRO',
      status: 'CONFIRMED',
      stopCount: 5,
      totalAmount: 10,
      currency: 'EGP',
      user: { id: PASSENGER_ID, fullName: 'Passenger One', email: 'p1@example.com' },
      originStation: { id: 's1', nameEn: 'Sadat' },
      destinationStation: { id: 's2', nameEn: 'Maadi' },
      busRoute: null,
      originStop: null,
      destinationStop: null,
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('Staff QR Ticket Validation (/api/tickets)', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await supertest(app)
      .post('/api/tickets/validate')
      .send({ ticketCode: 'ST-ABCD1234' });
    expect(res.status).toBe(401);
  });

  it('returns 403 when a PASSENGER attempts to validate a ticket', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockPassenger);

    const res = await supertest(app)
      .post('/api/tickets/validate')
      .set('Authorization', passengerAuth)
      .send({ ticketCode: 'ST-ABCD1234' });

    expect(res.status).toBe(403);
  });

  it('validates an ACTIVE signed QR ticket, marks it USED, and logs VALID', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockStaff);
    const ticket = buildTicketRecord();

    vi.spyOn(prisma.ticket, 'findUnique').mockResolvedValue(ticket as any);
    const updateSpy = vi.spyOn(prisma.ticket, 'update').mockResolvedValue({
      ...ticket,
      status: 'USED',
      usedAt: new Date(),
    } as any);
    const logSpy = vi
      .spyOn(prisma.ticketValidation, 'create')
      .mockResolvedValue({
        id: 'val-1',
        ticketId: TICKET_ID,
        employeeId: STAFF_ID,
        scannedCode: ticket.qrPayload,
        result: 'VALID',
        stationName: 'Sadat',
        notes: 'Entry granted',
        validatedAt: new Date(),
      } as any);

    const res = await supertest(app)
      .post('/api/tickets/validate')
      .set('Authorization', staffAuth)
      .send({ qrPayload: ticket.qrPayload, stationName: 'Sadat' });

    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.result).toBe('VALID');
    expect(res.body.data.ticket.status).toBe('USED');
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          result: 'VALID',
          employeeId: STAFF_ID,
          ticketId: TICKET_ID,
        }),
      })
    );
  });

  it('rejects a ticket that is ALREADY_USED and logs ALREADY_USED', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockStaff);
    const usedTicket = buildTicketRecord({ status: 'USED', usedAt: new Date() });

    vi.spyOn(prisma.ticket, 'findUnique').mockResolvedValue(usedTicket as any);
    const logSpy = vi
      .spyOn(prisma.ticketValidation, 'create')
      .mockResolvedValue({
        id: 'val-2',
        ticketId: TICKET_ID,
        employeeId: STAFF_ID,
        scannedCode: usedTicket.ticketCode,
        result: 'ALREADY_USED',
        stationName: null,
        notes: 'Ticket already used',
        validatedAt: new Date(),
      } as any);

    const res = await supertest(app)
      .post('/api/tickets/validate')
      .set('Authorization', staffAuth)
      .send({ ticketCode: usedTicket.ticketCode });

    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(false);
    expect(res.body.data.result).toBe('ALREADY_USED');
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it('rejects a forged QR signature as INVALID without querying DB ticket', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockStaff);
    const findSpy = vi.spyOn(prisma.ticket, 'findUnique');
    vi.spyOn(prisma.ticketValidation, 'create').mockResolvedValue({
      id: 'val-3',
      ticketId: null,
      employeeId: STAFF_ID,
      scannedCode: 'ST1.ST-FAKE0000.12345678.deadbeef00000000',
      result: 'INVALID',
      stationName: null,
      notes: 'Invalid or tampered QR signature',
      validatedAt: new Date(),
    } as any);

    const res = await supertest(app)
      .post('/api/tickets/validate')
      .set('Authorization', staffAuth)
      .send({ qrPayload: 'ST1.ST-FAKE0000.12345678.deadbeef00000000' });

    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(false);
    expect(res.body.data.result).toBe('INVALID');
    expect(findSpy).not.toHaveBeenCalled();
  });

  it('rejects an EXPIRED ticket and logs EXPIRED', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockStaff);
    const expiredTicket = buildTicketRecord({
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() - 60 * 1000),
    });

    vi.spyOn(prisma.ticket, 'findUnique').mockResolvedValue(expiredTicket as any);
    vi.spyOn(prisma.ticket, 'update').mockResolvedValue({
      ...expiredTicket,
      status: 'EXPIRED',
    } as any);
    vi.spyOn(prisma.ticketValidation, 'create').mockResolvedValue({
      id: 'val-4',
      ticketId: TICKET_ID,
      employeeId: STAFF_ID,
      scannedCode: expiredTicket.ticketCode,
      result: 'EXPIRED',
      stationName: null,
      notes: 'Ticket expired',
      validatedAt: new Date(),
    } as any);

    const res = await supertest(app)
      .post('/api/tickets/validate')
      .set('Authorization', staffAuth)
      .send({ ticketCode: expiredTicket.ticketCode });

    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(false);
    expect(res.body.data.result).toBe('EXPIRED');
  });

  it('lists recent validations for the authenticated station employee', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockStaff);
    const findManySpy = vi
      .spyOn(prisma.ticketValidation, 'findMany')
      .mockResolvedValue([]);

    const res = await supertest(app)
      .get('/api/tickets/validations')
      .set('Authorization', staffAuth);

    expect(res.status).toBe(200);
    expect(findManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { employeeId: STAFF_ID },
      })
    );
  });
});
