import { apiGet } from '@/lib/api-client';
import type { CompanyOverview, ProjectOverview } from '@/types/construction';

export const dashboardService = {
  company: () => apiGet<CompanyOverview>('dashboards/company'),
  project: (projectId: string) =>
    apiGet<ProjectOverview>(`dashboards/projects/${projectId}`),
};
