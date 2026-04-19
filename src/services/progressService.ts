import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';
import type { Milestone, ProgressUpdate } from '@/types/construction';

export const progressService = {
  list: (projectId: string) =>
    apiGet<ProgressUpdate[]>(`projects/${projectId}/progress`),
  add: (
    projectId: string,
    body: { departmentId: string; percentComplete: number; note?: string },
  ) => apiPost<ProgressUpdate>(`projects/${projectId}/progress`, body),

  milestones: (projectId: string) =>
    apiGet<Milestone[]>(`projects/${projectId}/milestones`),
  createMilestone: (
    projectId: string,
    body: {
      name: string;
      description?: string;
      plannedDate: string;
      departmentId?: string | null;
    },
  ) => apiPost<Milestone>(`projects/${projectId}/milestones`, body),
  updateMilestone: (id: string, body: Partial<Milestone>) =>
    apiPatch<Milestone>(`milestones/${id}`, body),
  removeMilestone: (id: string) =>
    apiDelete<{ id: string; deleted: boolean }>(`milestones/${id}`),
};
