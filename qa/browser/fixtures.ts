import { test as base, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import type { Contract, Project } from '@/types/construction';

type Identity = 'anonymous' | 'owner' | 'viewer' | 'pending' | 'rejected';
const project: Project = {
  _id: '650000000000000000000001', tenantId: 'qa-org-a', code: 'QA-001', name: 'Synthetic test project',
  client: 'Synthetic client', siteAddress: 'Synthetic site', status: 'Active', startDate: '2026-01-01', plannedEndDate: '2027-01-01', actualEndDate: null,
  budget: { currency: 'AUD', amount: 1000000 }, contingency: { currency: 'AUD', amount: 0 }, projectManagerId: '650000000000000000000011',
  departments: [{ _id: '650000000000000000000004', type: 'Other', name: 'QA department', costCode: 'QA', percentComplete: 0, budget: { currency: 'AUD', amount: 1000000 } }],
};
const contract: Contract = {
  _id: '650000000000000000000002', tenantId: 'qa-org-a', projectId: project._id, departmentId: project.departments[0]._id,
  subcontractorId: '650000000000000000000005', reference: 'QA-CONTRACT-001', scope: 'Synthetic contract scope', status: 'Active',
  originalValue: { currency: 'AUD', amount: 110000 }, currentValue: { currency: 'AUD', amount: 110000 }, retentionPercent: 5,
  retentionReleaseHalfAtPC: 50, signedAt: null, startDate: null, plannedCompletionDate: null, paymentMilestones: [],
};
type AppFixture = { records: { project: Project; contract: Contract }; setIdentity: (value: Identity) => Promise<void>; setAuthMeFailure: (value: 401 | 503 | null) => Promise<void> };

export const test = base.extend<{ app: AppFixture }>({
  app: async ({ context, page, baseURL }, provide, testInfo) => {
    if (!(process as NodeJS.Process & { plutusQaGuard?: boolean }).plutusQaGuard) throw new Error('QA guard missing in browser worker');
    expect(() => fs.readFileSync(path.join(process.cwd(), '.env.synthetic-probe'))).toThrow('sensitive file access denied');
    if (!baseURL) throw new Error('Owned browser origin is missing');
    const origin = new URL(baseURL).origin;
    let identity: Identity = 'owner';
    let authFailure: 401 | 503 | null = null;
    const violations: string[] = [];
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await context.routeWebSocket('**/*', (socket) => {
      const url = new URL(socket.url());
      if (url.host === new URL(baseURL).host && url.pathname.startsWith('/_next/')) socket.connectToServer();
      else { violations.push(`Unexpected WebSocket: ${url.origin}${url.pathname}`); socket.close(); }
    });
    await context.route('**/*', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.href === 'https://fonts.googleapis.com/css2?family=Noto+Serif:wght@500;600;700&display=swap') {
        await route.fulfill({ contentType: 'text/css', body: '/* Local font fixture: browser tests use system fallback metrics. */' }); return;
      }
      if (url.origin !== origin) { violations.push(`Off-origin request: ${url.origin}${url.pathname}`); await route.abort('blockedbyclient'); return; }
      if (url.pathname === '/auth/profile') {
        if (identity === 'anonymous') await route.fulfill({ status: 204, body: '' });
        else await route.fulfill({ json: { sub: 'auth0|qa-browser', name: 'QA User', email: 'qa@example.test', email_verified: true } });
        return;
      }
      if (url.pathname === '/auth/login') {
        const requested = url.searchParams.get('returnTo') || '/dashboard';
        const resolved = new URL(requested, origin);
        const safe = resolved.origin === origin ? resolved.pathname + resolved.search : '/dashboard';
        const escaped = safe.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
        await route.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang="en"><title>Synthetic sign-in boundary</title><body><main><h1>Synthetic sign-in boundary</h1><a href="${escaped}">Complete synthetic sign-in</a></main></body></html>` });
        return;
      }
      if (url.pathname.startsWith('/auth/')) { violations.push(`Unexpected auth request: ${url.pathname}`); await route.abort('blockedbyclient'); return; }
      if (url.pathname.startsWith('/api/')) {
        if (request.method() !== 'GET') { violations.push(`Unconfigured mocked write: ${request.method()} ${url.pathname}`); await route.fulfill({ status: 599, json: { message: 'Unconfigured fixture write' } }); return; }
        if (url.pathname === '/api/v1/auth/me') {
          await route.fulfill(authFailure ? { status: authFailure, json: { message: 'Synthetic account API failure' } } : { json: { id: '650000000000000000000011', tenantId: 'qa-org-a', name: 'QA User', email: 'qa@example.test', organisationName: 'QA Organisation', role: identity === 'viewer' ? 'viewer' : 'owner', status: identity === 'pending' ? 'PendingApproval' : identity === 'rejected' ? 'Rejected' : 'Active' } }); return;
        }
        const readFixtures: Record<string, unknown> = {
          [`/api/v1/projects/${project._id}`]: project,
          [`/api/v1/projects/${project._id}/contracts`]: [contract],
          [`/api/v1/contracts/${contract._id}`]: contract,
          '/api/v1/subcontractors': [{ _id: contract.subcontractorId, tenantId: 'qa-org-a', name: 'QA Subcontractor', trade: 'Other', contactName: 'QA Contact', email: 'subcontractor@example.test', phone: '', preferred: false }],
        };
        if (url.pathname in readFixtures) { await route.fulfill({ json: readFixtures[url.pathname] }); return; }
        violations.push(`Unconfigured mocked API: ${url.pathname}`); await route.fulfill({ status: 599, json: { message: 'Unconfigured fixture read' } }); return;
      }
      await route.continue();
    });
    await provide({ records: { project, contract }, setIdentity: async (value) => { identity = value; }, setAuthMeFailure: async (value) => { authFailure = value; } });
    await testInfo.attach('mocked-browser-boundary.json', { body: JSON.stringify({ layer: 'mocked-browser', realBackendUsed: false, violations, pageErrors }, null, 2), contentType: 'application/json' });
    expect(violations, 'Unexpected traffic must fail the isolated UI test').toEqual([]);
    expect(pageErrors, 'Unhandled browser errors must remain visible').toEqual([]);
  },
});

export { expect };
