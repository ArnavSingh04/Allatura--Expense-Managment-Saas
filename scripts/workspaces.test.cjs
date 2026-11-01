const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Exercise actual route/component code without Auth0, network, email or a DB.
const root = path.resolve(__dirname, '..');
const orgA = '111111111111111111111111';
const orgB = '222222222222222222222222';
const otherOrg = '333333333333333333333333';
const subject = 'auth0|workspace-fixture';
const environment = { NODE_ENV: 'production', BACKEND_API_URL: 'https://api.example.test/v1' };
const compiled = new Map();

function load(file, dependencies = {}, globals = {}) {
  if (!compiled.has(file)) {
    compiled.set(file, ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
      fileName: file,
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
    }).outputText);
  }
  const loadedModule = { exports: {} };
  vm.runInNewContext(compiled.get(file), {
    module: loadedModule, exports: loadedModule.exports,
    require: (id) => {
      if (Object.hasOwn(dependencies, id)) return dependencies[id];
      if (id.startsWith('@/')) throw new Error(`Unmocked application dependency: ${id}`);
      return require(id);
    },
    console: { ...console, error: () => {} }, Error, Buffer, Headers, Response, URL, URLSearchParams,
    AbortSignal, FormData, setTimeout, process: { env: environment }, ...globals,
  }, { filename: file });
  return loadedModule.exports;
}

const cookie = load('src/lib/active-organisation-cookie.ts');
const rbac = load('src/lib/rbac.ts');
const errors = load('src/lib/team-management-errors.ts');
const routing = load('src/lib/organisation-routing.ts');
const invitationSwitch = load('src/lib/invitation-account-switch.ts');
const binding = load('src/lib/organisation-binding.ts', { '@/lib/organisation-routing': routing });
const summaries = [
  { id: orgA, name: 'Original workspace', tenantId: 'original', role: 'admin', status: 'Active', isOrganisationOwner: true },
  { id: orgB, name: 'Inviting workspace', tenantId: 'inviting', role: 'finance', status: 'Active', isOrganisationOwner: false },
];
const flush = () => new Promise((resolve) => setImmediate(resolve));

class TestNextResponse extends Response {
  cookieWrites = [];
  cookies = { set: (...args) => this.cookieWrites.push(args) };
  static json(body, init = {}) {
    return new TestNextResponse(JSON.stringify(body), {
      ...init, headers: { 'content-type': 'application/json', ...init.headers },
    });
  }
}

function request(body, { method = 'POST', preference, origin = 'https://frontend.example.test' } = {}) {
  return {
    method, headers: new Headers({ 'content-type': 'application/json', origin }),
    nextUrl: new URL('https://frontend.example.test/api/active-organisation'),
    cookies: { get: () => preference ? { value: preference } : undefined },
    json: async () => body,
    arrayBuffer: async () => Buffer.from(JSON.stringify(body || {})),
  };
}

test('workspace preference is identity-bound and malformed preferences cannot fall back silently', () => {
  const encoded = cookie.encodeActiveOrganisation(orgB, subject);
  assert.equal(cookie.readActiveOrganisation(encoded, subject).organisationId, orgB);
  assert.equal(cookie.readActiveOrganisation(encoded, 'auth0|someone-else').organisationId, null);
  assert.equal(cookie.readActiveOrganisation('%invalid', subject).invalid, true);
  const invalidId = cookie.encodeActiveOrganisation('not-an-id', subject);
  assert.equal(cookie.readActiveOrganisation(invalidId, subject).invalid, true);
});

