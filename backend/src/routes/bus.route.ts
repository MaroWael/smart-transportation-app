// ---------------------------------------------------------------
// Smart Transportation — Bus routes
// ---------------------------------------------------------------
// Mounted under /api/bus in src/app.ts:
//   GET /api/bus/routes
//   GET /api/bus/routes/:id
// All routes require authentication (any role).
// ---------------------------------------------------------------

import { Router } from 'express';
import {
  listBusRoutes,
  getBusRoute,
  validateBusRouteId,
} from '../controllers/bus.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/routes', authenticate, listBusRoutes);
router.get('/routes/:id', authenticate, validateBusRouteId, getBusRoute);

export default router;
