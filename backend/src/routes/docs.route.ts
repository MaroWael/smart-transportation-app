// ---------------------------------------------------------------
// Smart Transportation — Swagger UI docs route
// ---------------------------------------------------------------
// Serves the OpenAPI spec at /api/docs.json and Swagger UI at
// /api/docs. Swagger UI assets are loaded from the cdnjs CDN (pinned
// version) so it works on Vercel serverless without serving
// node_modules static files.
// ---------------------------------------------------------------

import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { openapi } from '../docs/openapi';

const router = Router();

// Raw OpenAPI JSON spec — registered before /api/docs so the UI can
// fetch it.
router.get('/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(openapi);
});

// Swagger UI with CDN-backed assets.
const SWAGGER_UI_VERSION = '5.17.14';
const CDN_BASE = `https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/${SWAGGER_UI_VERSION}`;

router.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(openapi, {
    explorer: false,
    customCssUrl: `${CDN_BASE}/swagger-ui.css`,
    customJs: [
      `${CDN_BASE}/swagger-ui-bundle.js`,
      `${CDN_BASE}/swagger-ui-standalone-preset.js`,
    ],
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
);

export default router;
