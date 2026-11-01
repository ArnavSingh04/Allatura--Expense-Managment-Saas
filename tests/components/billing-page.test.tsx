import { act, render, screen, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BillingPage from '../../src/app/dashboard/settings/billing/page';
import { ApiError } from '@/lib/api-client';
import { billingService, type BillingSnapshot, type PlanCatalogEntry, type PlanTier } from '@/services/billingService';

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock('@/services/billingService', () => ({ billingService: {
  me: vi.fn(), plans: vi.fn(), checkout: vi.fn(), portal: vi.fn(), cancel: vi.fn(), resume: vi.fn(),
} }));

function snapshot(plan: PlanTier = 'free'): BillingSnapshot {
  return {
    plan, subscriptionStatus: 'active', currentPeriodEnd: null, trialEndsAt: null, cancelAtPeriodEnd: false,
    limits: { projects: plan === 'free' ? 2 : null, users: plan === 'free' ? 3 : 15 },
    usage: { projects: 1, users: 2 }, features: { analytics: true }, billingMode: 'stripe',
    hasStripeCustomer: plan !== 'free', hasStripeSubscription: plan !== 'free',
  };
}

const catalog: PlanCatalogEntry[] = [
  { tier: 'free', name: 'Free', monthlyPriceCents: 0, trialDays: 0, stripePriceEnvKey: null,
    limits: { projects: 2, users: 3 }, features: {
      variations: false, departmentExpenses: false, analytics: true, auditLog: false, prioritySupport: false,
    } },
  { tier: 'pro', name: 'Pro', monthlyPriceCents: 4900, trialDays: 0, stripePriceEnvKey: null,
    limits: { projects: null, users: 15 }, features: {
      variations: true, departmentExpenses: true, analytics: true, auditLog: false, prioritySupport: false,
    } },
  { tier: 'enterprise', name: 'Enterprise', monthlyPriceCents: 19900, trialDays: 0, stripePriceEnvKey: null,
    limits: { projects: null, users: null }, features: {
      variations: true, departmentExpenses: true, analytics: true, auditLog: true, prioritySupport: true,
    } },
];

describe('Billing plan presentation and mutation feedback (mocked service, no payments)', () => {
  beforeEach(() => {
    vi.mocked(billingService.me).mockReset();
    vi.mocked(billingService.plans).mockReset().mockResolvedValue(catalog);
    vi.mocked(billingService.checkout).mockReset();
    vi.mocked(billingService.portal).mockReset();
    vi.mocked(billingService.cancel).mockReset();
    vi.mocked(billingService.resume).mockReset();
  });

  it.each([
    ['free', 'Free', true, true], ['pro', 'Pro', false, true], ['enterprise', 'Enterprise', false, false],
  ] as const)('shows the %s tier and only relevant upgrade actions', async (tier, label, pro, enterprise) => {
    vi.mocked(billingService.me).mockResolvedValue(snapshot(tier));
    render(<BillingPage />);
    expect(await screen.findByRole('heading', { name: `${label} plan` })).toBeVisible();
    expect(screen.getByText(tier === 'free' ? 'Projects: 1 / 2' : 'Projects: 1 / Unlimited')).toBeVisible();
    if (pro) expect(screen.getByRole('button', { name: 'Upgrade to Pro' })).toBeEnabled();
    else expect(screen.queryByRole('button', { name: 'Upgrade to Pro' })).not.toBeInTheDocument();
    if (enterprise) expect(screen.getByRole('button', { name: 'Upgrade to Enterprise' })).toBeEnabled();
    else expect(screen.queryByRole('button', { name: 'Upgrade to Enterprise' })).not.toBeInTheDocument();
    const auditRow = screen.getByRole('row', { name: /Audit log/ });
    expect(within(auditRow).getAllByLabelText('Not included')).toHaveLength(2);
    expect(within(auditRow).getAllByLabelText('Included')).toHaveLength(1);
  });

  it('prevents duplicate checkout while pending and recovers from a denied API request', async () => {
    vi.mocked(billingService.me).mockResolvedValue(snapshot());
    let reject!: (error: Error) => void;
    vi.mocked(billingService.checkout).mockReturnValueOnce(new Promise((_resolve, fail) => { reject = fail; }))
      .mockResolvedValueOnce({ url: null });
    render(<BillingPage />);
    const user = userEvent.setup();
    await user.dblClick(await screen.findByRole('button', { name: 'Upgrade to Pro' }));
    expect(screen.getByRole('button', { name: /redirecting/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Upgrade to Enterprise' })).toBeDisabled();
    expect(billingService.checkout).toHaveBeenCalledExactlyOnceWith('pro');
    await act(async () => reject(new ApiError('forbidden_role', 403)));
    expect(await screen.findByRole('alert')).toHaveTextContent('Only an organisation owner or admin can change the plan.');
    expect(screen.getByRole('heading', { name: 'Free plan' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Upgrade to Pro' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not start checkout. Please try again.');
    expect(billingService.checkout).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: 'Upgrade to Pro' })).toBeEnabled();
  });

  it('keeps cancellation reviewable, sends it only after confirmation and refreshes the visible plan', async () => {
    const paid = { ...snapshot('pro'), hasStripeSubscription: false, hasStripeCustomer: false };
    vi.mocked(billingService.me).mockResolvedValueOnce(paid).mockResolvedValueOnce(snapshot());
    vi.mocked(billingService.cancel).mockResolvedValue({ cancelAtPeriodEnd: false, cancelledNow: true });
    render(<BillingPage />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Switch to Free' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/switches you to the Free plan immediately/i)).toBeVisible();
    expect(billingService.cancel).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: 'Keep plan' }));
    await waitForElementToBeRemoved(dialog);
    expect(billingService.cancel).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Switch to Free' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Switch to Free' }));
    expect(await screen.findByRole('heading', { name: 'Free plan' })).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('Your plan is now Free.');
    expect(billingService.cancel).toHaveBeenCalledTimes(1);
    expect(billingService.me).toHaveBeenCalledTimes(2);
  });

  it('replaces initial loading with a visible service error and no fabricated plan', async () => {
    let reject!: (error: Error) => void;
    vi.mocked(billingService.me).mockReturnValue(new Promise((_resolve, fail) => { reject = fail; }));
    render(<BillingPage />);
    expect(screen.getByRole('progressbar')).toBeVisible();
    await act(async () => reject(new ApiError('Synthetic billing unavailable', 503)));
    expect(screen.getByRole('alert')).toHaveTextContent('Synthetic billing unavailable');
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Upgrade to Pro' })).not.toBeInTheDocument();
  });
});
