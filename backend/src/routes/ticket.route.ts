// ---------------------------------------------------------------
// Smart Transportation — Ticket Validation Routes (Staff / Admin)
// ---------------------------------------------------------------

import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware';
import {
  getValidationsHandler,
  validateTicketHandler,
} from '../controllers/ticket.controller';

const router = Router();

router.use(authenticate, authorizeRoles('STATION_EMPLOYEE', 'ADMIN'));

router.post('/validate', validateTicketHandler);
router.get('/validations', getValidationsHandler);

export default router;