test('selection validates membership server-side, writes a protected cookie, and rejects other organisations', async () => {
  const calls = [];
  const route = load('src/app/api/active-organisation/route.ts', {
    'next/server': { NextResponse: TestNextResponse },
    '@/lib/auth0': { auth0: { getSession: async () => ({ user: { sub: subject } }), getAccessToken: async () => ({ token: 'fixture-token' }) } },
    '@/lib/active-organisation-cookie': cookie,
    '@/lib/organisation-routing': routing,
  }, { fetch: async (url, init) => { calls.push({ url, init }); return Response.json(summaries); } });
  const response = await route.POST(request({ organisationId: orgB }));
  assert.equal(response.status, 200);
  assert.equal(calls[0].url, 'https://api.example.test/v1/auth/organisations');
  assert.equal(calls[0].init.headers['x-organisation-id'], undefined);
  const [name, value, options] = response.cookieWrites[0];
  assert.equal(name, 'allatura_active_org');
  assert.equal(cookie.readActiveOrganisation(value, subject).organisationId, orgB);
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, 'lax');
  assert.equal(options.secure, true);
  assert.equal(options.path, '/');
  const denied = await route.POST(request({ organisationId: otherOrg }));
  assert.equal(denied.status, 403);
  assert.equal(denied.cookieWrites.length, 0);
  assert.equal((await route.POST(request({ organisationId: orgA }, { origin: 'https://foreign.example.test' }))).status, 403);
});

test('explicit clear works while the backend is unavailable; anonymous selection cannot write a cookie', async () => {
  const deps = {
    'next/server': { NextResponse: TestNextResponse },
    '@/lib/active-organisation-cookie': cookie,
    '@/lib/organisation-routing': routing,
    '@/lib/auth0': { auth0: { getSession: async () => ({ user: { sub: subject } }), getAccessToken: async () => { throw Error('Must not need a token for explicit clear'); } } },
  };
  const route = load('src/app/api/active-organisation/route.ts', deps, { fetch: () => { throw Error('Unexpected network'); } });
  const response = await route.POST(request({ organisationId: null }));
  assert.equal(response.status, 200);
  assert.equal(response.cookieWrites[0][2].maxAge, 0);
  const anonymous = load('src/app/api/active-organisation/route.ts', {
    ...deps, '@/lib/auth0': { auth0: { getSession: async () => null } },
  });
  assert.equal((await anonymous.POST(request({ organisationId: orgB }))).status, 401);
});

test('proxy forwards only the identity-bound selection and never retries a mutation in another workspace', async () => {
  const calls = [];
  const proxy = load('src/app/api/v1/[...path]/route.ts', {
    '@/lib/auth0': { auth0: { getSession: async () => ({ user: { sub: subject } }), getAccessToken: async () => ({ token: 'fixture-token' }) } },
    '@/lib/active-organisation-cookie': cookie,
    '@/lib/organisation-routing': routing,
  }, { fetch: async (url, init) => { calls.push({ url, init }); return Response.json({ message: 'organisation_access_denied' }, { status: 403 }); } });
  const preference = cookie.encodeActiveOrganisation(orgB, subject);
  const req = request({ name: 'No real record' }, { preference });
  const denied = await proxy.POST(req, { params: Promise.resolve({ path: ['projects'] }) });
  assert.equal(denied.status, 403);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.headers.get('x-organisation-id'), orgB);
  assert.equal(calls[0].init.headers.get('authorization'), 'Bearer fixture-token');
  calls.length = 0;
  const malformed = request({}, { preference: '%invalid' });
  assert.equal((await proxy.POST(malformed, { params: Promise.resolve({ path: ['projects'] }) })).status, 403);
  assert.equal(calls.length, 0);
  const anotherIdentity = request({}, { preference: cookie.encodeActiveOrganisation(orgB, 'auth0|another') });
  await proxy.POST(anotherIdentity, { params: Promise.resolve({ path: ['projects'] }) });
  assert.equal(calls[0].init.headers.get('x-organisation-id'), null);
  calls.length = 0;
  for (const path of [['auth', 'organisations'], ['auth', 'onboarding']]) {
    await proxy.POST(malformed, { params: Promise.resolve({ path }) });
    assert.equal(calls.at(-1).init.headers.get('x-organisation-id'), null);
  }
});

