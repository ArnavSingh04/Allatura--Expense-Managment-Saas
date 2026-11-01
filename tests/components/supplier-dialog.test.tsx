import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SupplierDialog from '../../src/app/components/construction/SupplierDialog';
import { supplierService } from '@/services/supplierService';
import { ApiError } from '@/lib/api-client';
import type { Supplier } from '@/types/construction';

vi.mock('@/services/supplierService', () => ({ supplierService: { create: vi.fn(), update: vi.fn() } }));

const supplier: Supplier = {
  _id: 'qa-supplier-a', tenantId: 'qa-org-a', name: 'Example Timber', category: 'Timber',
  email: 'supplier@example.test', phone: '0400000000', accountNumber: 'QA-42', notes: 'Delivery gate two',
};

function setup(existing?: Supplier) {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  render(<SupplierDialog open onClose={onClose} onSaved={onSaved} existing={existing} />);
  return { user: userEvent.setup(), onClose, onSaved };
}

describe('Supplier dialog', () => {
  beforeEach(() => { vi.mocked(supplierService.create).mockReset(); vi.mocked(supplierService.update).mockReset(); });

  it('requires a non-whitespace name and keeps the dialog available for correction', async () => {
    const f = setup();
    await f.user.type(screen.getByRole('textbox', { name: /^name/i }), ' ');
    await f.user.click(screen.getByRole('button', { name: 'Create' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Name is required.');
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(supplierService.create).not.toHaveBeenCalled();
    expect(f.onClose).not.toHaveBeenCalled();
  });

  it('creates the trimmed supplier and omits blank optional values', async () => {
    vi.mocked(supplierService.create).mockResolvedValue(supplier);
    const f = setup();
    await f.user.type(screen.getByRole('textbox', { name: /^name/i }), ' Example Timber ');
    await f.user.type(screen.getByRole('textbox', { name: 'Category' }), ' Timber ');
    await f.user.type(screen.getByRole('textbox', { name: 'Notes' }), ' ');
    await f.user.click(screen.getByRole('button', { name: 'Create' }));
    expect(supplierService.create).toHaveBeenCalledExactlyOnceWith({
      name: 'Example Timber', category: 'Timber', email: undefined, phone: undefined, accountNumber: undefined, notes: undefined,
    });
    expect(supplierService.update).not.toHaveBeenCalled();
    expect(f.onSaved).toHaveBeenCalledTimes(1);
    expect(f.onClose).toHaveBeenCalledTimes(1);
  });

  it('prefills an existing supplier and sends edits to that supplier ID', async () => {
    vi.mocked(supplierService.update).mockResolvedValue({ ...supplier, notes: 'Call before delivery' });
    const f = setup(supplier);
    expect(screen.getByRole('textbox', { name: /^name/i })).toHaveValue('Example Timber');
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('supplier@example.test');
    await f.user.clear(screen.getByRole('textbox', { name: 'Notes' }));
    await f.user.type(screen.getByRole('textbox', { name: 'Notes' }), ' Call before delivery ');
    await f.user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(supplierService.update).toHaveBeenCalledExactlyOnceWith('qa-supplier-a', {
      name: 'Example Timber', category: 'Timber', email: 'supplier@example.test', phone: '0400000000',
      accountNumber: 'QA-42', notes: 'Call before delivery',
    });
    expect(supplierService.create).not.toHaveBeenCalled();
    expect(f.onSaved).toHaveBeenCalledTimes(1);
  });

  it('disables saving and Cancel while pending without issuing duplicate creates', async () => {
    let resolve!: (value: Supplier) => void;
    vi.mocked(supplierService.create).mockReturnValue(new Promise((done) => { resolve = done; }));
    const f = setup();
    await f.user.type(screen.getByRole('textbox', { name: /^name/i }), 'Example Timber');
    await f.user.dblClick(screen.getByRole('button', { name: 'Create' }));
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Close supplier dialog' })).toBeDisabled();
    await f.user.keyboard('{Escape}');
    expect(supplierService.create).toHaveBeenCalledTimes(1);
    expect(f.onSaved).not.toHaveBeenCalled();
    expect(f.onClose).not.toHaveBeenCalled();
    await act(async () => resolve(supplier));
    expect(f.onSaved).toHaveBeenCalledTimes(1);
    expect(f.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows an API rejection, retains the entered name, then recovers on retry', async () => {
    vi.mocked(supplierService.create).mockRejectedValueOnce(new ApiError('Supplier already exists', 409)).mockResolvedValueOnce(supplier);
    const f = setup();
    await f.user.type(screen.getByRole('textbox', { name: /^name/i }), 'Example Timber');
    await f.user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Supplier already exists');
    expect(screen.getByRole('textbox', { name: /^name/i })).toHaveValue('Example Timber');
    expect(f.onSaved).not.toHaveBeenCalled();
    expect(f.onClose).not.toHaveBeenCalled();
    await f.user.click(screen.getByRole('button', { name: 'Create' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(f.onSaved).toHaveBeenCalledTimes(1);
    expect(f.onClose).toHaveBeenCalledTimes(1);
  });

  it('cancels without creating or updating a supplier', async () => {
    const f = setup();
    await f.user.type(screen.getByRole('textbox', { name: /^name/i }), 'Unsaved supplier');
    await f.user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(f.onClose).toHaveBeenCalledTimes(1);
    expect(f.onSaved).not.toHaveBeenCalled();
    expect(supplierService.create).not.toHaveBeenCalled();
    expect(supplierService.update).not.toHaveBeenCalled();
  });
});
