// ---------------------------------------------------------------
// Smart Transportation — Booking, Stripe Test Mode & QR Tests
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
import { verifySignedQrPayload } from '../utils/qr';
import { Role } from '@prisma/client';

const USER_1_ID = '11111111-1111-1111-1111-111111111111';
const USER_2_ID = '22222222-2222-2222-2222-222222222222';
const BOOKING_ID = '33333333-3333-3333-3333-333333333333';

const mockUser1 = {
  id: USER_1_ID,
  fullName: 'Passenger One',
  email: 'p1@example.com',
  passwordHash: 'hashed',
  role: 'PASSENGER' as Role,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const authHeader = `Bearer ${signToken(USER_1_ID)}`;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser1);
});

describe('Booking, Stripe Test Payment & QR Issuance', () => {
  it('returns 401 when unauthenticated', async () => {
    const res = await supertest(app).get('/api/bookings/me');
    expect(res.status).toBe(401);
  });

  it('confirms SUCCEEDED test payment and issues a signed QR ticket', async () => {
    const pendingBooking = {
      id: BOOKING_ID,
      userId: USER_1_ID,
      transportType: 'METRO',
      originStation: { id: 's1', nameEn: 'Sadat' },
      destinationStation: { id: 's2', nameEn: 'Attaba' },
      busRoute: null,
      originStop: null,
      destinationStop: null,
      stopCount: 3,
      distanceKm: null,
      totalAmount: 10,
      currency: 'EGP',
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
      payment: {
        id: 'pay-1',
        bookingId: BOOKING_ID,
        stripePaymentIntentId: 'pi_test_123456',
        amount: 10,
        currency: 'EGP',
        status: 'PENDING',
        paidAt: null,
      },
      ticket: null,
    };

    vi.spyOn(prisma.booking, 'findUnique').mockResolvedValue(pendingBooking as any);

    const updateSpy = vi
      .spyOn(prisma.booking, 'update')
      .mockImplementation((async (args: any) => {
        const createdTicket = args.data.ticket.create;
        return {
          ...pendingBooking,
          status: 'CONFIRMED',
          payment: {
            ...pendingBooking.payment,
            status: 'SUCCEEDED',
            paidAt: new Date(),
          },
          ticket: {
            id: 'tkt-1',
            bookingId: BOOKING_ID,
            ticketCode: createdTicket.ticketCode,
            qrPayload: createdTicket.qrPayload,
            status: 'ACTIVE',
            issuedAt: new Date(),
            expiresAt: createdTicket.expiresAt,
            usedAt: null,
          },
        };
      }) as any);

    const res = await supertest(app)
      .post(`/api/bookings/${BOOKING_ID}/confirm-payment`)
      .set('Authorization', authHeader)
      .send({ outcome: 'SUCCEEDED' });

    expect(res.status).toBe(200);
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(res.body.data.status).toBe('CONFIRMED');
    expect(res.body.data.payment.status).toBe('SUCCEEDED');
    expect(res.body.data.ticket).toBeTruthy();
    expect(res.body.data.ticket.ticketCode).toMatch(/^ST-[A-F0-9]{8}$/);
    expect(verifySignedQrPayload(res.body.data.ticket.qrPayload)).toBe(true);
    expect(res.body.data.ticket.qrImageDataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('marks booking FAILED and does NOT issue a ticket when payment fails', async () => {
    const pendingBooking = {
      id: BOOKING_ID,
      userId: USER_1_ID,
      transportType: 'METRO',
      originStation: { id: 's1', nameEn: 'Sadat' },
      destinationStation: { id: 's2', nameEn: 'Attaba' },
      busRoute: null,
      originStop: null,
      destinationStop: null,
      stopCount: 3,
      distanceKm: null,
      totalAmount: 10,
      currency: 'EGP',
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
      payment: {
        id: 'pay-1',
        bookingId: BOOKING_ID,
        stripePaymentIntentId: 'pi_test_123456',
        amount: 10,
        currency: 'EGP',
        status: 'PENDING',
        paidAt: null,
      },
      ticket: null,
    };

    vi.spyOn(prisma.booking, 'findUnique').mockResolvedValue(pendingBooking as any);
    vi.spyOn(prisma.booking, 'update').mockResolvedValue({
      ...pendingBooking,
      status: 'FAILED',
      payment: { ...pendingBooking.payment, status: 'FAILED' },
      ticket: null,
    } as any);

    const res = await supertest(app)
      .post(`/api/bookings/${BOOKING_ID}/confirm-payment`)
      .set('Authorization', authHeader)
      .send({ outcome: 'FAILED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('FAILED');
    expect(res.body.data.payment.status).toBe('FAILED');
    expect(res.body.data.ticket).toBeNull();
  });

  it('prevents a passenger from viewing another passenger booking (403)', async () => {
    vi.spyOn(prisma.booking, 'findUnique').mockResolvedValue({
      id: BOOKING_ID,
      userId: USER_2_ID,
      transportType: 'METRO',
      status: 'CONFIRMED',
    } as any);

    const res = await supertest(app)
      .get(`/api/bookings/${BOOKING_ID}`)
      .set('Authorization', authHeader);

    expect(res.status).toBe(403);
  });

  it('lists only the authenticated passenger bookings', async () => {
    const findManySpy = vi.spyOn(prisma.booking, 'findMany').mockResolvedValue([]);

    const res = await supertest(app)
      .get('/api/bookings/me')
      .set('Authorization', authHeader);

    expect(res.status).toBe(200);
    expect(findManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_1_ID },
      })
    );
  });
});
