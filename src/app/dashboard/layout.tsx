import { Suspense } from 'react';
import DashboardAuthGate from '@/components/auth/DashboardAuthGate';
import DashboardShell from '@/components/dashboard/DashboardShell';

// DashboardShell must wrap DashboardAuthGate (not the other way around) so the
// outer flex wrapper, sidebar, and <main> are present on the server, during
// hydration, and after `ready` flips. AuthGate then only swaps the inner
// content. Inverting this caused a hydration mismatch under Next.js 16 / React
// 19: the SSR rendered the gate's centered spinner while the hydrated tree
// rendered the full shell, producing a span-vs-main diff inside <main>.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell>
      <DashboardAuthGate>
        <Suspense>{children}</Suspense>
      </DashboardAuthGate>
    </DashboardShell>
  );
}
