import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ContactPage from '../../src/app/contact/page';
import { ColorModeProvider } from '@/lib/colorModeContext';
import { ApiError } from '@/lib/api-client';
import { submitContact } from '@/services/contactService';

vi.mock('@/services/contactService', () => ({ submitContact: vi.fn() }));

function renderContact() {
  render(<ColorModeProvider><ContactPage /></ColorModeProvider>);
  return userEvent.setup();
}

async function fill(user: ReturnType<typeof userEvent.setup>, values = {
  name: 'Jordan Example', email: 'jordan@example.test', message: 'Please arrange a product demonstration.',
}) {
  if (values.name) await user.type(screen.getByRole('textbox', { name: /your name/i }), values.name);
  if (values.email) await user.type(screen.getByRole('textbox', { name: /^email/i }), values.email);
  if (values.message) await user.type(screen.getByRole('textbox', { name: /^message/i }), values.message);
}

describe('Contact form', () => {
  beforeEach(() => vi.mocked(submitContact).mockReset());

  it.each([
    [{ name: ' ', email: 'jordan@example.test', message: 'A complete enquiry.' }, 'Please enter your name.'],
    [{ name: 'Jordan', email: 'invalid-address', message: 'A complete enquiry.' }, 'Please enter a valid email address.'],
    [{ name: 'Jordan', email: 'jordan@example.test', message: 'short' }, 'Please enter a message (at least 10 characters).'],
  ] as const)('shows validation feedback without submitting invalid input %#', async (values, message) => {
    const user = renderContact();
    await fill(user, values);
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    expect(screen.getByRole('alert')).toHaveTextContent(message);
    expect(submitContact).not.toHaveBeenCalled();
  });

  it('submits trimmed fields and displays the received-message confirmation', async () => {
    vi.mocked(submitContact).mockResolvedValue({ ok: true });
    const user = renderContact();
    await fill(user, { name: ' Jordan Example ', email: ' jordan@example.test ', message: ' Please arrange a demonstration. ' });
    await user.type(screen.getByRole('textbox', { name: 'Company (optional)' }), ' Example Builders ');
    await user.type(screen.getByRole('textbox', { name: 'Subject (optional)' }), ' Demo request ');
    expect(screen.queryByRole('textbox', { name: 'Company website' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    expect(submitContact).toHaveBeenCalledExactlyOnceWith({
      name: 'Jordan Example', email: 'jordan@example.test', company: 'Example Builders',
      subject: 'Demo request', message: 'Please arrange a demonstration.', company_website: '',
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(/we've received your message/i);
    expect(screen.queryByRole('button', { name: 'Send message' })).not.toBeInTheDocument();
  });

  it('disables submission while pending and prevents a user double click from sending twice', async () => {
    let resolve!: (value: { ok: boolean }) => void;
    vi.mocked(submitContact).mockReturnValue(new Promise((done) => { resolve = done; }));
    const user = renderContact();
    await fill(user);
    await user.dblClick(screen.getByRole('button', { name: 'Send message' }));
    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
    expect(submitContact).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/we've received your message/i)).not.toBeInTheDocument();
    await act(async () => resolve({ ok: true }));
    expect(screen.getByRole('alert')).toHaveTextContent(/we've received your message/i);
  });

  it('preserves input after rejection and lets the user retry successfully', async () => {
    vi.mocked(submitContact).mockRejectedValueOnce(new ApiError('rate_limited', 429)).mockResolvedValueOnce({ ok: true });
    const user = renderContact();
    await fill(user);
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/please try again in a little while/i);
    expect(screen.getByRole('textbox', { name: /^message/i })).toHaveValue('Please arrange a product demonstration.');
    expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Send message' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/we've received your message/i);
    expect(submitContact).toHaveBeenCalledTimes(2);
    expect(vi.mocked(submitContact).mock.calls[1][0]).toEqual({
      name: 'Jordan Example', email: 'jordan@example.test', message: 'Please arrange a product demonstration.',
      company: undefined, subject: undefined, company_website: '',
    });
  });
});
