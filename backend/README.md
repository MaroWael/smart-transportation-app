# Smart Transportation — Express Backend

This is the Express.js + TypeScript backend for the Smart Transportation Expo app. It is one of two independent applications in this repository:

- **Frontend**: `smart transportation/` (Expo React Native, built with EAS)
- **Backend**: `backend/` (this folder, deployed separately on Vercel)

---

## Project Structure

```text
backend/
├── api/
│   └── index.ts              # Vercel serverless entry (exports Express app)
├── src/
│   ├── app.ts                # Express app factory
│   ├── server.ts             # Local dev entry (app.listen)
│   ├── config/
│   │   ├── env.ts            # Zod environment validation
│   │   └── prisma.ts         # PrismaClient singleton
│   ├── controllers/
│   │   └── health.controller.ts
│   ├── middlewares/
│   │   └── error.middleware.ts
│   ├── routes/
│   │   └── health.route.ts
│   ├── services/
│   ├── utils/
│   │   └── check-db.ts       # `npm run prisma:check`
│   └── ...
├── prisma/
│   └── schema.prisma         # Prisma schema (Neon PostgreSQL)
├── .env                      # Local secrets — gitignored
├── .env.example              # Committed template
├── package.json              # Backend deps & scripts
├── tsconfig.json             # TypeScript config
└── vercel.json               # Vercel serverless routing config
```

---

## Getting Started

```bash
cd backend
npm install
cp .env.example .env        # then fill in your Neon credentials
npm run prisma:generate
npm run dev                 # http://localhost:5000/api/health
```

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start dev server (tsx watch) |
| `npm run build` | TypeScript compile to `dist/` |
| `npm run start` | Production start (`node dist/src/server.js`) |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Run Prisma migrations (Neon direct URL) |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:check` | Verify Neon database connectivity |

---

## Environment Variables (`backend/.env`, gitignored)

```env
NODE_ENV=development
PORT=5000

DATABASE_URL=             # Neon pooled connection string (pgbouncer=true, app runtime)
DIRECT_URL=               # Neon direct connection string (migrations)
JWT_SECRET=               # Strong random secret
FRONTEND_URL=http://localhost:8081
```

Required variables are validated at startup with Zod. Missing variables cause a clear error message and exit.

**Never** commit `.env`. Never expose these credentials to the frontend.

---

## Neon PostgreSQL + Prisma

- `DATABASE_URL`: pooled connection string used by Prisma Client at runtime (safe for serverless).
- `DIRECT_URL`: direct connection string used by Prisma migrations/DDL.

Neon schema (`prisma/schema.prisma`) uses both `url` and `directUrl`.

---

## Vercel Deployment

Deploy by setting the Vercel project **Root Directory** to `backend/`.

- `api/index.ts` imports the Express app and exports it as the **default** export.
- No `app.listen()` is called in the serverless entry point.
- `vercel.json` routes all requests to `api/index.ts` under `/api/*`.
- Add environment variables (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV`) in Vercel Project Settings.

Vercel CLI verification:

```bash
cd backend
vercel build    # verifies build config (CLI auth required)
vercel dev      # runs locally as Vercel would (CLI v47+)
```
