import { Suspense } from 'react';
import DashboardAuthGate from '@/components/auth/DashboardAuthGate';
import DashboardShell from '@/components/dashboard/DashboardShell';

// Keep the shell outside the auth gate so the sidebar and <main> stay in place
// during hydration and session loading. The gate replaces only the page content.
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
