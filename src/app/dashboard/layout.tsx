import DashboardShell from '@/components/dashboard/DashboardShell';
import { Suspense } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell>
      <Suspense>{children}</Suspense>
    </DashboardShell>
  );
}
