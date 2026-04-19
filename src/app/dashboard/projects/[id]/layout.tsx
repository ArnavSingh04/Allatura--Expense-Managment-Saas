'use client';

import { Box, Stack, Tab, Tabs, Typography } from '@mui/material';
import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import useSWR from 'swr';
import StatusChip from '@/components/construction/StatusChip';
import { authFetcher } from '@/lib/swr-fetcher';
import { keys } from '@/lib/swr-keys';
import type { Project } from '@/types/construction';

const tabs = [
  { key: 'overview', label: 'Overview', segment: '' },
  { key: 'contracts', label: 'Contracts', segment: 'contracts' },
  { key: 'variations', label: 'Variations', segment: 'variations' },
  { key: 'expenses', label: 'Expenses', segment: 'expenses' },
  { key: 'claims', label: 'Payment claims', segment: 'claims' },
  { key: 'progress', label: 'Progress', segment: 'progress' },
  { key: 'sitelogs', label: 'Site log', segment: 'sitelogs' },
  { key: 'documents', label: 'Documents', segment: 'documents' },
  { key: 'team', label: 'Team', segment: 'team' },
];

export default function ProjectDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const { data: project } = useSWR<Project>(
    projectId ? keys.project(projectId) : null,
    authFetcher,
  );

  const activeTab = useMemo(() => {
    const base = `/dashboard/projects/${projectId}`;
    if (pathname === base || pathname === `${base}/`) return 'overview';
    const seg = pathname.replace(`${base}/`, '').split('/')[0];
    return tabs.find((t) => t.segment === seg)?.key ?? 'overview';
  }, [pathname, projectId]);

  useEffect(() => {
    if (!projectId) router.replace('/dashboard/projects');
  }, [projectId, router]);

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography
            component={Link}
            href="/dashboard/projects"
            variant="caption"
            color="text.secondary"
            sx={{ textDecoration: 'none' }}
          >
            ← All projects
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 0.5 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontSize: { xs: '1.5rem', md: '1.75rem' },
                fontWeight: 600,
                letterSpacing: '-0.03em',
              }}
            >
              {project ? `${project.code} — ${project.name}` : 'Loading…'}
            </Typography>
            {project && <StatusChip status={project.status} />}
          </Stack>
          {project && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {project.client || 'No client'} · {project.siteAddress || 'No address'} · ends{' '}
              {new Date(project.plannedEndDate).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      </Stack>

      <Tabs
        value={activeTab}
        onChange={(_, k) => {
          const t = tabs.find((tab) => tab.key === k);
          if (!t) return;
          const base = `/dashboard/projects/${projectId}`;
          router.push(t.segment ? `${base}/${t.segment}` : base);
        }}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: 2.5,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
        }}
      >
        {tabs.map((t) => (
          <Tab key={t.key} value={t.key} label={t.label} />
        ))}
      </Tabs>

      {children}
    </Box>
  );
}
