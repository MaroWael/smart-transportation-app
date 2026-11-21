// ---------------------------------------------------------------
// Smart Transportation — Journey routes
// ---------------------------------------------------------------
// Protected routes:
//   POST /api/journeys/calculate
//   GET  /api/journeys/fare-rules
// ---------------------------------------------------------------

import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  calculateJourneyHandler,
  listFareRulesHandler,
} from '../controllers/journey.controller';

const journeyRouter = Router();

journeyRouter.use(authenticate);

journeyRouter.post('/calculate', calculateJourneyHandler);
journeyRouter.get('/fare-rules', listFareRulesHandler);

export default journeyRouter;
