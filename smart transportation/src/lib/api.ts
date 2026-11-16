/**
 * Smart Transportation — Centralized API client
 *
 * A single place to configure and perform HTTP requests to the
 * Express backend. Keeps the frontend independent of the backend
 * implementation and avoids leaking backend secrets into the app.
 *
 * IMPORTANT:
 *   - Never put Neon / database connection strings here.
 *   - Never expose backend secrets through EXPO_PUBLIC_ variables.
 *   - EXPO_PUBLIC_API_URL (optional) overrides the production base URL.
 *
 * Development on a physical Android device:
 *   'localhost' on the device refers to the device itself, not your
 *   computer. Replace 'http://localhost:5000/api' with your computer's
 *   local IP address, e.g. 'http://192.168.1.42:5000/api', and make
 *   sure the device and computer are on the same Wi-Fi network.
 */

// Read the optional production override without requiring the
// auto-generated expo-env.d.ts (which may not exist yet).
const EXPO_PUBLIC_API_URL =
  (process.env as { EXPO_PUBLIC_API_URL?: string }).EXPO_PUBLIC_API_URL ??
  undefined;

const normalizeBaseUrl = (url: string): string => {
  const withoutTrailingSlash = url.replace(/\/$/, '');
  return withoutTrailingSlash.endsWith('/api')
    ? withoutTrailingSlash
    : `${withoutTrailingSlash}/api`;
};

const getApiBaseUrl = (): string => {
  if (EXPO_PUBLIC_API_URL) {
    return normalizeBaseUrl(EXPO_PUBLIC_API_URL);
  }
  if (__DEV__) {
    // Local development backend running on your computer.
    return 'http://localhost:5000/api';
  }
  return 'https://smart-transportation-app.vercel.app/api';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Centralized error thrown by the API client on non-ok responses.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/**
 * Low-level fetch wrapper with centralized request/response handling.
 */
async function request<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = await response.text().catch(() => null);
    }
    throw new ApiError(response.status, response.statusText, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}

/**
 * Typed API methods. Prepend the path with a leading slash.
 */
export const api = {
  baseUrl: API_BASE_URL,
  get: <T>(path: string, init?: RequestInit) =>
    request<T>(`${API_BASE_URL}${path}`, { ...init, method: 'GET' }),
  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(
      `${API_BASE_URL}${path}`,
      {
        ...init,
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      }
    ),
  put: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(
      `${API_BASE_URL}${path}`,
      {
        ...init,
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
      }
    ),
  delete: <T>(path: string, init?: RequestInit) =>
    request<T>(`${API_BASE_URL}${path}`, { ...init, method: 'DELETE' }),
};

/**
 * Test request to GET /api/health.
 * Resolves with the health payload when the backend is reachable.
 */
export const healthCheck = () =>
  api.get<{
    status: string;
    environment: string;
    database: { connected: boolean };
  }>('/health');


