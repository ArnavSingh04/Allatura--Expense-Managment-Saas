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
import { setOrganisationBinding } from '@/lib/organisation-binding';
import { takeInvitationContinuation } from '@/lib/invitation-account-switch';

export type UserStatus = 'PendingApproval' | 'Active' | 'Rejected';

/**
 * A failure resolving the internal profile (`GET /auth/me`) while Auth0 still
 * exposes a signed-in user. Organisation selection errors need workspace
 * recovery; other 401/403 responses offer sign-in recovery.
 */
export type AuthLoadError = {
  status?: number;
  message: string;
  /** A 401/403 other than a recognised organisation selection error. */
  isAuthFailure: boolean;
  isOrganisationFailure?: boolean;
};

export type OrganisationMembership = {
  id: string;
  name: string;
  tenantId?: string;
  role: UserRole;
  status: UserStatus;
  isOrganisationOwner?: boolean;
};

export type AuthSession = {
  role: UserRole;
  status: UserStatus;
  name?: string;
  tenantId?: string;
  email?: string;
  sub?: string;
  organisationName?: string;
  organisationId?: string;
};

type AuthSessionContextValue = {
  /** False until Auth0 resolves and the initial /auth/me attempt settles. */
  ready: boolean;
  /** True when there is a valid Auth0 session, regardless of onboarding. */
  isAuthenticated: boolean;
  /** True when authenticated but not yet linked to an org (needs onboarding). */
  needsOnboarding: boolean;
  session: AuthSession | null;
  organisations: OrganisationMembership[];
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

function isTransientAuthMeFailure(err: unknown): boolean {
  if (!(err instanceof ApiError)) return true;
  return !err.status || err.status === 0 || err.status === 502 || err.status >= 500;
}

async function loadAuthMe(): Promise<MeResponse> {
  // Retry transient network/server failures briefly; permission and selection
  // failures need user action and must reach the recovery UI immediately.
  const pausesMs = [0, 400, 1000];
  let lastErr: unknown;
  for (const pause of pausesMs) {
    if (pause) {
      await new Promise((resolve) => setTimeout(resolve, pause));
    }
    try {
      return await apiGet<MeResponse>('auth/me');
    } catch (err) {
      lastErr = err;
      if (!isTransientAuthMeFailure(err)) throw err;
    }
  }
  throw lastErr;
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
  organisationId?: string;
  isOrganisationOwner?: boolean;
  organisations?: OrganisationMembership[];
};

function normalizeMemberships(entries: OrganisationMembership[] = []): OrganisationMembership[] {
  return entries.map((entry) => ({
    ...entry,
    role: entry.isOrganisationOwner ? 'owner' : normalizeRole(entry.role),
    status: normalizeStatus(entry.status),
  }));
}

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
  const [organisations, setOrganisations] = useState<OrganisationMembership[]>([]);
  // Deduplicate only within the same identity and effect lifetime. A response
  // started before logout or an account change must not restore the old session.
  const inFlightRef = useRef<{ subject: string; generation: number; promise: Promise<void> } | null>(null);
  const generationRef = useRef(0);
  const subjectRef = useRef<string | null>(null);

  const refreshFromMe = useCallback(async () => {
    const subject = user?.sub ?? '';
    const generation = generationRef.current;
    if (inFlightRef.current?.subject === subject && inFlightRef.current.generation === generation) {
      return inFlightRef.current.promise;
    }
    if (subjectRef.current !== subject) {
      subjectRef.current = subject;
      setOrganisationBinding(null);
      setOrganisations([]);
      setSession(null);
      setReady(false);
    }
    const isCurrent = () => generationRef.current === generation && subjectRef.current === subject;
    if (!user) {
      setSession(null);
      setNeedsOnboarding(false);
      setError(null);
      if (typeof window !== 'undefined') {
        try {
          const continuation = takeInvitationContinuation(window.sessionStorage, window.location.origin);
          if (continuation) window.location.assign(`/auth/login?returnTo=${encodeURIComponent(continuation)}`);
        } catch {
          // Storage can be unavailable; a normal sign-in remains available.
        }
      }
      return;
    }
    const promise = (async () => {
      try {
        const me = await loadAuthMe();
        if (!isCurrent()) return;
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
          setOrganisations(normalizeMemberships(me.organisations));
          return;
        }
        setNeedsOnboarding(false);
        setError(null);
        setSession({
          sub: me.id,
          name: me.name,
          email: me.email,
          role: me.isOrganisationOwner ? 'owner' : normalizeRole(me.role),
          status: normalizeStatus(me.status),
          tenantId: me.tenantId,
          organisationName: me.organisationName,
          organisationId: me.organisationId,
        });
        setOrganisations(normalizeMemberships(me.organisations));
        setOrganisationBinding(me.organisationId ?? null);
      } catch (err) {
        if (!isCurrent()) return;
        // The Auth0 session exists (we have `user`) but the backend rejected the
        // request or is unreachable. Record it so the gate can offer recovery
        // (retry / sign out) instead of spinning forever. Auth0 remains the
        // source of truth for `isAuthenticated`.
        const status = err instanceof ApiError ? err.status : undefined;
        const isOrganisationFailure = err instanceof ApiError &&
          ['organisation_access_denied', 'invalid_organisation', 'active_organisation_member_required'].includes(err.message);
        const isAuthFailure = !isOrganisationFailure && (status === 401 || status === 403);
        console.error('[auth] Failed to resolve /auth/me:', err);
        setSession(null);
        setError({
          status,
          isAuthFailure,
          isOrganisationFailure,
          message:
            err instanceof Error && err.message
              ? err.message
              : 'Could not load your account.',
        });
        if (isOrganisationFailure) {
          // Discovery is identity-scoped. Never silently switch away from the
          // selected workspace or retarget this tab's pending writes.
          try {
            const memberships = await apiGet<OrganisationMembership[]>('auth/organisations');
            if (isCurrent()) setOrganisations(normalizeMemberships(memberships));
          } catch {
            // Keep the original actionable selection error.
          }
        }
      }
    })().finally(() => {
      // An older request may finish after a new account starts loading. It must
      // not clear the newer request's deduplication entry.
      if (inFlightRef.current?.promise === promise) inFlightRef.current = null;
    });
    inFlightRef.current = { subject, generation, promise };
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
      generationRef.current += 1;
    };
  }, [isLoading, user, refreshFromMe]);

  // Poll only non-Active sessions so an approval or restored access can update
  // the screen. Active sessions are not refreshed by this interval.
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
    setOrganisationBinding(null);
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
      organisations,
      error,
      isActive,
      isPending: status === 'PendingApproval',
      isRejected: status === 'Rejected',
      can: (action: RbacAction) => (isActive ? can(role, action) : false),
      refresh,
      login,
      signOut,
    };
  }, [ready, user, needsOnboarding, session, organisations, error, refresh, login, signOut]);

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
