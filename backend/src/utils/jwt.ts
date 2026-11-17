// ---------------------------------------------------------------
// Smart Transportation — JWT utilities
// ---------------------------------------------------------------
// Signs and verifies access tokens. The payload contains only the
// user id (`sub`) and standard claims — never role or email.
// ---------------------------------------------------------------

import { sign, verify, JwtPayload, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

interface TokenPayload {
  sub: string;
}

export const signToken = (userId: string): string => {
  return sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
};

export const verifyToken = (token: string): TokenPayload => {
  const decoded = verify(token, env.JWT_SECRET);

  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload');
  }

  const { sub } = decoded as JwtPayload & TokenPayload;
  if (!sub || typeof sub !== 'string') {
    throw new Error('Invalid token payload');
  }

  return { sub };
};
