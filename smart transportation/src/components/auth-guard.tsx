import { useEffect, useState } from 'react';

import { usePathname, useRouter } from 'expo-router';

import { useAuth } from '@/context/auth-context';
import { storage } from '@/lib/storage';

import { LoadingOverlay } from './loading-overlay';
import { RetryOverlay } from './retry-overlay';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status, token, error } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingSeen, setOnboardingSeen] = useState(true);

  useEffect(() => {
    let mounted = true;
    storage.getOnboardingSeen().then((seen) => {
      if (mounted) {
        setOnboardingSeen(seen);
        setOnboardingChecked(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, [pathname]);

  const isOnboardingRoute = pathname === '/onboarding';
  const isAuthRoute =
    pathname === '/login' || pathname === '/register' || isOnboardingRoute;
  const showRetry =
    status === 'unauthenticated' && !!token && error === 'errors.networkError';

  // The guard is the single place that redirects. No redirect while loading.
  useEffect(() => {
    if (status === 'loading' || !onboardingChecked) return;

    if (status === 'authenticated') {
      if (!onboardingSeen) {
        setOnboardingSeen(true);
        void storage.setOnboardingSeen(true);
      }
      if (isAuthRoute) {
        router.replace('/');
      }
      return;
    }

    if (status === 'unauthenticated' && !showRetry) {
      if (!onboardingSeen && !isOnboardingRoute) {
        router.replace('/onboarding' as any);
        return;
      }
      if (onboardingSeen && isOnboardingRoute) {
        router.replace('/login');
        return;
      }
      if (!isAuthRoute) {
        router.replace('/login');
        return;
      }
    }
  }, [
    status,
    token,
    error,
    onboardingChecked,
    onboardingSeen,
    isOnboardingRoute,
    isAuthRoute,
    showRetry,
    router,
  ]);

  // The navigator (children) is always mounted. Overlays sit on top and
  // render null when not needed, so they never block touches when inactive.
  return (
    <>
      {children}
      {(status === 'loading' || !onboardingChecked) && <LoadingOverlay />}
      {showRetry && <RetryOverlay />}
    </>
  );
}
