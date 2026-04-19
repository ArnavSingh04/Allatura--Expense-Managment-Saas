import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';
import type { Money } from '@/lib/money';
import type {
  Variation,
  VariationReason,
  VariationStatus,
} from '@/types/construction';

export type CreateVariationInput = {
  number: string;
  title: string;
  description?: string;
  reason?: VariationReason;
  costImpact: Money;
  timeImpactDays?: number;
};

export type UpdateVariationInput = Partial<CreateVariationInput>;

export const variationService = {
  byContract: (contractId: string) =>
    apiGet<Variation[]>(`contracts/${contractId}/variations`),
  inbox: (params?: { status?: VariationStatus; projectId?: string }) => {
    const s = new URLSearchParams();
    if (params?.status) s.set('status', params.status);
    if (params?.projectId) s.set('projectId', params.projectId);
    const q = s.toString();
    return apiGet<Variation[]>(q ? `variations?${q}` : 'variations');
  },
  get: (id: string) => apiGet<Variation>(`variations/${id}`),
  create: (contractId: string, input: CreateVariationInput) =>
    apiPost<Variation>(`contracts/${contractId}/variations`, input),
  update: (id: string, input: UpdateVariationInput) =>
    apiPatch<Variation>(`variations/${id}`, input),
  submit: (id: string) => apiPost<Variation>(`variations/${id}/submit`),
  approve: (id: string, decisionNote?: string) =>
    apiPost<Variation>(`variations/${id}/approve`, { decisionNote }),
  reject: (id: string, decisionNote?: string) =>
    apiPost<Variation>(`variations/${id}/reject`, { decisionNote }),
  remove: (id: string) =>
    apiDelete<{ id: string; deleted: boolean }>(`variations/${id}`),
};
