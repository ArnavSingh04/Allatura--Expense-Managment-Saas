import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthSessionProvider, useAuthSession } from '../../src/app/contexts/AuthSessionContext';
import { ApiError, apiGet } from '@/lib/api-client';
import { organisationRequestHeaders, setOrganisationBinding } from '@/lib/organisation-binding';

const identity = vi.hoisted(() => ({ user: { sub: 'qa-user-a' } }));
vi.mock('@auth0/nextjs-auth0', () => ({ useUser: () => ({ user: identity.user, isLoading: false }) }));
vi.mock('@/lib/api-client', async (original) => {
  const actual = await original<typeof import('@/lib/api-client')>();
  return { ...actual, apiGet: vi.fn() };
});
function Probe() {
  const value = useAuthSession();
  return <><p>{value.ready ? 'ready' : 'loading'}</p><p>{value.session?.name ?? 'No profile'}</p>
    <p>{value.error?.isOrganisationFailure ? 'Choose an organisation' : value.error?.isAuthFailure ? 'Sign in again' : ''}</p>
    <p>{value.organisations.map((membership) => membership.name).join(',')}</p>
    <button onClick={value.refresh}>Refresh</button></>;
}
const tree = () => <AuthSessionProvider><Probe /></AuthSessionProvider>;
const organisationId = '111111111111111111111111';

describe('profile identity and workspace binding with real React effects', () => {
  beforeEach(() => {
    vi.mocked(apiGet).mockReset(); identity.user = { sub: 'qa-user-a' }; setOrganisationBinding(null);
  });
  it('binds the tab to the resolved workspace and keeps it bound after a denied refresh', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({ name: 'User A', organisationId, role: 'finance', status: 'Active', organisations: [] })
      .mockRejectedValueOnce(new ApiError('organisation_access_denied', 403))
      .mockResolvedValueOnce([{ id: '222222222222222222222222', name: 'Other organisation', role: 'viewer', status: 'Active' }]);
    render(tree());
    expect(await screen.findByText('User A')).toBeVisible();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Refresh' }));
    expect(await screen.findByText('Choose an organisation')).toBeVisible();
    expect(await screen.findByText('Other organisation')).toBeVisible();
    expect(organisationRequestHeaders('projects')['x-organisation-id']).toBe(organisationId);
    expect(screen.queryByText('Sign in again')).not.toBeInTheDocument();
  });
  it('ignores an old identity profile that finishes after the next identity profile', async () => {
    let finishOld!: (value: unknown) => void;
    vi.mocked(apiGet).mockReturnValueOnce(new Promise((resolve) => { finishOld = resolve; }))
      .mockResolvedValueOnce({ name: 'User B', organisationId: '222222222222222222222222', role: 'viewer', status: 'Active', organisations: [] });
    const view = render(tree());
    identity.user = { sub: 'qa-user-b' };
    view.rerender(tree());
    expect(await screen.findByText('User B')).toBeVisible();
    await act(async () => finishOld({ name: 'User A', organisationId, role: 'owner', status: 'Active' }));
    expect(screen.queryByText('User A')).not.toBeInTheDocument();
    expect(organisationRequestHeaders('projects')['x-organisation-id']).toBe('222222222222222222222222');
  });
  it('treats rejected authentication as sign-in recovery without pretending it is organisation denial', async () => {
    vi.mocked(apiGet).mockRejectedValue(new ApiError('unauthorized', 401));
    render(tree());
    await waitFor(() => expect(screen.getByText('Sign in again')).toBeVisible());
    expect(apiGet).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Choose an organisation')).not.toBeInTheDocument();
  });
});
