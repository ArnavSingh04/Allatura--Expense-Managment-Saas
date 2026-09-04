import { apiGet, apiPost } from '@/lib/api-client';

/**
 * Billing is owned entirely by the backend. The frontend holds NO Stripe keys
 * and never talks to Stripe directly: it asks the API to create a Checkout
 * Session (server-side) and redirects the browser to the returned URL. Webhooks
 * are handled solely by the backend (POST {BACKEND}/v1/billing/webhook).
 *
 * Mirrors plutus-be/src/billing/plans.config.ts + BillingService.
 */

export type PlanTier = 'free' | 'pro' | 'enterprise';
export type PaidTier = 'pro' | 'enterprise';

export type BillingSnapshot = {
  plan: PlanTier;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  limits: { projects: number | null; users: number | null };
  usage: { projects: number; users: number };
  features: Record<string, boolean>;
  billingMode: 'mock' | 'stripe';
};

export type PlanFeatureKey =
  | 'variations'
  | 'departmentExpenses'
  | 'analytics'
  | 'auditLog'
  | 'prioritySupport';

/** One tier as returned by the public GET /plans catalog (mirrors the backend). */
export type PlanCatalogEntry = {
  tier: PlanTier;
  name: string;
  monthlyPriceCents: number;
  trialDays: number;
  limits: { projects: number | null; users: number | null };
  features: Record<PlanFeatureKey, boolean>;
  stripePriceEnvKey: string | null;
};

export const billingService = {
  /** Current org plan / usage / limits. Any authenticated member may read. */
  me: () => apiGet<BillingSnapshot>('billing/me'),

  /**
   * Start an upgrade. Returns a URL to redirect to:
   *  - stripe mode → Stripe hosted Checkout
   *  - mock mode   → /dashboard/billing/mock-success?plan=...
   * Requires an owner/admin (enforced server-side).
   */
  checkout: (plan: PaidTier) =>
    apiPost<{ url: string | null }>('billing/checkout', { plan }),

  /** Stripe Billing Portal session (null in mock mode). Owner/admin only. */
  portal: () => apiPost<{ url: string | null }>('billing/portal', {}),

  /**
   * Schedule cancellation at the end of the current billing period. The org
   * keeps paid features until `currentPeriodEnd`. Owner/admin only.
   */
  cancel: () =>
    apiPost<{ cancelAtPeriodEnd: boolean }>('billing/cancel', {}),

  /** Undo a pending period-end cancellation. Owner/admin only. */
  resume: () =>
    apiPost<{ cancelAtPeriodEnd: boolean }>('billing/resume', {}),

  /** Public catalog of all plans (tiers, limits, features) for comparison. */
  plans: () => apiGet<PlanCatalogEntry[]>('plans'),

  /** Mock-mode only: simulate a successful checkout for the current org. */
  mockSimulateSuccess: (plan: PaidTier) =>
    apiPost<void>('billing/mock/simulate-success', { plan }),
};
