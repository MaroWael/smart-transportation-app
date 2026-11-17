// ---------------------------------------------------------------
// Smart Transportation — Auth API tests
// ---------------------------------------------------------------
// Prisma methods are spied/mocked — no real database queries run.
// ---------------------------------------------------------------

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hash } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import express from 'express';
import supertest from 'supertest';

// Set required env vars before importing modules (env.ts validates on load).
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://user:pass@localhost/test?pgbouncer=true&sslmode=require';
process.env.DIRECT_URL = 'postgresql://user:pass@localhost/test?sslmode=require';
process.env.JWT_SECRET = 'test-secret-key-for-testing-at-least-32-chars';
process.env.FRONTEND_URL = 'http://localhost:8081';

import { prisma } from '../config/prisma';
import { Role } from '@prisma/client';
import { signToken } from '../utils/jwt';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import { errorHandler, notFoundHandler } from '../middlewares/error.middleware';
import authRouter from '../routes/auth.route';

// Build a test Express app with the auth routes mounted under /api/auth
function buildApp() {
  const testApp = express();
  testApp.use(express.json());
  testApp.use('/api/auth', authRouter);
  testApp.use(notFoundHandler);
  testApp.use(errorHandler);
  return testApp;
}

const app = buildApp();

const baseUser = {
  id: 'user-1',
  fullName: 'John Doe',
  email: 'john@example.com',
  passwordHash: 'hashed-password',
  role: 'PASSENGER' as Role,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
  vi.spyOn(prisma.user, 'create').mockResolvedValue(baseUser);
  vi.spyOn(prisma.user, 'update').mockResolvedValue(baseUser);
});

const validRegisterBody = {
  fullName: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
};

// ---------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------
describe('POST /api/auth/register', () => {
  it('registers a new passenger and returns { user, token }', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
    vi.spyOn(prisma.user, 'create').mockResolvedValue(baseUser);

    const res = await supertest(app)
      .post('/api/auth/register')
      .send(validRegisterBody);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.user.email).toBe('john@example.com');
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('PASSENGER');
  });

  it('returns 409 for duplicate email', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(baseUser);

    const res = await supertest(app)
      .post('/api/auth/register')
      .send(validRegisterBody);

    expect(res.status).toBe(409);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Email already registered');
  });

  it('returns 400 for invalid input', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

    const res = await supertest(app)
      .post('/api/auth/register')
      .send({ fullName: 'A', email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.errors).toBeDefined();
  });

  it('cannot create ADMIN even if role is sent in the body', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
    vi.spyOn(prisma.user, 'create').mockImplementation((((args: any) =>
      Promise.resolve({
        id: 'user-1',
        ...args.data,
        role: 'PASSENGER',
      })) as any));

    const res = await supertest(app)
      .post('/api/auth/register')
      .send({ ...validRegisterBody, role: 'ADMIN' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('PASSENGER');
  });
});

// ---------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------
describe('POST /api/auth/login', () => {
  it('returns 200 and { user, token } for valid credentials', async () => {
    const passwordHash = await hash('password123', 10);
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      ...baseUser,
      passwordHash,
      isActive: true,
    });

    const res = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('returns 401 for wrong password', async () => {
    const passwordHash = await hash('password123', 10);
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      ...baseUser,
      passwordHash,
    });

    const res = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('returns 401 for unknown email (generic message)', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

    const res = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'noone@example.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('returns 403 for inactive account', async () => {
    const passwordHash = await hash('password123', 10);
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      ...baseUser,
      passwordHash,
      isActive: false,
    });

    const res = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com', password: 'password123' });

    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------
// GET /api/auth/me (protected)
// ---------------------------------------------------------------
describe('GET /api/auth/me', () => {
  it('returns 401 without a token', async () => {
    const res = await supertest(app).get('/api/auth/me');

    expect(res.status).toBe(401);
  });

  it('returns the safe user with a valid token', async () => {
    const token = signToken('user-1');
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(baseUser);

    const res = await supertest(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.data.user.id).toBe('user-1');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('returns 401 for an invalid token', async () => {
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(baseUser);

    const res = await supertest(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
  });

  it('returns 401 for an expired token', async () => {
    const expiredToken = sign(
      { sub: 'user-1', exp: Math.floor(Date.now() / 1000) - 100 },
      process.env.JWT_SECRET!
    );
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(baseUser);

    const res = await supertest(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
  });

  it('returns 403 for inactive account', async () => {
    const token = signToken('user-1');
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ ...baseUser, isActive: false });

    const res = await supertest(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------
// PATCH /api/auth/me (protected)
// ---------------------------------------------------------------
describe('PATCH /api/auth/me', () => {
  it('updates fullName only', async () => {
    const token = signToken('user-1');
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ ...baseUser, isActive: true });
    vi.spyOn(prisma.user, 'update').mockResolvedValue({ ...baseUser, fullName: 'Jane Doe' });

    const res = await supertest(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ fullName: 'Jane Doe' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.fullName).toBe('Jane Doe');
  });

  it('rejects unknown keys like role with 400', async () => {
    const token = signToken('user-1');
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ ...baseUser, isActive: true });

    const res = await supertest(app)
      .patch('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'ADMIN' });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });
});

// ---------------------------------------------------------------
// authorizeRoles — passenger blocked from admin-only route
// ---------------------------------------------------------------
describe('authorizeRoles (test-only route)', () => {
  it('blocks a passenger from an admin-only route', async () => {
    const testApp = express();
    testApp.use(express.json());

    testApp.get(
      '/test-admin',
      authenticate as any,
      authorizeRoles('ADMIN') as any,
      (_req: any, res: any) => {
        res.json({ status: 'ok' });
      }
    );

    const token = signToken('user-1');
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(baseUser); // passenger

    const res = await supertest(testApp)
      .get('/test-admin')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