test('public invitation lookup survives a malformed preference without bypassing private invitation routes', async () => {
  const calls = [];
  const proxy = load('src/app/api/v1/[...path]/route.ts', {
    '@/lib/auth0': { auth0: { getSession: async () => ({ user: { sub: subject } }), getAccessToken: async () => ({ token: 'fixture-token' }) } },
    '@/lib/active-organisation-cookie': cookie,
    '@/lib/organisation-routing': routing,
  }, { fetch: async (url, init) => { calls.push({ url, init }); return Response.json({ valid: true }); } });
  const req = request(null, { method: 'GET', preference: '%invalid' });
  req.headers.set('x-organisation-id', 'invalid');
  const response = await proxy.GET(req, { params: Promise.resolve({ path: ['invitations', 'lookup', 'fixture-token'] }) });
  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.headers.get('x-organisation-id'), null);
  assert.equal(routing.isOrganisationIndependentPath('invitations'), false);
  assert.equal(routing.isOrganisationIndependentPath('invitations/fixture/resend'), false);
});

test('both API clients keep tab A requests in A after another tab changes the preference cookie to B', async () => {
  const tabBinding = load('src/lib/organisation-binding.ts', { '@/lib/organisation-routing': routing });
  tabBinding.setOrganisationBinding(orgA);
  const forwarded = [];
  const proxy = load('src/app/api/v1/[...path]/route.ts', {
    '@/lib/auth0': { auth0: { getSession: async () => ({ user: { sub: subject } }), getAccessToken: async () => ({ token: 'fixture-token' }) } },
    '@/lib/active-organisation-cookie': cookie,
    '@/lib/organisation-routing': routing,
  }, { fetch: async (url, init) => { forwarded.push({ url, init }); return Response.json({}); } });
  const sharedCookie = cookie.encodeActiveOrganisation(orgB, subject);
  const browserFetch = async (url, init) => {
    const req = request({}, { preference: sharedCookie, method: init.method });
    req.headers = new Headers(init.headers);
    const path = new URL(url).pathname.replace('/api/v1/', '').split('/');
    return proxy[init.method](req, { params: Promise.resolve({ path }) });
  };
  const dependencies = {
    '@/lib/resolve-api-base-url': { resolveApiBaseUrl: () => 'https://frontend.example.test/api/v1' },
    '@/lib/organisation-binding': tabBinding,
  };
  const modern = load('src/lib/api-client.ts', dependencies, { fetch: browserFetch });
  const legacy = load('src/lib/api-helper.ts', dependencies, { fetch: browserFetch });
  await modern.apiPost('projects', { name: 'Fixture' });
  await modern.apiGet('auth/me');
  await modern.apiPostRaw('imports/sessions', {});
  await modern.apiGetBlob('imports/templates/project');
  const helper = new legacy.ApiHelper('users/fixture/role');
  helper.type = legacy.REQUEST_TYPE.PATCH;
  helper.body = { role: 'viewer' };
  await helper.fetchRequest();
  await new legacy.ApiHelper('imports/sessions').fetchMultipart(new FormData());
  assert.equal(forwarded.length, 6);
  for (const call of forwarded) assert.equal(call.init.headers.get('x-organisation-id'), orgA);

  const invalid = request({}, { preference: sharedCookie });
  invalid.headers.set('x-organisation-id', 'not-an-id');
  assert.equal((await proxy.POST(invalid, { params: Promise.resolve({ path: ['projects'] }) })).status, 403);
  assert.equal(forwarded.length, 6);
  await modern.apiGet('auth/organisations');
  await modern.apiPost('auth/onboarding', { inviteToken: 'fixture' });
  assert.equal(forwarded[6].init.headers.get('x-organisation-id'), null);
  assert.equal(forwarded[7].init.headers.get('x-organisation-id'), null);
  tabBinding.setOrganisationBinding(null);
  assert.equal(Object.keys(tabBinding.organisationRequestHeaders('invitations/lookup/fixture')).length, 0);
});

