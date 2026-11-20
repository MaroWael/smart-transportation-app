import { createContext, useContext, useCallback, useState, useEffect } from 'react';

import { storage } from '@/lib/storage';
import {
  login as apiLogin,
  register as apiRegister,
  fetchMe,
  updateProfile,
  type User,
  type UserRole,
  type AuthTokens,
} from '@/lib/api-auth';
import { ApiError } from '@/lib/api';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  status: AuthStatus;
  error: string | null;
  fieldErrors: Record<string, string[]> | null;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (fullName: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);

  const role = user?.role ?? null;

  // Session restore on mount.
  // - No stored token -> "unauthenticated" immediately, no network call.
  // - With token -> GET /auth/me with 10s timeout.
  //   - 401 -> clear session.
  //   - Network failure/timeout -> keep token, show retry overlay.
  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const storedToken = await storage.getToken();
      if (!storedToken) {
        if (mounted) {
          setToken(null);
          setUser(null);
          setStatus('unauthenticated');
          setError(null);
          setFieldErrors(null);
        }
        return;
      }

      if (mounted) setToken(storedToken);

      try {
        const me = await fetchMe(storedToken);
        if (mounted) {
          setUser(me);
          setStatus('authenticated');
          setError(null);
          setFieldErrors(null);
        }
      } catch (err) {
        if (!mounted) return;
        const apiErr = err as ApiError;
        if (apiErr.status === 401 || apiErr.status === 403) {
          // Bad/inactive token: clear session.
          await storage.setToken(null);
          setToken(null);
          setUser(null);
          setStatus('unauthenticated');
          setError(null);
          setFieldErrors(null);
        } else {
          // Network failure / timeout: keep token, show retry overlay.
          setError('errors.networkError');
          setStatus('unauthenticated');
        }
      }
    }

    restoreSession();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      setError(null);
      setFieldErrors(null);
      try {
        const result: AuthTokens = await apiLogin(email, password);
        await storage.setToken(result.token);
        setToken(result.token);
        setUser(result.user);
        setStatus('authenticated');
      } catch (err) {
        const apiErr = err as ApiError;
        // 401 on login/register must NOT log out; show invalid-credentials message.
        if (apiErr.status === 401) {
          setError('auth.invalidCredentials');
          return;
        }
        if (apiErr.status === 409) {
          setError('errors.emailTaken');
          return;
        }
        if (apiErr.status === 400 && apiErr.errors) {
          setFieldErrors(apiErr.errors);
          return;
        }
        setError('errors.somethingWentWrong');
      }
    },
    []
  );

  const handleRegister = useCallback(
    async (fullName: string, email: string, password: string) => {
      setError(null);
      setFieldErrors(null);
      try {
        const result: AuthTokens = await apiRegister(fullName, email, password);
        await storage.setToken(result.token);
        setToken(result.token);
        setUser(result.user);
        setStatus('authenticated');
      } catch (err) {
        const apiErr = err as ApiError;
        // 401 on login/register must NOT log out.
        if (apiErr.status === 401) {
          setError('auth.invalidCredentials');
          return;
        }
        if (apiErr.status === 409) {
          setError('errors.emailTaken');
          return;
        }
        if (apiErr.status === 400 && apiErr.errors) {
          setFieldErrors(apiErr.errors);
          return;
        }
        setError('errors.somethingWentWrong');
      }
    },
    []
  );

  const handleLogout = useCallback(async () => {
    await storage.setToken(null);
    setToken(null);
    setUser(null);
    setStatus('unauthenticated');
    setError(null);
    setFieldErrors(null);
  }, []);

  const handleRefreshUser = useCallback(async () => {
    if (!token) return;
    setError(null);
    setFieldErrors(null);
    try {
      const me = await fetchMe(token);
      const userObj = (me as any)?.user ?? me;
      setUser(userObj);
      setStatus('authenticated');
      setError(null);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 401 || apiErr.status === 403) {
        await storage.setToken(null);
        setToken(null);
        setUser(null);
        setStatus('unauthenticated');
        setError(null);
        setFieldErrors(null);
      } else {
        // Network failure / timeout: keep token, show retry overlay.
        setError('errors.networkError');
      }
    }
  }, [token]);

  const handleUpdateProfile = useCallback(
    async (fullName: string) => {
      if (!token) return;
      setError(null);
      setFieldErrors(null);
      try {
        const me = await updateProfile(token, fullName);
        const userObj = (me as any)?.user ?? me;
        setUser(userObj);
        setError(null);
      } catch (err) {
        const apiErr = err as ApiError;
        // 401 on protected calls clears the session.
        if (apiErr.status === 401 || apiErr.status === 403) {
          await storage.setToken(null);
          setToken(null);
          setUser(null);
          setStatus('unauthenticated');
          setError(null);
          setFieldErrors(null);
          return;
        }
        if (apiErr.status === 400 && apiErr.errors) {
          setFieldErrors(apiErr.errors);
          return;
        }
        setError('errors.somethingWentWrong');
      }
    },
    [token]
  );

  const value: AuthContextType = {
    user,
    token,
    role,
    status,
    error,
    fieldErrors,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    updateProfile: handleUpdateProfile,
    refreshUser: handleRefreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
