import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ApiError } from '@/lib/api';
import { fetchCurrentUser, type AuthUser, type Session } from '@/lib/auth-api';
import { clearToken, loadToken, saveToken } from '@/lib/session-store';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  /** True until the stored token has been read and checked against the API. */
  isRestoring: boolean;
  isSignedIn: boolean;
  signIn: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const stored = await loadToken();
      if (cancelled) return;

      if (stored) {
        try {
          // Round-trips the token so a session revoked server-side (expiry, or
          // a bumped token_version after Apple revocation) does not come back
          // as a logged-in user holding a dead JWT.
          const { user: current } = await fetchCurrentUser(stored);
          if (!cancelled) {
            setToken(stored);
            setUser(current);
          }
        } catch (err) {
          // 401 is a definitive rejection, so drop the token. Anything else
          // (server down, offline) leaves it in place to retry next launch —
          // a flaky network should not sign people out.
          if (err instanceof ApiError && err.status === 401) {
            await clearToken();
          }
        }
      }

      if (!cancelled) setIsRestoring(false);
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isRestoring,
      isSignedIn: token !== null,
      signIn: async (session: Session) => {
        await saveToken(session.token);
        setToken(session.token);
        setUser(session.user);
      },
      signOut: async () => {
        await clearToken();
        setToken(null);
        setUser(null);
      },
    }),
    [user, token, isRestoring]
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = use(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return context;
}
