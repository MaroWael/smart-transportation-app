// ---------------------------------------------------------------
// Smart Transportation — Metro routes
// ---------------------------------------------------------------
// Mounted under /api/metro in src/app.ts:
//   GET /api/metro/lines
//   GET /api/metro/lines/:id
// All routes require authentication (any role).
// ---------------------------------------------------------------

import { Router } from 'express';
import {
  listMetroLines,
  getMetroLine,
  validateMetroLineId,
} from '../controllers/metro.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/lines', authenticate, listMetroLines);
router.get('/lines/:id', authenticate, validateMetroLineId, getMetroLine);

export default router;