function hooks(initial = []) {
  let cursor = 0;
  let refCursor = 0;
  const values = [...initial];
  const effects = [];
  const refs = [];
  return {
    values, effects, reset: () => { cursor = 0; refCursor = 0; effects.length = 0; },
    react: {
      ...React,
      createContext: () => ({ Provider: 'provider' }),
      useCallback: (fn) => fn, useMemo: (fn) => fn(),
      useRef: (initial) => { const index = refCursor++; return refs[index] || (refs[index] = { current: initial }); },
      useEffect: (fn) => effects.push(fn),
      useState: (fallback) => {
        const index = cursor++;
        if (!(index in values)) values[index] = fallback;
        return [values[index], (value) => { values[index] = typeof value === 'function' ? value(values[index]) : value; }];
      },
    },
  };
}

class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

test('selected membership controls permissions; stale membership retains discovery without automatic switching', async () => {
  for (const inaccessible of [false, true]) {
    const state = hooks();
    const calls = [];
    const Context = load('src/app/contexts/AuthSessionContext.tsx', {
      react: state.react,
      '@auth0/nextjs-auth0': { useUser: () => ({ user: { sub: subject }, isLoading: false }) },
      '@/lib/rbac': rbac,
      '@/lib/organisation-binding': binding,
      '@/lib/invitation-account-switch': invitationSwitch,
      '@/lib/api-client': { ApiError, apiGet: async (path) => {
        calls.push(path);
        if (path === 'auth/organisations') return summaries;
        if (inaccessible) throw new ApiError('organisation_access_denied', 403);
        return { id: 'fixture-user', organisationId: orgB, role: 'finance', status: 'Active', organisations: summaries };
      } },
    });
    Context.AuthSessionProvider({ children: null });
    state.effects[0]();
    await flush();
    if (inaccessible) {
      assert.equal(state.values[1], null);
      assert.equal(state.values[3].isOrganisationFailure, true);
      assert.equal(state.values[3].isAuthFailure, false);
      assert.equal(calls.join(','), 'auth/me,auth/organisations');
    } else {
      assert.equal(state.values[1].organisationId, orgB);
      assert.equal(state.values[1].role, 'finance');
      assert.equal(rbac.can(state.values[1].role, 'tenant.admin'), false);
    }
    assert.equal(state.values[4].length, 2);
    assert.equal(state.values[4][0].role, 'owner');
  }
});

test('profile errors and late mutations stay in tab A even after the shared preference changes to B', async () => {
  const tabBinding = load('src/lib/organisation-binding.ts', { '@/lib/organisation-routing': routing });
  let sharedPreference = cookie.encodeActiveOrganisation(orgA, subject);
  let unavailable = false;
  const forwarded = [];
  const proxy = load('src/app/api/v1/[...path]/route.ts', {
    '@/lib/auth0': { auth0: { getSession: async () => ({ user: { sub: subject } }), getAccessToken: async () => ({ token: 'fixture-token' }) } },
    '@/lib/active-organisation-cookie': cookie, '@/lib/organisation-routing': routing,
  }, { fetch: async (url, init) => {
    forwarded.push({ url, init });
    if (url.endsWith('/auth/organisations')) return Response.json(summaries);
    if (unavailable) return Response.json({ message: 'organisation_access_denied' }, { status: 403 });
    if (url.endsWith('/auth/me')) return Response.json({ id: 'fixture', role: 'admin', status: 'Active', organisationId: init.headers.get('x-organisation-id'), organisations: summaries });
    return Response.json({});
  } });
  const modern = load('src/lib/api-client.ts', {
    '@/lib/resolve-api-base-url': { resolveApiBaseUrl: () => 'https://frontend.example.test/api/v1' },
    '@/lib/organisation-binding': tabBinding,
  }, { fetch: async (url, init) => {
    const req = request({}, { method: init.method, preference: sharedPreference });
    req.headers = new Headers(init.headers);
    const path = new URL(url).pathname.replace('/api/v1/', '').split('/');
    return proxy[init.method](req, { params: Promise.resolve({ path }) });
  } });
  const state = hooks();
  const Context = load('src/app/contexts/AuthSessionContext.tsx', {
    react: state.react, '@auth0/nextjs-auth0': { useUser: () => ({ user: { sub: subject }, isLoading: false }) },
    '@/lib/api-client': modern, '@/lib/rbac': rbac, '@/lib/organisation-binding': tabBinding,
    '@/lib/invitation-account-switch': invitationSwitch,
  });
  const tree = Context.AuthSessionProvider({ children: null });
  state.effects[0]();
  await flush();
  assert.equal(state.values[1].organisationId, orgA);
  sharedPreference = cookie.encodeActiveOrganisation(orgB, subject);
  unavailable = true;
  tree.props.value.refresh();
  await flush();
  assert.equal(state.values[1], null);
  assert.equal(tabBinding.organisationRequestHeaders('projects')['x-organisation-id'], orgA);
  await assert.rejects(modern.apiPost('projects', { name: 'No real record' }), /organisation_access_denied/);
  unavailable = false;
  tree.props.value.refresh();
  await flush();
  assert.equal(state.values[1].organisationId, orgA);
  for (const call of forwarded.filter((call) => !call.url.endsWith('/auth/organisations'))) {
    assert.equal(call.init.headers.get('x-organisation-id'), orgA);
  }
});

