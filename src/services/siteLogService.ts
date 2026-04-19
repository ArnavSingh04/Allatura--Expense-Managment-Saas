import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';
import type { CrewLog, SiteLog } from '@/types/construction';

export type CreateSiteLogInput = {
  logDate: string;
  weather?: string;
  temperatureC?: number | null;
  crewOnSite?: CrewLog[];
  workCompleted?: string;
  issues?: string;
  safetyNotes?: string;
  photoIds?: string[];
};

export const siteLogService = {
  list: (projectId: string) =>
    apiGet<SiteLog[]>(`projects/${projectId}/site-logs`),
  get: (id: string) => apiGet<SiteLog>(`site-logs/${id}`),
  create: (projectId: string, input: CreateSiteLogInput) =>
    apiPost<SiteLog>(`projects/${projectId}/site-logs`, input),
  update: (id: string, input: Partial<CreateSiteLogInput>) =>
    apiPatch<SiteLog>(`site-logs/${id}`, input),
  remove: (id: string) =>
    apiDelete<{ id: string; deleted: boolean }>(`site-logs/${id}`),
};
