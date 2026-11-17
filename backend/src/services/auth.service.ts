// ---------------------------------------------------------------
// Smart Transportation — Auth service
// ---------------------------------------------------------------
// Business logic for /api/auth. Never returns passwordHash.
// ---------------------------------------------------------------

import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { signToken } from '../utils/jwt';
import { compare, hash } from 'bcryptjs';
import { AppError } from '../middlewares/error.middleware';
import type { RegisterInput, LoginInput, UpdateMeInput } from '../validators/auth.validator';

// Dummy hash used when the email is unknown, so a failed login takes
// roughly the same time regardless of whether the email exists
// (timing-attack mitigation). Generated once at module load.
let dummyHash: string | null = null;

async function getDummyHash(): Promise<string> {
  if (!dummyHash) {
    dummyHash = await hash('dummy-value-that-will-never-match', 10);
  }
  return dummyHash;
}

export type SafeUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const toSafeUser = (user: {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): SafeUser => {
  const { passwordHash, ...rest } = user;
  return rest as SafeUser;
};

const issueToken = (userId: string): string => {
  return signToken(userId);
};

// ---------------------------------------------------------------
// Register
// ---------------------------------------------------------------
export const register = async (input: RegisterInput) => {
  // Email already normalized (trimmed + lowercased) by the Zod schema.
  const { fullName, email, password } = input;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  // Role is always PASSENGER — any role sent in the body is ignored.
  const passwordHash = await hash(password, 10);

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash,
      role: 'PASSENGER',
    },
  });

  const token = issueToken(user.id);
  return { user: toSafeUser(user), token };
};

// ---------------------------------------------------------------
// Login
// ---------------------------------------------------------------
export const login = async (input: LoginInput) => {
  const { email, password } = input;

  const user = await prisma.user.findUnique({ where: { email } });

  // Always run bcrypt.compare so timing doesn't reveal whether the
  // email exists. Against a dummy hash when the user is unknown.
  const hashToCompare = user ? user.passwordHash : await getDummyHash();
  await compare(password, hashToCompare);

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const passwordMatches = await compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account is inactive', 403);
  }

  const token = issueToken(user.id);
  return { user: toSafeUser(user), token };
};

// ---------------------------------------------------------------
// GET /me
// ---------------------------------------------------------------
export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError('User not found', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account is inactive', 403);
  }

  return toSafeUser(user);
};

// ---------------------------------------------------------------
// PATCH /me — only fullName can change
// ---------------------------------------------------------------
export const updateMe = async (userId: string, input: UpdateMeInput) => {
  const { fullName } = input;

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError('User not found', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account is inactive', 403);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { fullName },
  });

  return toSafeUser(updated);
};

// Re-export for error-type checking in controllers
export { Prisma };