test('discovery from a previous Auth0 identity cannot overwrite the new identity memberships', async () => {
  let currentSubject = subject;
  let resolveDiscovery;
  const discovery = new Promise((resolve) => { resolveDiscovery = resolve; });
  const state = hooks();
  const Context = load('src/app/contexts/AuthSessionContext.tsx', {
    react: state.react,
    '@auth0/nextjs-auth0': { useUser: () => ({ user: { sub: currentSubject }, isLoading: false }) },
    '@/lib/rbac': rbac, '@/lib/organisation-binding': binding, '@/lib/invitation-account-switch': invitationSwitch,
    '@/lib/api-client': { ApiError, apiGet: async (path) => {
      if (path === 'auth/organisations') return discovery;
      if (currentSubject === subject) throw new ApiError('organisation_access_denied', 403);
      return { id: 'new-user', organisationId: orgB, role: 'finance', status: 'Active', organisations: [summaries[1]] };
    } },
  });
  Context.AuthSessionProvider({ children: null });
  const cleanup = state.effects[0]();
  await flush();
  cleanup();
  currentSubject = 'auth0|different-fixture';
  state.reset();
  Context.AuthSessionProvider({ children: null });
  state.effects[0]();
  await flush();
  assert.equal(state.values[4][0].id, orgB);
  resolveDiscovery([summaries[0]]);
  await flush();
  assert.equal(state.values[4].length, 1);
  assert.equal(state.values[4][0].id, orgB);
});

const block = ({ children, action }) => React.createElement('div', {}, children, action);

test('workspace selector shows each membership role and reloads after an explicit switch', async () => {
  let select;
  const events = [];
  const Switcher = load('src/app/components/dashboard/OrganisationSwitcher.tsx', {
    '@mui/material': new Proxy({}, { get: (_, name) => name === '__esModule' ? false : (props) => { if (name === 'Select') select = props; return block(props); } }),
    '@/contexts/AuthSessionContext': { useAuthSession: () => ({ ready: true, session: { organisationId: orgA }, organisations: summaries.map((entry) => ({ ...entry, role: entry.isOrganisationOwner ? 'owner' : entry.role })) }) },
    '@/lib/rbac': rbac, '@/lib/team-management-errors': errors,
    '@/services/organisationService': { activateOrganisation: async (id) => events.push(`activate:${id}`) },
  }, { window: { location: { assign: (url) => events.push(`navigate:${url}`) } } }).default;
  const html = renderToStaticMarkup(React.createElement(Switcher));
  assert.match(html, /Original workspace.*Owner/);
  assert.match(html, /Inviting workspace.*Finance/);
  select.onChange({ target: { value: orgB } });
  await flush();
  assert.deepEqual(events, [`activate:${orgB}`, 'navigate:/dashboard']);
});

