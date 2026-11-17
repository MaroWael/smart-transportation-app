// ---------------------------------------------------------------
// Smart Transportation — Auth routes
// ---------------------------------------------------------------
// Mounted under /api in src/app.ts → full paths:
//   POST   /api/auth/register
//   POST   /api/auth/login
//   GET    /api/auth/me        (protected)
//   PATCH  /api/auth/me        (protected)
// ---------------------------------------------------------------

import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateMe,
  validateRegister,
  validateLogin,
  validateUpdateMe,
} from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, validateUpdateMe, updateMe);

export default router;
