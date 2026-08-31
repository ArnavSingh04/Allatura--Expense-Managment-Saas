'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useUser } from '@auth0/nextjs-auth0';
import { ApiError, apiGet } from '@/lib/api-client';
import { can, normalizeRole, type RbacAction, type UserRole } from '@/lib/rbac';

export type UserStatus = 'PendingApproval' | 'Active' | 'Rejected';

/**
 * A failure resolving the internal profile (`GET /auth/me`) while Auth0 still
 * considers the user logged in. `status` is the backend HTTP status when known
 * (401/403 → the access token/session was rejected; treat as re-auth needed).
 */
export type AuthLoadError = {
  status?: number;
  message: string;
  /** True for 401/403 — the session/token is invalid; signing in again fixes it. */
  isAuthFailure: boolean;
};

export type AuthSession = {
  role: UserRole;
  status: UserStatus;
  name?: string;
  tenantId?: string;
  email?: string;
  sub?: string;
  organisationName?: string;
};

type AuthSessionContextValue = {
  /** False until Auth0 has resolved and (if logged in) /auth/me has returned. */
  ready: boolean;
  /** True when there is a valid Auth0 session, regardless of onboarding. */
  isAuthenticated: boolean;
  /** True when authenticated but not yet linked to an org (needs onboarding). */
  needsOnboarding: boolean;
  session: AuthSession | null;
  /**
   * Set when authenticated but `/auth/me` could not be resolved (token rejected,
   * server/network error). Lets the UI recover instead of spinning forever.
   */
  error: AuthLoadError | null;
  isActive: boolean;
  isPending: boolean;
  isRejected: boolean;
  /** Always false unless `isActive` — pending users have zero capabilities. */
  can: (action: RbacAction) => boolean;
  /** Re-fetch /auth/me. */
  refresh: () => void;
  /** Redirect into the Auth0 Universal Login. */
  login: (returnTo?: string) => void;
  /** Redirect through Auth0 logout, clearing the session cookie. */
  signOut: () => void;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

function normalizeStatus(value: unknown): UserStatus {
  if (value === 'Active' || value === 'PendingApproval' || value === 'Rejected') {
    return value;
  }
  return 'PendingApproval';
}

type MeResponse = {
  needsOnboarding?: boolean;
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  status?: string;
  tenantId?: string;
  organisationName?: string;
};

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useUser();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [error, setError] = useState<AuthLoadError | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const refreshFromMe = useCallback(async () => {
    if (inFlightRef.current) return inFlightRef.current;
    if (!user) {
      setSession(null);
      setNeedsOnboarding(false);
      setError(null);
      return;
    }
    const promise = (async () => {
      try {
        const me = await apiGet<MeResponse>('auth/me');
        if (!me) {
          // Empty body from a 2xx — unexpected; surface as a recoverable error
          // rather than an indefinite spinner.
          setSession(null);
          setError({ message: 'Empty response from the server.', isAuthFailure: false });
          return;
        }
        if (me.needsOnboarding) {
          setNeedsOnboarding(true);
          setSession(null);
          setError(null);
          return;
        }
        setNeedsOnboarding(false);
        setError(null);
        setSession({
          sub: me.id,
          name: me.name,
          email: me.email,
          role: normalizeRole(me.role),
          status: normalizeStatus(me.status),
          tenantId: me.tenantId,
          organisationName: me.organisationName,
        });
      } catch (err) {
        // The Auth0 session exists (we have `user`) but the backend rejected the
        // request or is unreachable. Record it so the gate can offer recovery
        // (retry / sign out) instead of spinning forever. Auth0 remains the
        // source of truth for `isAuthenticated`.
        const status = err instanceof ApiError ? err.status : undefined;
        const isAuthFailure = status === 401 || status === 403;
        console.error('[auth] Failed to resolve /auth/me:', err);
        setSession(null);
        setError({
          status,
          isAuthFailure,
          message:
            err instanceof Error && err.message
              ? err.message
              : 'Could not load your account.',
        });
      }
    })().finally(() => {
      inFlightRef.current = null;
    });
    inFlightRef.current = promise;
    return promise;
  }, [user]);

  const refresh = useCallback(() => {
    void refreshFromMe();
  }, [refreshFromMe]);

  // Resolve the profile once Auth0 has finished loading and whenever the
  // Auth0 user changes (login/logout).
  useEffect(() => {
    if (isLoading) return;
    let cancelled = false;
    (async () => {
      await refreshFromMe();
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoading, user, refreshFromMe]);

  // Poll /auth/me while a logged-in user is non-Active so an admin's role/status
  // change (or an approval) reflects without a manual reload.
  useEffect(() => {
    if (!ready || !user || session?.status === 'Active') return;
    let cancelled = false;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible' && !cancelled) {
        void refreshFromMe();
      }
    }, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [ready, user, session, refreshFromMe]);

  const login = useCallback((returnTo?: string) => {
    const qs = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
    window.location.assign(`/auth/login${qs}`);
  }, []);

  const signOut = useCallback(() => {
    window.location.assign('/auth/logout');
  }, []);

  const value = useMemo((): AuthSessionContextValue => {
    const status = session?.status;
    const isActive = status === 'Active';
    const role = session?.role ?? 'viewer';
    return {
      ready,
      isAuthenticated: !!user,
      needsOnboarding,
      session,
      error,
      isActive,
      isPending: status === 'PendingApproval',
      isRejected: status === 'Rejected',
      can: (action: RbacAction) => (isActive ? can(role, action) : false),
      refresh,
      login,
      signOut,
    };
  }, [ready, user, needsOnboarding, session, error, refresh, login, signOut]);

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession(): AuthSessionContextValue {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) {
    throw new Error('useAuthSession must be used within AuthSessionProvider');
  }
  return ctx;
}
