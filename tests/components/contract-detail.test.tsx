import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ContractDetailPage from '../../src/app/dashboard/projects/[id]/contracts/[contractId]/page';
import { authFetcher } from '@/lib/swr-fetcher';
import type { Contract } from '@/types/construction';

vi.mock('next/navigation', () => ({ useParams: () => ({ id: 'qa-project-a', contractId: 'qa-contract-a' }) }));
vi.mock('@/lib/swr-fetcher', () => ({ authFetcher: vi.fn() }));
const contract: Contract = {
  _id: 'qa-contract-a', projectId: 'qa-project-a', tenantId: 'qa-org-a', departmentId: 'qa-dept-a', subcontractorId: 'qa-sub-a',
  reference: 'QA-DETAIL-001', scope: 'Electrical fitout', status: 'Active', originalValue: { currency: 'AUD', amount: 10000 },
  currentValue: { currency: 'AUD', amount: 12500 }, retentionPercent: 5, retentionReleaseHalfAtPC: 50,
  signedAt: null, startDate: null, plannedCompletionDate: null,
  paymentMilestones: [{ _id: 'qa-mile-a', name: 'Handover', percentOfContract: 100, amount: { currency: 'AUD', amount: 12500 }, dueDate: null, status: 'Pending' }],
};
function setup() {
  render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false, revalidateOnFocus: false }}><ContractDetailPage /></SWRConfig>);
}

describe('contract detail route data and recovery', () => {
  beforeEach(() => vi.mocked(authFetcher).mockReset());
  it('loads the selected contract and shows its actual scope and milestone', async () => {
    vi.mocked(authFetcher).mockResolvedValue(contract);
    setup();
    expect(await screen.findByRole('heading', { name: 'QA-DETAIL-001' })).toBeVisible();
    expect(authFetcher).toHaveBeenCalledWith('contracts/qa-contract-a');
    expect(screen.getByText('Electrical fitout')).toBeVisible();
    expect(screen.getByRole('cell', { name: 'Handover' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Back to contracts' })).toHaveAttribute('href', '/dashboard/projects/qa-project-a/contracts');
  });
  it('does not render a returned contract belonging to another project', async () => {
    vi.mocked(authFetcher).mockResolvedValue({ ...contract, projectId: 'qa-project-b' });
    setup();
    expect(await screen.findByRole('alert')).toHaveTextContent('not available in this project');
    expect(screen.queryByText('Electrical fitout')).not.toBeInTheDocument();
  });
  it('shows a retryable error and recovers with the requested record', async () => {
    vi.mocked(authFetcher).mockRejectedValueOnce(new Error('Synthetic unavailable')).mockResolvedValue(contract);
    setup();
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load this contract');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'QA-DETAIL-001' })).toBeVisible();
    expect(authFetcher).toHaveBeenCalledTimes(2);
  });
});
