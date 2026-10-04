import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api';

/**
 * Loads something from the API for the signed-in user. Fetches whenever the
 * screen comes into focus (so a tab switch, or coming back from another screen,
 * is fresh), and sends the user to sign-in if the server rejects their session.
 *
 * `fetcher` must be stable (module-level, or wrapped in `useCallback`), since a
 * new function means a new fetch.
 */
export function useAuthedFetch<T>(fetcher: (token: string) => Promise<T>) {
  const { token, isRestoring, signOut } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Only the newest request may write state, so a slow earlier response can
  // never overwrite a fresher one.
  const latestRequest = useRef(0);

  // Screens here are not route-guarded, so bounce anyone who is signed out.
  useEffect(() => {
    if (!isRestoring && !token) router.replace('/');
  }, [isRestoring, token, router]);

  const load = useCallback(
    async (showRefreshing: boolean) => {
      if (!token) return;
      const request = ++latestRequest.current;
      if (showRefreshing) setIsRefreshing(true);

      try {
        const next = await fetcher(token);
        if (request !== latestRequest.current) return;
        setData(next);
        setError(null);
      } catch (err) {
        if (request !== latestRequest.current) return;
        // 401: the token expired or was revoked. Anything else (offline,
        // server down) is a retryable error and must not sign anyone out.
        if (err instanceof ApiError && err.status === 401) {
          await signOut();
          return;
        }
        setError(err);
      } finally {
        if (request === latestRequest.current) setIsRefreshing(false);
      }
    },
    [token, fetcher, signOut]
  );

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load])
  );

  return {
    /** Null until the first load succeeds. */
    data,
    error,
    /** First load, before there is anything (or any error) to show. */
    isLoading: data === null && error === null,
    isRefreshing,
    refresh: () => load(true),
    retry: () => {
      setError(null);
      load(false);
    },
  };
}
