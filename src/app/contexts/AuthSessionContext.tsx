'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { PLUTUS_AUTH_UPDATED_EVENT } from '@/lib/auth-events';
import {
  ApiHelper,
  REQUEST_TYPE,
  clearAuthToken,
  getStoredToken,
} from '@/lib/api-helper';
import {
  decodeAccessTokenPayload,
  getTenantIdFromClaims,
} from '@/lib/jwt-payload';
import { can, normalizeRole, type RbacAction, type UserRole } from '@/lib/rbac';

export type UserStatus = 'PendingApproval' | 'Active' | 'Rejected';

export type AuthSession = {
  role: UserRole;
  status: UserStatus;
  tenantId?: string;
  email?: string;
  sub?: string;
  organisationName?: string;
};

type AuthSessionContextValue = {
  /** False until the first synchronous read (and the optional /auth/me) completes. */
  ready: boolean;
  session: AuthSession | null;
  isActive: boolean;
  isPending: boolean;
  isRejected: boolean;
  /** Always returns false unless `isActive` — pending users have zero capabilities. */
  can: (action: RbacAction) => boolean;
  /** Re-decode the stored JWT and (in the background) refetch /auth/me. */
  refresh: () => void;
  signOut: () => void;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

function normalizeStatus(value: unknown): UserStatus {
  if (
    value === 'Active' ||
    value === 'PendingApproval' ||
    value === 'Rejected'
  ) {
    return value;
  }
  // Conservative default: treat unknown as pending so the gate denies access.
  return 'PendingApproval';
}

/** Synchronous read from localStorage so the first render isn't blocked on a network call. */
function readSessionFromStorage(): AuthSession | null {
  const token = getStoredToken();
  if (!token) {
    return null;
  }
  const claims = decodeAccessTokenPayload(token);
  if (!claims) {
    // Token present but unparseable. Treat as pending to deny silently;
    // /auth/me will resolve the truth shortly.
    return { role: 'viewer', status: 'PendingApproval' };
  }
  return {
    role: normalizeRole(claims.role),
    status: normalizeStatus(claims.status),
    tenantId: getTenantIdFromClaims(claims),
    email: claims.email,
    sub: claims.sub,
  };
}

type MeResponse = {
  failed?: boolean;
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  status?: string;
  tenantId?: string;
  organisationName?: string;
};

async function fetchMe(): Promise<MeResponse | null> {
  const api = new ApiHelper('auth/me');
  api.includeKey = false;
  api.type = REQUEST_TYPE.GET;
  const res = (await api.fetchRequest()) as MeResponse;
  if (res?.failed) {
    return null;
  }
  return res;
}

export function AuthSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const inFlightMeRef = useRef<Promise<void> | null>(null);

  const refreshFromMe = useCallback(async () => {
    if (inFlightMeRef.current) {
      return inFlightMeRef.current;
    }
    if (!getStoredToken()) {
      return;
    }
    const promise = (async () => {
      const me = await fetchMe();
      if (!me) {
        return;
      }
      setSession((prev) => ({
        sub: me.id ?? prev?.sub,
        email: me.email ?? prev?.email,
        role: normalizeRole(me.role ?? prev?.role),
        status: normalizeStatus(me.status ?? prev?.status),
        tenantId: me.tenantId ?? prev?.tenantId,
        organisationName: me.organisationName ?? prev?.organisationName,
      }));
    })().finally(() => {
      inFlightMeRef.current = null;
    });
    inFlightMeRef.current = promise;
    return promise;
  }, []);

  const refresh = useCallback(() => {
    setSession(readSessionFromStorage());
    void refreshFromMe();
  }, [refreshFromMe]);

  useLayoutEffect(() => {
    setSession(readSessionFromStorage());
    setReady(true);
    void refreshFromMe();
  }, [refreshFromMe]);

  // Re-read the token whenever auth changes (login/logout in the same tab,
  // or another tab via the storage event).
  useLayoutEffect(() => {
    const onUpdate = () => {
      setSession(readSessionFromStorage());
      void refreshFromMe();
    };
    window.addEventListener(PLUTUS_AUTH_UPDATED_EVENT, onUpdate);
    window.addEventListener('storage', onUpdate);
    return () => {
      window.removeEventListener(PLUTUS_AUTH_UPDATED_EVENT, onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
  }, [refreshFromMe]);

  // Keep pending users updated automatically: poll /auth/me every 15s while
  // the tab is visible, so approval flips the screen without a manual reload.
  useEffect(() => {
    if (!ready || !session || session.status === 'Active') {
      return;
    }
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
  }, [ready, session, refreshFromMe]);

  const signOut = useCallback(() => {
    // Best-effort server notification (current backend is stateless).
    void (async () => {
      try {
        const api = new ApiHelper('auth/logout');
        api.includeKey = false;
        api.type = REQUEST_TYPE.POST;
        await api.fetchRequest();
      } catch {
        /* ignore */
      }
    })();
    clearAuthToken();
    setSession(null);
    if (typeof window !== 'undefined') {
      window.location.assign('/login');
    }
  }, []);

  const value = useMemo((): AuthSessionContextValue => {
    const status = session?.status;
    const isActive = status === 'Active';
    const isPending = status === 'PendingApproval';
    const isRejected = status === 'Rejected';
    const role = session?.role ?? 'viewer';
    return {
      ready,
      session,
      isActive,
      isPending,
      isRejected,
      can: (action: RbacAction) => (isActive ? can(role, action) : false),
      refresh,
      signOut,
    };
  }, [ready, session, refresh, signOut]);

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
