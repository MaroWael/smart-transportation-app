// ---------------------------------------------------------------
// Smart Transportation — Station routes
// ---------------------------------------------------------------
// Mounted under /api/stations in src/app.ts:
//   GET /api/stations
// All routes require authentication (any role).
// ---------------------------------------------------------------

import { Router } from 'express';
import {
  listStations,
  validateStationQuery,
} from '../controllers/station.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, validateStationQuery, listStations);

export default router;
