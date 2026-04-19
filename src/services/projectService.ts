import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';
import type {
  Department,
  Project,
  ProjectFinancials,
  ProjectMember,
} from '@/types/construction';
import type { Money } from '@/lib/money';

export type CreateProjectInput = {
  code: string;
  name: string;
  client?: string;
  siteAddress?: string;
  status?: Project['status'];
  startDate: string;
  plannedEndDate: string;
  budget: Money;
  contingency?: Money;
  projectManagerId: string;
  departments?: Array<{
    type: string;
    name: string;
    budget: Money;
    costCode?: string;
  }>;
};

export type UpdateProjectInput = Partial<CreateProjectInput>;

export const projectService = {
  list: (params?: { status?: string; q?: string }) => {
    const search = new URLSearchParams();
    if (params?.status) search.set('status', params.status);
    if (params?.q) search.set('q', params.q);
    const s = search.toString();
    return apiGet<Project[]>(s ? `projects?${s}` : 'projects');
  },
  get: (id: string) => apiGet<Project>(`projects/${id}`),
  create: (input: CreateProjectInput) => apiPost<Project>('projects', input),
  update: (id: string, input: UpdateProjectInput) =>
    apiPatch<Project>(`projects/${id}`, input),
  remove: (id: string) => apiDelete<{ id: string; deleted: boolean }>(`projects/${id}`),
  financials: (id: string) =>
    apiGet<ProjectFinancials | null>(`projects/${id}/financials`),
  recomputeFinancials: (id: string) =>
    apiPost<ProjectFinancials>(`projects/${id}/recompute-financials`),

  // departments
  addDepartment: (
    projectId: string,
    body: { type: string; name: string; budget: Money; costCode?: string },
  ) => apiPost<Department>(`projects/${projectId}/departments`, body),
  updateDepartment: (
    projectId: string,
    deptId: string,
    body: Partial<{
      type: string;
      name: string;
      budget: Money;
      costCode: string;
      percentComplete: number;
    }>,
  ) =>
    apiPatch<Department>(`projects/${projectId}/departments/${deptId}`, body),
  removeDepartment: (projectId: string, deptId: string) =>
    apiDelete<{ id: string; deleted: boolean }>(
      `projects/${projectId}/departments/${deptId}`,
    ),

  // members
  members: (id: string) => apiGet<ProjectMember[]>(`projects/${id}/members`),
  addMember: (
    id: string,
    body: { userId: string; projectRole: ProjectMember['projectRole'] },
  ) => apiPost<ProjectMember>(`projects/${id}/members`, body),
  removeMember: (id: string, userId: string) =>
    apiDelete<{ id: string; deleted: boolean }>(
      `projects/${id}/members/${userId}`,
    ),
};
