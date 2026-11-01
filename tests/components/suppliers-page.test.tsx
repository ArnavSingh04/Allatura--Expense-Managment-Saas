import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SuppliersPage from '../../src/app/dashboard/suppliers/page';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { can, type UserRole } from '@/lib/rbac';
import { authFetcher } from '@/lib/swr-fetcher';
import type { Supplier } from '@/types/construction';

vi.mock('@/contexts/AuthSessionContext', () => ({ useAuthSession: vi.fn() }));
vi.mock('@/lib/swr-fetcher', () => ({ authFetcher: vi.fn() }));
vi.mock('@/services/supplierService', () => ({ supplierService: { create: vi.fn(), update: vi.fn(), remove: vi.fn() } }));

const supplier: Supplier = {
  _id: 'qa-supplier-a', tenantId: 'qa-org-a', name: 'Example Timber', category: 'Timber',
  email: 'supplier@example.test', phone: '0400000000', accountNumber: 'QA-42', notes: '',
};

function setup(role: UserRole = 'owner') {
  vi.mocked(useAuthSession).mockReturnValue({ can: (action) => can(role, action) } as ReturnType<typeof useAuthSession>);
  render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, shouldRetryOnError: false,
    revalidateOnFocus: false, revalidateOnReconnect: false }}><SuppliersPage /></SWRConfig>);
  return userEvent.setup();
}

describe('Supplier list with real SWR and a synthetic service boundary', () => {
  beforeEach(() => { vi.mocked(authFetcher).mockReset(); vi.mocked(useAuthSession).mockReset(); });

  it('distinguishes a pending request from an empty list and then renders returned supplier data', async () => {
    let resolve!: (value: Supplier[]) => void;
    vi.mocked(authFetcher).mockReturnValue(new Promise((done) => { resolve = done; }));
    setup();
    expect(screen.getByRole('progressbar')).toBeVisible();
    expect(screen.queryByText('No suppliers yet')).not.toBeInTheDocument();
    await act(async () => resolve([supplier]));
    expect(await screen.findByRole('cell', { name: 'Example Timber' })).toBeVisible();
    expect(screen.getByRole('cell', { name: 'QA-42' })).toBeVisible();
    expect(screen.getByText('supplier@example.test')).toBeVisible();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows the empty state and lets an owner open the actual creation dialog', async () => {
    vi.mocked(authFetcher).mockResolvedValue([]);
    const user = setup();
    expect(await screen.findByText('No suppliers yet')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Add supplier' }));
    expect(await screen.findByRole('dialog')).toBeVisible();
    expect(screen.getByRole('textbox', { name: /^name/i })).toHaveValue('');
  });

  it('shows an API error instead of falsely presenting an empty result', async () => {
    vi.mocked(authFetcher).mockRejectedValue(new Error('Synthetic supplier service unavailable'));
    setup();
    expect(await screen.findByRole('alert')).toHaveTextContent('Synthetic supplier service unavailable');
    expect(screen.queryByText('No suppliers yet')).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('hides create/edit/delete controls for a role denied supplier editing', async () => {
    vi.mocked(authFetcher).mockResolvedValue([supplier]);
    setup('general');
    expect(await screen.findByRole('cell', { name: 'Example Timber' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'New supplier' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('requests the encoded search value and displays the filtered result', async () => {
    vi.mocked(authFetcher).mockImplementation(async (path: string) => path.includes('q=Steel')
      ? [{ ...supplier, _id: 'qa-supplier-b', name: 'Example Steel', category: 'Steel' }] : [supplier]);
    const user = setup('finance');
    expect(await screen.findByRole('cell', { name: 'Example Timber' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'New supplier' })).toBeVisible();
    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'Steel');
    expect(await screen.findByRole('cell', { name: 'Example Steel' })).toBeVisible();
    await waitFor(() => expect(authFetcher).toHaveBeenCalledWith('suppliers?q=Steel'));
    expect(screen.queryByRole('cell', { name: 'Example Timber' })).not.toBeInTheDocument();
  });
});
