// ---------------------------------------------------------------
// Smart Transportation — Swagger docs tests
// ---------------------------------------------------------------
// Verifies the OpenAPI spec is served correctly.
// ---------------------------------------------------------------

import { describe, it, expect } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import docsRouter from '../routes/docs.route';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://user:pass@localhost/test?pgbouncer=true&sslmode=require';
process.env.DIRECT_URL = 'postgresql://user:pass@localhost/test?sslmode=require';
process.env.JWT_SECRET = 'test-secret-key-for-testing-at-least-32-chars';
process.env.FRONTEND_URL = 'http://localhost:8081';

function buildApp() {
  const testApp = express();
  testApp.use(express.json());
  testApp.use('/api', docsRouter);
  return testApp;
}

const app = buildApp();

describe('GET /api/docs.json', () => {
  it('returns 200 and includes auth paths', async () => {
    const res = await supertest(app).get('/api/docs.json');

    expect(res.status).toBe(200);
    expect(res.body.paths['/api/auth/login']).toBeDefined();
    expect(res.body.paths['/api/auth/me']).toBeDefined();
  });
});
