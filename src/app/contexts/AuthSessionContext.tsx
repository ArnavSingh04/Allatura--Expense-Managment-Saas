'use client';

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { PLUTUS_AUTH_UPDATED_EVENT } from '@/lib/auth-events';
import { getStoredToken } from '@/lib/api-helper';
import { decodeAccessTokenPayload, getTenantIdFromClaims } from '@/lib/jwt-payload';
import { can, normalizeRole, type RbacAction, type UserRole } from '@/lib/rbac';

export type AuthSession = {
  role: UserRole;
  tenantId?: string;
  email?: string;
  sub?: string;
};

type AuthSessionContextValue = {
  ready: boolean;
  session: AuthSession | null;
  can: (action: RbacAction) => boolean;
  refresh: () => void;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

function readSessionFromStorage(): AuthSession | null {
  const token = getStoredToken();
  if (!token) {
    return null;
  }
  const claims = decodeAccessTokenPayload(token);
  if (!claims) {
    return { role: normalizeRole(undefined) };
  }
  return {
    role: normalizeRole(claims.role),
    tenantId: getTenantIdFromClaims(claims),
    email: claims.email,
    sub: claims.sub,
  };
}

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);

  const refresh = useCallback(() => {
    setSession(readSessionFromStorage());
  }, []);

  useLayoutEffect(() => {
    setSession(readSessionFromStorage());
    setReady(true);
  }, []);

  useLayoutEffect(() => {
    const onUpdate = () => {
      setSession(readSessionFromStorage());
    };
    window.addEventListener(PLUTUS_AUTH_UPDATED_EVENT, onUpdate);
    window.addEventListener('storage', onUpdate);
    return () => {
      window.removeEventListener(PLUTUS_AUTH_UPDATED_EVENT, onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
  }, []);

  const value = useMemo((): AuthSessionContextValue => {
    const effectiveRole: UserRole = session?.role ?? 'viewer';
    return {
      ready,
      session,
      can: (action: RbacAction) => can(effectiveRole, action),
      refresh,
    };
  }, [ready, session, refresh]);

  return (
    <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>
  );
}

export function useAuthSession(): AuthSessionContextValue {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) {
    throw new Error('useAuthSession must be used within AuthSessionProvider');
  }
  return ctx;
}
