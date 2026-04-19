import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';
import type { Supplier } from '@/types/construction';

export type CreateSupplierInput = {
  name: string;
  category?: string;
  email?: string;
  phone?: string;
  accountNumber?: string;
  notes?: string;
};
export type UpdateSupplierInput = Partial<CreateSupplierInput>;

export const supplierService = {
  list: (params?: { category?: string; q?: string }) => {
    const s = new URLSearchParams();
    if (params?.category) s.set('category', params.category);
    if (params?.q) s.set('q', params.q);
    const q = s.toString();
    return apiGet<Supplier[]>(q ? `suppliers?${q}` : 'suppliers');
  },
  get: (id: string) => apiGet<Supplier>(`suppliers/${id}`),
  create: (input: CreateSupplierInput) => apiPost<Supplier>('suppliers', input),
  update: (id: string, input: UpdateSupplierInput) =>
    apiPatch<Supplier>(`suppliers/${id}`, input),
  remove: (id: string) =>
    apiDelete<{ id: string; deleted: boolean }>(`suppliers/${id}`),
};
