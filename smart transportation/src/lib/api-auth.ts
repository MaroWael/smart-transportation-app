import { API_BASE_URL, api, ApiError } from './api';

export type UserRole = 'PASSENGER' | 'STATION_EMPLOYEE' | 'ADMIN';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  user: User;
  token: string;
}

function getAuthHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

async function parseBody<T>(response: Response): Promise<T> {
  const text = await response.text().catch(() => '');
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

async function requestWithTimeout<T>(
  input: RequestInfo | URL,
  init: RequestInit,
  ms = 10000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) {
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = await response.text().catch(() => null);
      }
      throw new ApiError(response.status, response.statusText, body);
    }
    return parseBody<T>(response);
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export async function login(
  email: string,
  password: string
): Promise<AuthTokens> {
  const body = await api.post<{
    status: string;
    data?: AuthTokens;
    message?: string;
    errors?: Record<string, string[]>;
  }>('/auth/login', { email, password });
  if (body.status !== 'ok' || !body.data) {
    throw new ApiError(400, body.message ?? 'Login failed', body);
  }
  return body.data;
}

export async function register(
  fullName: string,
  email: string,
  password: string
): Promise<AuthTokens> {
  const body = await api.post<{
    status: string;
    data?: AuthTokens;
    message?: string;
    errors?: Record<string, string[]>;
  }>('/auth/register', { fullName, email, password });
  if (body.status !== 'ok' || !body.data) {
    throw new ApiError(400, body.message ?? 'Registration failed', body);
  }
  return body.data;
}

export async function fetchMe(token: string): Promise<User> {
  const data = await requestWithTimeout<{
    status: string;
    data?: { user: User } | User;
    message?: string;
  }>(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders(token),
    method: 'GET',
  }, 10000);
  if (data.status !== 'ok' || !data.data) {
    throw new ApiError(400, data.message ?? 'Invalid response', data);
  }
  const user = 'user' in data.data && data.data.user ? data.data.user : (data.data as User);
  return user;
}

export async function updateProfile(
  token: string,
  fullName: string
): Promise<User> {
  const data = await requestWithTimeout<{
    status: string;
    data?: { user: User } | User;
    message?: string;
  }>(`${API_BASE_URL}/auth/me`, {
    headers: {
      ...getAuthHeaders(token),
      'Content-Type': 'application/json',
    },
    method: 'PATCH',
    body: JSON.stringify({ fullName }),
  }, 10000);
  if (data.status !== 'ok' || !data.data) {
    throw new ApiError(400, data.message ?? 'Update failed', data);
  }
  const user = 'user' in data.data && data.data.user ? data.data.user : (data.data as User);
  return user;
}

export function extractApiError(err: unknown): {
  status?: number;
  message?: string;
  errors?: Record<string, string[]>;
} {
  if (err instanceof ApiError) {
    return {
      status: err.status,
      message: err.message,
      errors: err.errors,
    };
  }
  return {};
}