test('existing rejected user can explicitly accept an invite, then retry selection without reaccepting', async () => {
  const lookup = { valid: true, email: 'fixture@example.test', role: 'finance', organisationName: 'Inviting workspace' };
  const state = hooks(['Fixture User', '', lookup, false, null, false, null, '', 0]);
  let form;
  let acceptCount = 0;
  let activationCount = 0;
  const navigations = [];
  const Onboarding = load('src/app/onboarding/page.tsx', {
    react: state.react,
    '@mui/material': new Proxy({}, { get: (_, name) => name === '__esModule' ? false : (props) => { if (props.component === 'form') form = props; return block(props); } }),
    'next/navigation': { useSearchParams: () => new URLSearchParams('invite=fixture-token') },
    '@auth0/nextjs-auth0': { useUser: () => ({ user: { email: 'fixture@example.test', name: 'Fixture User' } }) },
    '@/contexts/AuthSessionContext': { useAuthSession: () => ({ ready: true, isAuthenticated: true, session: { email: 'fixture@example.test', status: 'Rejected' } }) },
    '@/services/invitationService': { invitationService: {}, submitOnboarding: async () => { acceptCount++; return { organisationId: orgB }; } },
    '@/services/organisationService': { activateOrganisation: async (id) => { assert.equal(id, orgB); if (++activationCount === 1) throw Error('Temporary selection failure'); } },
    '@/lib/api-client': { ApiError }, '@/lib/rbac': rbac, '@/lib/team-management-errors': errors,
    '@/lib/invitation-account-switch': invitationSwitch,
    '@/components/auth/InvitationAccountNotice': { __esModule: true, default: () => null },
  }, { window: { location: { assign: (url) => navigations.push(url) } } }).default;
  const html = renderToStaticMarkup(React.createElement(Onboarding));
  state.effects[0]();
  assert.equal(navigations.length, 0);
  assert.match(html, /Inviting workspace/);
  assert.match(html, /Signed in as fixture@example.test/);
  assert.match(html, /Join organisation/);
  await form.onSubmit({ preventDefault() {} });
  assert.equal(acceptCount, 1);
  assert.equal(state.values[6], orgB);
  assert.match(state.values[4], /Open organisation/);
  state.reset();
  const retryHtml = renderToStaticMarkup(React.createElement(Onboarding));
  assert.match(retryHtml, /Open organisation/);
  await form.onSubmit({ preventDefault() {} });
  assert.equal(acceptCount, 1);
  assert.equal(activationCount, 2);
  assert.deepEqual(navigations, ['/dashboard']);
});

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}

test('wrong-account switch preserves only a local invite and uses the supported allowlisted logout origin', () => {
  const storage = memoryStorage();
  let switchButton;
  const navigations = [];
  const Notice = load('src/app/components/auth/InvitationAccountNotice.tsx', {
    '@mui/material': new Proxy({}, { get: (_, name) => name === '__esModule' ? false : (props) => { if (name === 'Button') switchButton = props; return block(props); } }),
    '@/lib/invitation-account-switch': invitationSwitch,
    '@/lib/organisation-binding': binding,
  }, { window: { sessionStorage: storage, location: { origin: 'https://frontend.example.test', assign: (url) => navigations.push(url) } } }).default;
  binding.setOrganisationBinding(orgA);
  const html = renderToStaticMarkup(React.createElement(Notice, { invitedEmail: 'invited@example.test', currentEmail: 'current@example.test', token: 'fixture-token' }));
  assert.match(html, /invited@example.test/);
  assert.match(html, /current@example.test/);
  assert.equal(storage.getItem(invitationSwitch.PENDING_INVITATION_KEY), null);
  assert.equal(navigations.length, 0);
  switchButton.onClick();
  const logout = new URL(navigations[0], 'https://frontend.example.test');
  assert.equal(logout.pathname, '/auth/logout');
  assert.equal(logout.searchParams.get('returnTo'), 'https://frontend.example.test');
  assert.equal(storage.getItem(invitationSwitch.PENDING_INVITATION_KEY), '/onboarding?invite=fixture-token');
  assert.equal(Object.keys(binding.organisationRequestHeaders('projects')).length, 0);
  assert.equal(invitationSwitch.invitationEmailMismatch('Invited@example.test', ' invited@EXAMPLE.test '), false);
  for (const invalid of ['https://foreign.example/onboarding?invite=fixture', '//foreign.example/onboarding?invite=fixture', '/dashboard', '/onboarding?other=fixture']) {
    storage.setItem(invitationSwitch.PENDING_INVITATION_KEY, invalid);
    assert.equal(invitationSwitch.takeInvitationContinuation(storage, 'https://frontend.example.test'), null);
    assert.equal(storage.getItem(invitationSwitch.PENDING_INVITATION_KEY), null);
  }
});

