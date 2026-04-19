import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';
import type { Money } from '@/lib/money';
import type { Expense, ExpenseKind, ExpenseStatus } from '@/types/construction';

export type CreateExpenseInput = {
  departmentId: string;
  contractId?: string | null;
  subcontractorId?: string | null;
  supplierId?: string | null;
  kind: ExpenseKind;
  status?: ExpenseStatus;
  description: string;
  invoiceNumber?: string;
  incurredOn: string;
  dueOn?: string | null;
  amount: Money;
  tax?: Money;
  documentIds?: string[];
};

export type UpdateExpenseInput = Partial<
  CreateExpenseInput & { paidOn: string | null }
>;

export const expenseService = {
  byProject: (
    projectId: string,
    params?: {
      deptId?: string;
      kind?: string;
      status?: string;
      from?: string;
      to?: string;
      q?: string;
    },
  ) => {
    const s = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([k, v]) => {
      if (v) s.set(k, v as string);
    });
    const q = s.toString();
    return apiGet<Expense[]>(
      q ? `projects/${projectId}/expenses?${q}` : `projects/${projectId}/expenses`,
    );
  },
  costLedger: (projectId: string) =>
    apiGet<{
      currency: string;
      perDepartment: Array<{
        departmentId: string;
        name: string;
        budget: Money;
        committed: Money;
        invoiced: Money;
        paid: Money;
      }>;
    }>(`projects/${projectId}/cost-ledger`),
  get: (id: string) => apiGet<Expense>(`expenses/${id}`),
  create: (projectId: string, input: CreateExpenseInput) =>
    apiPost<Expense>(`projects/${projectId}/expenses`, input),
  update: (id: string, input: UpdateExpenseInput) =>
    apiPatch<Expense>(`expenses/${id}`, input),
  markPaid: (id: string, body: { paidOn?: string; reference?: string }) =>
    apiPost<Expense>(`expenses/${id}/mark-paid`, body),
  remove: (id: string) =>
    apiDelete<{ id: string; deleted: boolean }>(`expenses/${id}`),
};
