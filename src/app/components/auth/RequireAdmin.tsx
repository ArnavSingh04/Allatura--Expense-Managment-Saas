'use client';

import { useAuthSession } from '@/contexts/AuthSessionContext';
import { ForbiddenPanel } from './RoleGate';

/**
 * Hard gate for admin-only pages. Renders nothing until the session is ready,
 * then either renders children (admin) or a forbidden panel (non-admin).
 *
 * Use this for whole pages — for individual controls inside a mixed page,
 * use <RoleGate action="..."/>.
 */
export default function RequireAdmin({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { ready, session, isActive } = useAuthSession();
  if (!ready) {
    return null;
  }
  if (!isActive || session?.role !== 'admin') {
    return fallback ?? <ForbiddenPanel />;
  }
  return <>{children}</>;
}
