import { useEffect } from 'react';

import { usePathname, useRouter } from 'expo-router';

import { useAuth } from '@/context/auth-context';

import { LoadingOverlay } from './loading-overlay';
import { RetryOverlay } from './retry-overlay';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status, token, error } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isAuthRoute = pathname === '/login' || pathname === '/register';
  const showRetry =
    status === 'unauthenticated' && !!token && error === 'errors.networkError';

  // The guard is the single place that redirects. No redirect while loading.
  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'authenticated' && isAuthRoute) {
      router.replace('/');
      return;
    }

    if (status === 'unauthenticated' && !isAuthRoute && !showRetry) {
      router.replace('/login');
      return;
    }
  }, [status, token, error, isAuthRoute, showRetry, router]);

  // The navigator (children) is always mounted. Overlays sit on top and
  // render null when not needed, so they never block touches when inactive.
  return (
    <>
      {children}
      {status === 'loading' && <LoadingOverlay />}
      {showRetry && <RetryOverlay />}
    </>
  );
}
