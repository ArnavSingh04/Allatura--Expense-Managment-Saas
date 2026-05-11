import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';
import type { Money } from '@/lib/money';
import type { Contract, PaymentMilestone } from '@/types/construction';

export type MilestoneInput = {
  name: string;
  percentOfContract: number;
  amount: Money;
  dueDate?: string | null;
};

export type CreateContractInput = {
  projectId: string;
  departmentId: string;
  subcontractorId: string;
  reference: string;
  scope: string;
  status?: Contract['status'];
  originalValue: Money;
  retentionPercent?: number;
  retentionReleaseHalfAtPC?: number;
  signedAt?: string | null;
  startDate?: string | null;
  plannedCompletionDate?: string | null;
  paymentMilestones?: MilestoneInput[];
};

export type UpdateContractInput = Partial<CreateContractInput>;

export const contractService = {
  byProject: (
    projectId: string,
    params?: { status?: string; deptId?: string; subbieId?: string },
  ) => {
    const s = new URLSearchParams();
    if (params?.status) s.set('status', params.status);
    if (params?.deptId) s.set('deptId', params.deptId);
    if (params?.subbieId) s.set('subbieId', params.subbieId);
    const q = s.toString();
    return apiGet<Contract[]>(
      q ? `projects/${projectId}/contracts?${q}` : `projects/${projectId}/contracts`,
    );
  },
  get: (id: string) => apiGet<Contract>(`contracts/${id}`),
  create: (projectId: string, input: CreateContractInput) =>
    apiPost<Contract>(`projects/${projectId}/contracts`, input),
  update: (id: string, input: UpdateContractInput) =>
    apiPatch<Contract>(`contracts/${id}`, input),
  remove: (id: string) =>
    apiDelete<{ id: string; deleted: boolean }>(`contracts/${id}`),

  addMilestone: (id: string, input: MilestoneInput) =>
    apiPost<PaymentMilestone>(`contracts/${id}/milestones`, input),
  updateMilestone: (
    id: string,
    milestoneId: string,
    input: Partial<MilestoneInput & { status: PaymentMilestone['status'] }>,
  ) =>
    apiPatch<PaymentMilestone>(
      `contracts/${id}/milestones/${milestoneId}`,
      input,
    ),
  removeMilestone: (id: string, milestoneId: string) =>
    apiDelete<{ id: string; deleted: boolean }>(
      `contracts/${id}/milestones/${milestoneId}`,
    ),
};
