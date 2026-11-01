import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RoleGate from '../../src/app/components/auth/RoleGate';
import DashboardAuthGate from '../../src/app/components/auth/DashboardAuthGate';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { can, type UserRole } from '@/lib/rbac';

const navigation = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => navigation }));
vi.mock('@/contexts/AuthSessionContext', () => ({ useAuthSession: vi.fn() }));

type SessionState = ReturnType<typeof useAuthSession>;
function active(role: UserRole = 'owner'): SessionState {
  return {
    ready: true, isAuthenticated: true, needsOnboarding: false,
    organisations: [],
    session: { role, status: 'Active', tenantId: 'qa-org-a', organisationName: 'Example Builders' },
    error: null, isActive: true, isPending: false, isRejected: false,
    can: (action) => can(role, action), refresh: vi.fn(), login: vi.fn(), signOut: vi.fn(),
  };
}

describe('Role and session UI gates (not API authorization)', () => {
  beforeEach(() => { vi.mocked(useAuthSession).mockReset(); navigation.replace.mockReset(); });

  it('does not expose gated content before the session is ready', () => {
    vi.mocked(useAuthSession).mockReturnValue({ ...active(), ready: false });
    render(<RoleGate action="projects.create"><button>Create protected project</button></RoleGate>);
    expect(screen.queryByRole('button', { name: 'Create protected project' })).not.toBeInTheDocument();
    expect(screen.queryByText('Access restricted')).not.toBeInTheDocument();
  });

  it.each([
    ['owner', true], ['viewer', false],
  ] as const)('renders project creation for %s according to the actual UI role matrix', (role, allowed) => {
    vi.mocked(useAuthSession).mockReturnValue(active(role));
    render(<RoleGate action="projects.create"><button>Create protected project</button></RoleGate>);
    if (allowed) {
      expect(screen.getByRole('button', { name: 'Create protected project' })).toBeVisible();
      expect(screen.queryByText('Access restricted')).not.toBeInTheDocument();
    } else {
      expect(screen.queryByRole('button', { name: 'Create protected project' })).not.toBeInTheDocument();
      expect(screen.getByText('Access restricted')).toBeVisible();
      expect(screen.getByRole('link', { name: 'Back to dashboard' })).toHaveAttribute('href', '/dashboard');
    }
  });

  it('renders a caller-provided denial fallback without protected content', () => {
    vi.mocked(useAuthSession).mockReturnValue(active('general'));
    render(<RoleGate action="tenant.admin" fallback={<p>Ask your owner for access</p>}><button>Manage users</button></RoleGate>);
    expect(screen.getByText('Ask your owner for access')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Manage users' })).not.toBeInTheDocument();
  });

  it('shows loading until ready, then reveals an active account dashboard', () => {
    vi.mocked(useAuthSession).mockReturnValue({ ...active(), ready: false });
    const view = render(<DashboardAuthGate><h1>Project overview</h1></DashboardAuthGate>);
    expect(screen.getByRole('progressbar')).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Project overview' })).not.toBeInTheDocument();
    vi.mocked(useAuthSession).mockReturnValue(active());
    view.rerender(<DashboardAuthGate><h1>Project overview</h1></DashboardAuthGate>);
    expect(screen.getByRole('heading', { name: 'Project overview' })).toBeVisible();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('offers retry for a transient account failure and reveals content after recovery', async () => {
    const state = active();
    vi.mocked(useAuthSession).mockReturnValue({ ...state, session: null,
      error: { message: 'Synthetic API failure', status: 503, isAuthFailure: false } });
    const view = render(<DashboardAuthGate><h1>Project overview</h1></DashboardAuthGate>);
    expect(screen.getByText("We couldn't load your account")).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Project overview' })).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(state.refresh).toHaveBeenCalledTimes(1);
    vi.mocked(useAuthSession).mockReturnValue(state);
    view.rerender(<DashboardAuthGate><h1>Project overview</h1></DashboardAuthGate>);
    expect(screen.getByRole('heading', { name: 'Project overview' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('offers reauthentication rather than retrying an invalid session', async () => {
    const state = active();
    vi.mocked(useAuthSession).mockReturnValue({ ...state, session: null,
      error: { message: 'Session rejected', status: 401, isAuthFailure: true } });
    render(<DashboardAuthGate><h1>Project overview</h1></DashboardAuthGate>);
    expect(screen.getByText(/session has expired or is no longer valid/i)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Sign in again' }));
    expect(state.signOut).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('heading', { name: 'Project overview' })).not.toBeInTheDocument();
  });

  it.each([
    ['PendingApproval', 'Waiting for approval'], ['Rejected', 'Access denied'],
  ] as const)('replaces the dashboard for a %s account', (status, message) => {
    const state = active();
    vi.mocked(useAuthSession).mockReturnValue({ ...state,
      session: { ...state.session!, status }, isActive: false,
      isPending: status === 'PendingApproval', isRejected: status === 'Rejected',
    });
    render(<DashboardAuthGate><h1>Project overview</h1></DashboardAuthGate>);
    expect(screen.getByText(message)).toBeVisible();
    expect(screen.getByText('Example Builders')).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Project overview' })).not.toBeInTheDocument();
  });

  it('routes an unonboarded account to onboarding without displaying dashboard children', () => {
    vi.mocked(useAuthSession).mockReturnValue({ ...active(), needsOnboarding: true, session: null });
    render(<DashboardAuthGate><h1>Project overview</h1></DashboardAuthGate>);
    expect(navigation.replace).toHaveBeenCalledWith('/onboarding');
    expect(screen.queryByRole('heading', { name: 'Project overview' })).not.toBeInTheDocument();
  });
});
