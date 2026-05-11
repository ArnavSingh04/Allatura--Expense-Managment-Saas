import { apiGet, apiPost } from '@/lib/api-client';
import type { Money } from '@/lib/money';
import type { PaymentClaim } from '@/types/construction';

export type CreatePaymentClaimInput = {
  contractId: string;
  milestoneId?: string | null;
  claimNumber: string;
  claimDate: string;
  claimedAmount: Money;
  supportingDocumentIds?: string[];
};

export type CertifyPaymentClaimInput = {
  certifiedAmount: Money;
  retentionHeld?: Money;
  decisionNote?: string;
};

export const paymentClaimService = {
  byContract: (contractId: string) =>
    apiGet<PaymentClaim[]>(`contracts/${contractId}/payment-claims`),
  byProject: (projectId: string) =>
    apiGet<PaymentClaim[]>(`projects/${projectId}/payment-claims`),
  get: (id: string) => apiGet<PaymentClaim>(`payment-claims/${id}`),
  submit: (input: CreatePaymentClaimInput) =>
    apiPost<PaymentClaim>('payment-claims', input),
  certify: (id: string, input: CertifyPaymentClaimInput) =>
    apiPost<PaymentClaim>(`payment-claims/${id}/certify`, input),
  reject: (id: string, decisionNote?: string) =>
    apiPost<PaymentClaim>(`payment-claims/${id}/reject`, { decisionNote }),
  markPaid: (id: string, paidAt?: string) =>
    apiPost<PaymentClaim>(`payment-claims/${id}/mark-paid`, { paidAt }),
};
