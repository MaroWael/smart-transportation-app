/**
 * Smart Transportation — Metro & Bus Transit Data Layer
 *
 * Provides typed API functions and React hooks for Metro and Bus endpoints.
 * All requests are authenticated with the passenger's Bearer token.
 * 401 errors trigger logout immediately.
 * Backend error messages are never shown directly; errors are mapped
 * by HTTP status code to i18n translation keys.
 */

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { API_BASE_URL, ApiError } from './api';
import { useAuth } from '@/context/auth-context';

// ---------------------------------------------------------------------------
// TypeScript Models
// ---------------------------------------------------------------------------

export interface StationLineSummary {
  id: string;
  number: number;
  color: string;
}

export interface MetroLineSummary {
  id: string;
  number: number;
  nameEn: string;
  color: string;
  stationCount: number;
}

export interface MetroLineStationItem {
  id: string;
  nameEn: string;
  lat: number;
  lng: number;
  order: number;
  isInterchange: boolean;
  lines: StationLineSummary[];
}

export interface MetroLineDetail {
  id: string;
  number: number;
  nameEn: string;
  color: string;
  stations: MetroLineStationItem[];
}

export interface StationItem {
  id: string;
  nameEn: string;
  lat: number;
  lng: number;
  isInterchange: boolean;
  lines: StationLineSummary[];
}

export interface BusRouteSummary {
  id: string;
  code: string;
  nameEn: string;
  stopCount: number;
}

export interface BusStopItem {
  id: string;
  nameEn: string;
  lat: number;
  lng: number;
  order: number;
}

export interface BusRouteDetail {
  id: string;
  code: string;
  nameEn: string;
  stops: BusStopItem[];
}

// ---------------------------------------------------------------------------
// Error Mapping
// ---------------------------------------------------------------------------

export function getStatusErrorKey(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 400:
        return 'errors.invalidInput';
      case 401:
        return 'errors.sessionExpired';
      case 403:
        return 'errors.forbidden';
      case 404:
        return 'errors.notFound';
      case 429:
        return 'errors.tooManyRequests';
      case 500:
      default:
        return 'errors.serverError';
    }
  }
  return 'errors.networkError';
}

// ---------------------------------------------------------------------------
// Authenticated API Request Helper
// ---------------------------------------------------------------------------

async function fetchWithAuth<T>(
  path: string,
  token: string,
  signal?: AbortSignal
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw err;
    }
    throw new ApiError(0, 'Network request failed', err);
  }

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    throw new ApiError(response.status, response.statusText, body);
  }

  const json = (await response.json()) as { status: string; data: T };
  return json.data;
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

export async function fetchMetroLines(
  token: string,
  signal?: AbortSignal
): Promise<MetroLineSummary[]> {
  return fetchWithAuth<MetroLineSummary[]>('/metro/lines', token, signal);
}

export async function fetchMetroLineById(
  id: string,
  token: string,
  signal?: AbortSignal
): Promise<MetroLineDetail> {
  return fetchWithAuth<MetroLineDetail>(`/metro/lines/${id}`, token, signal);
}

export async function fetchStations(
  token: string,
  params?: { q?: string; lineId?: string },
  signal?: AbortSignal
): Promise<StationItem[]> {
  const query = new URLSearchParams();
  if (params?.q) query.append('q', params.q);
  if (params?.lineId) query.append('lineId', params.lineId);
  const qs = query.toString();
  const path = qs ? `/stations?${qs}` : '/stations';
  return fetchWithAuth<StationItem[]>(path, token, signal);
}

export async function fetchBusRoutes(
  token: string,
  signal?: AbortSignal
): Promise<BusRouteSummary[]> {
  return fetchWithAuth<BusRouteSummary[]>('/bus/routes', token, signal);
}

export async function fetchBusRouteById(
  id: string,
  token: string,
  signal?: AbortSignal
): Promise<BusRouteDetail> {
  return fetchWithAuth<BusRouteDetail>(`/bus/routes/${id}`, token, signal);
}

// ---------------------------------------------------------------------------
// Hook Layer
// ---------------------------------------------------------------------------

