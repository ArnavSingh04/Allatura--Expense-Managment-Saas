import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';
import type { Contract, Subcontractor } from '@/types/construction';

export type CreateSubcontractorInput = {
  name: string;
  abn?: string;
  trade?: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  licenseNumber?: string;
  licenseExpiresAt?: string | null;
  insuranceExpiresAt?: string | null;
  preferred?: boolean;
  notes?: string;
};

export type UpdateSubcontractorInput = Partial<CreateSubcontractorInput>;

export const subcontractorService = {
  list: (params?: { trade?: string; q?: string; preferredOnly?: boolean }) => {
    const s = new URLSearchParams();
    if (params?.trade) s.set('trade', params.trade);
    if (params?.q) s.set('q', params.q);
    if (params?.preferredOnly) s.set('preferredOnly', 'true');
    const q = s.toString();
    return apiGet<Subcontractor[]>(q ? `subcontractors?${q}` : 'subcontractors');
  },
  get: (id: string) => apiGet<Subcontractor>(`subcontractors/${id}`),
  contracts: (id: string) =>
    apiGet<Contract[]>(`subcontractors/${id}/contracts`),
  compliance: (id: string) =>
    apiGet<{
      licenseExpiresAt: string | null;
      insuranceExpiresAt: string | null;
      licenseExpired: boolean;
      insuranceExpired: boolean;
      licenseDaysToExpiry: number | null;
      insuranceDaysToExpiry: number | null;
    }>(`subcontractors/${id}/compliance`),
  create: (input: CreateSubcontractorInput) =>
    apiPost<Subcontractor>('subcontractors', input),
  update: (id: string, input: UpdateSubcontractorInput) =>
    apiPatch<Subcontractor>(`subcontractors/${id}`, input),
  remove: (id: string) =>
    apiDelete<{ id: string; deleted: boolean }>(`subcontractors/${id}`),
};