test('saved invitation resumes login only after logout and is consumed before redirecting', async () => {
  const storage = memoryStorage();
  invitationSwitch.prepareInvitationAccountSwitch('fixture-token', 'https://frontend.example.test', storage);
  const navigations = [];
  const dependencies = {
    '@/lib/rbac': rbac, '@/lib/organisation-binding': binding, '@/lib/invitation-account-switch': invitationSwitch,
    '@/lib/api-client': { ApiError, apiGet: async () => ({ id: 'fixture', organisationId: orgA, role: 'admin', status: 'Active', organisations: summaries }) },
  };
  for (const loggedIn of [true, false]) {
    const state = hooks();
    const Context = load('src/app/contexts/AuthSessionContext.tsx', {
      ...dependencies, react: state.react,
      '@auth0/nextjs-auth0': { useUser: () => ({ user: loggedIn ? { sub: subject } : null, isLoading: false }) },
    }, { window: { sessionStorage: storage, location: { origin: 'https://frontend.example.test', assign: (url) => { assert.equal(storage.getItem(invitationSwitch.PENDING_INVITATION_KEY), null); navigations.push(url); } } } });
    Context.AuthSessionProvider({ children: null });
    state.effects[0]();
    await flush();
    if (loggedIn) {
      assert.equal(navigations.length, 0);
      assert.notEqual(storage.getItem(invitationSwitch.PENDING_INVITATION_KEY), null);
    }
  }
  assert.equal(navigations.length, 1);
  assert.equal(new URL(navigations[0], 'https://frontend.example.test').searchParams.get('returnTo'), '/onboarding?invite=fixture-token');
});

test('wrong-email onboarding blocks Join without calling acceptance, while accepted-organisation retry remains enabled', async () => {
  for (const joinedId of [null, orgB]) {
    const lookup = { valid: true, email: 'invited@example.test', role: 'finance', organisationName: 'Inviting workspace' };
    const state = hooks(['Current User', '', lookup, false, null, false, joinedId, '', 0]);
    let form;
    let joinButton;
    let acceptCount = 0;
    const Onboarding = load('src/app/onboarding/page.tsx', {
      react: state.react,
      '@mui/material': new Proxy({}, { get: (_, name) => name === '__esModule' ? false : (props) => { if (props.component === 'form') form = props; if (name === 'Button' && props.type === 'submit') joinButton = props; return block(props); } }),
      'next/navigation': { useSearchParams: () => new URLSearchParams('invite=fixture-token') },
      '@auth0/nextjs-auth0': { useUser: () => ({ user: { email: 'current@example.test' } }) },
      '@/contexts/AuthSessionContext': { useAuthSession: () => ({ ready: true, isAuthenticated: true, session: { email: 'current@example.test' } }) },
      '@/services/invitationService': { invitationService: {}, submitOnboarding: async () => { acceptCount++; return { organisationId: orgB }; } },
      '@/services/organisationService': { activateOrganisation: async () => {} },
      '@/lib/api-client': { ApiError }, '@/lib/rbac': rbac, '@/lib/team-management-errors': errors,
      '@/lib/invitation-account-switch': invitationSwitch,
      '@/components/auth/InvitationAccountNotice': { __esModule: true, default: () => null },
    }, { window: { location: { assign() {} } } }).default;
    renderToStaticMarkup(React.createElement(Onboarding));
    assert.equal(joinButton.disabled, joinedId === null);
    await form.onSubmit({ preventDefault() {} });
    assert.equal(acceptCount, 0);
    if (!joinedId) assert.match(state.values[4], /invited email/);
  }
});
