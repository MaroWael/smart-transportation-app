// ---------------------------------------------------------------
// Smart Transportation — Express type augmentation
// ---------------------------------------------------------------
// Declares `req.user` so authenticated routes can access the loaded
// User record without type errors.
// ---------------------------------------------------------------

import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