export function useMetroLines() {
  const { token, logout } = useAuth();
  const { t } = useTranslation();
  const [data, setData] = useState<MetroLineSummary[] | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const executeFetch = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) return;
      try {
        const result = await fetchMetroLines(token, signal);
        if (!signal?.aborted) {
          setData(result);
          setError(null);
          setErrorKey(null);
          setLoading(false);
        }
      } catch (err) {
        if (signal?.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          await logout();
          return;
        }
        const key = getStatusErrorKey(err);
        setErrorKey(key);
        setError(t(key as any) as string);
        setLoading(false);
      }
    },
    [token, logout, t]
  );

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    const controller = new AbortController();

    fetchMetroLines(token, controller.signal)
      .then((result) => {
        if (!isMounted) return;
        setData(result);
        setError(null);
        setErrorKey(null);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted || controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          void logout();
          return;
        }
        const key = getStatusErrorKey(err);
        setErrorKey(key);
        setError(t(key as any) as string);
        setLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [token, logout, t]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await executeFetch();
  }, [executeFetch]);

  return { data, loading, error, errorKey, refetch };
}

export function useMetroLine(id: string | undefined) {
  const { token, logout } = useAuth();
  const { t } = useTranslation();
  const [data, setData] = useState<MetroLineDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(token && id));
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const executeFetch = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !id) return;
      try {
        const result = await fetchMetroLineById(id, token, signal);
        if (!signal?.aborted) {
          setData(result);
          setError(null);
          setErrorKey(null);
          setLoading(false);
        }
      } catch (err) {
        if (signal?.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          await logout();
          return;
        }
        const key = getStatusErrorKey(err);
        setErrorKey(key);
        setError(t(key as any) as string);
        setLoading(false);
      }
    },
    [token, id, logout, t]
  );

  useEffect(() => {
    if (!token || !id) return;
    let isMounted = true;
    const controller = new AbortController();

    fetchMetroLineById(id, token, controller.signal)
      .then((result) => {
        if (!isMounted) return;
        setData(result);
        setError(null);
        setErrorKey(null);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted || controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          void logout();
          return;
        }
        const key = getStatusErrorKey(err);
        setErrorKey(key);
        setError(t(key as any) as string);
        setLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [token, id, logout, t]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await executeFetch();
  }, [executeFetch]);

  return {
    data,
    loading,
    error,
    errorKey,
    refetch,
  };
}

export function useBusRoutes() {
  const { token, logout } = useAuth();
  const { t } = useTranslation();
  const [data, setData] = useState<BusRouteSummary[] | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const executeFetch = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) return;
      try {
        const result = await fetchBusRoutes(token, signal);
        if (!signal?.aborted) {
          setData(result);
          setError(null);
          setErrorKey(null);
          setLoading(false);
        }
      } catch (err) {
        if (signal?.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          await logout();
          return;
        }
        const key = getStatusErrorKey(err);
        setErrorKey(key);
        setError(t(key as any) as string);
        setLoading(false);
      }
    },
    [token, logout, t]
  );

  useEffect(() => {
    if (!token) return;
    let isMounted = true;
    const controller = new AbortController();

    fetchBusRoutes(token, controller.signal)
      .then((result) => {
        if (!isMounted) return;
        setData(result);
        setError(null);
        setErrorKey(null);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted || controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          void logout();
          return;
        }
        const key = getStatusErrorKey(err);
        setErrorKey(key);
        setError(t(key as any) as string);
        setLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [token, logout, t]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await executeFetch();
  }, [executeFetch]);

  return { data, loading, error, errorKey, refetch };
}

export function useBusRoute(id: string | undefined) {
  const { token, logout } = useAuth();
  const { t } = useTranslation();
  const [data, setData] = useState<BusRouteDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(token && id));
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const executeFetch = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !id) return;
      try {
        const result = await fetchBusRouteById(id, token, signal);
        if (!signal?.aborted) {
          setData(result);
          setError(null);
          setErrorKey(null);
          setLoading(false);
        }
      } catch (err) {
        if (signal?.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          await logout();
          return;
        }
        const key = getStatusErrorKey(err);
        setErrorKey(key);
        setError(t(key as any) as string);
        setLoading(false);
      }
    },
    [token, id, logout, t]
  );

  useEffect(() => {
    if (!token || !id) return;
    let isMounted = true;
    const controller = new AbortController();

    fetchBusRouteById(id, token, controller.signal)
      .then((result) => {
        if (!isMounted) return;
        setData(result);
        setError(null);
        setErrorKey(null);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted || controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          void logout();
          return;
        }
        const key = getStatusErrorKey(err);
        setErrorKey(key);
        setError(t(key as any) as string);
        setLoading(false);
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [token, id, logout, t]);

  const refetch = useCallback(async () => {
    setLoading(true);
    await executeFetch();
  }, [executeFetch]);

  return { data, loading, error, errorKey, refetch };
}
