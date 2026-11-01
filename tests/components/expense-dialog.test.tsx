import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ExpenseDialog from '../../src/app/components/construction/ExpenseDialog';
import { expenseService } from '@/services/expenseService';
import { ApiError } from '@/lib/api-client';
import type { Expense, Project } from '@/types/construction';

vi.mock('@/services/expenseService', () => ({ expenseService: { create: vi.fn() } }));

const project: Project = {
  _id: 'qa-project-a', tenantId: 'qa-org-a', code: 'QA-01', name: 'Example build', client: 'Example client',
  siteAddress: 'Synthetic test site', status: 'Active', startDate: '2030-01-01', plannedEndDate: '2030-12-31',
  actualEndDate: null, budget: { amount: 1_000_000, currency: 'AUD' }, contingency: { amount: 0, currency: 'AUD' },
  projectManagerId: 'qa-owner', departments: [{ _id: 'qa-dept-a', type: 'Plumbing', name: 'Plumbing',
    budget: { amount: 100_000, currency: 'AUD' }, percentComplete: 0, costCode: 'QA-PLUMB' }],
};
const expense: Expense = {
  _id: 'qa-expense-a', tenantId: 'qa-org-a', projectId: project._id, departmentId: 'qa-dept-a',
  contractId: null, subcontractorId: null, supplierId: null, kind: 'Material', status: 'Committed',
  description: 'Copper pipe', invoiceNumber: '', incurredOn: '2030-01-15', dueOn: null, paidOn: null,
  amount: { amount: 12345, currency: 'AUD' }, tax: { amount: 1235, currency: 'AUD' }, documentIds: [], createdBy: 'qa-finance',
};

function setup() {
  const onClose = vi.fn();
  const onCreated = vi.fn();
  render(<ExpenseDialog open onClose={onClose} onCreated={onCreated} project={project} contracts={[]} subbies={[]} suppliers={[]} />);
  return { user: userEvent.setup(), onClose, onCreated };
}

describe('Expense entry', () => {
  beforeEach(() => vi.mocked(expenseService.create).mockReset());

  it('requires description and amount before submitting', async () => {
    const f = setup();
    await f.user.click(screen.getByRole('button', { name: 'Save expense' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Department, description and amount are required.');
    expect(expenseService.create).not.toHaveBeenCalled();
    expect(f.onClose).not.toHaveBeenCalled();
  });

  it('converts entered major amounts into exact cents and reports the created record', async () => {
    vi.mocked(expenseService.create).mockResolvedValue(expense);
    const f = setup();
    await f.user.type(screen.getByRole('textbox', { name: /^description/i }), ' Copper pipe ');
    await f.user.type(screen.getByRole('spinbutton', { name: /amount \(aud\)/i }), '123.45');
    await f.user.type(screen.getByRole('spinbutton', { name: /tax \(aud\)/i }), '12.35');
    await f.user.clear(screen.getByLabelText('Incurred'));
    await f.user.type(screen.getByLabelText('Incurred'), '2030-01-15');
    await f.user.click(screen.getByRole('button', { name: 'Save expense' }));
    expect(expenseService.create).toHaveBeenCalledExactlyOnceWith('qa-project-a', {
      departmentId: 'qa-dept-a', kind: 'Material', status: 'Committed', contractId: null, subcontractorId: null,
      supplierId: null, description: 'Copper pipe', invoiceNumber: undefined, incurredOn: '2030-01-15', dueOn: null,
      amount: { amount: 12345, currency: 'AUD' }, tax: { amount: 1235, currency: 'AUD' },
    });
    expect(f.onCreated).toHaveBeenCalledExactlyOnceWith(expense);
    expect(f.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close or duplicate the mutation while the API is pending', async () => {
    let resolve!: (value: Expense) => void;
    vi.mocked(expenseService.create).mockReturnValue(new Promise((done) => { resolve = done; }));
    const f = setup();
    await f.user.type(screen.getByRole('textbox', { name: /^description/i }), 'Copper pipe');
    await f.user.type(screen.getByRole('spinbutton', { name: /amount \(aud\)/i }), '25');
    await f.user.dblClick(screen.getByRole('button', { name: 'Save expense' }));
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Close expense dialog' })).toBeDisabled();
    await f.user.keyboard('{Escape}');
    expect(expenseService.create).toHaveBeenCalledTimes(1);
    expect(f.onClose).not.toHaveBeenCalled();
    await act(async () => resolve(expense));
    expect(f.onCreated).toHaveBeenCalledExactlyOnceWith(expense);
  });

  it('retains data after an API rejection and sends the corrected amount on retry', async () => {
    vi.mocked(expenseService.create).mockRejectedValueOnce(new ApiError('amount_required', 400)).mockResolvedValueOnce(expense);
    const f = setup();
    await f.user.type(screen.getByRole('textbox', { name: /^description/i }), 'Copper pipe');
    await f.user.type(screen.getByRole('spinbutton', { name: /amount \(aud\)/i }), '0');
    await f.user.click(screen.getByRole('button', { name: 'Save expense' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('amount_required');
    expect(screen.getByRole('textbox', { name: /^description/i })).toHaveValue('Copper pipe');
    expect(f.onCreated).not.toHaveBeenCalled();
    await f.user.clear(screen.getByRole('spinbutton', { name: /amount \(aud\)/i }));
    await f.user.type(screen.getByRole('spinbutton', { name: /amount \(aud\)/i }), '123.45');
    await f.user.click(screen.getByRole('button', { name: 'Save expense' }));
    expect(vi.mocked(expenseService.create).mock.calls[1][1]).toMatchObject({
      description: 'Copper pipe', amount: { amount: 12345, currency: 'AUD' }, tax: { amount: 0, currency: 'AUD' },
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(f.onCreated).toHaveBeenCalledExactlyOnceWith(expense);
  });
});
