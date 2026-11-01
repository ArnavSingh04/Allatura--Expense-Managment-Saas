import { test as base, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

type Actor = { cookie: string; profile: { tenantId: string; organisationId: string } };
type Supplier = { _id: string; tenantId: string; name: string; deletedAt: string | null };
const fixture = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'qa-stack.json'), 'utf8')) as {
  actors: Record<'owner' | 'reader' | 'foreignOwner', Actor>; controlUrl: string; controlToken: string;
};
async function snapshot(): Promise<Supplier[]> {
  const response = await fetch(`${fixture.controlUrl}/snapshot`, { headers: { 'x-qa-control': fixture.controlToken } });
  expect(response.status).toBe(200);
  return ((await response.json()) as { suppliers: Supplier[] }).suppliers;
}
async function signIn(page: Page, actor: keyof typeof fixture.actors) {
  await page.context().clearCookies();
  await page.context().addCookies([{ name: '__session', value: fixture.actors[actor].cookie,
    url: process.env.PLUTUS_QA_BASE_URL!, httpOnly: true, sameSite: 'Lax' }]);
}
const test = base.extend<{ boundary: void }>({
  boundary: [async ({ page, context, baseURL }, use) => {
    const violations: string[] = []; const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await context.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.href === 'https://fonts.googleapis.com/css2?family=Noto+Serif:wght@500;600;700&display=swap') {
        await route.fulfill({ contentType: 'text/css', body: '/* Local font fixture. */' }); return;
      }
      if (url.origin !== baseURL) { violations.push(`${url.origin}${url.pathname}`); await route.abort(); return; }
      await route.continue();
    });
    await context.routeWebSocket('**/*', (socket) => {
      const url = new URL(socket.url());
      if (url.host === new URL(baseURL!).host && url.pathname.startsWith('/_next/')) socket.connectToServer();
      else { violations.push(`${url.origin}${url.pathname}`); socket.close(); }
    });
    await use();
    expect(violations, 'Browser contacts only its owned frontend').toEqual([]);
    expect(errors, 'No unhandled browser errors').toEqual([]);
  }, { auto: true }],
});

test('owner creates a supplier through the real UI, API and database and sees it after reload', async ({ page }) => {
  await signIn(page, 'owner');
  await page.goto('/dashboard/suppliers');
  await page.getByRole('button', { name: 'New supplier', exact: true }).click();
  await page.getByRole('textbox', { name: /^Name/ }).fill('QA-STACK-UI-SUPPLIER');
  const created = page.waitForResponse((response) => response.url().endsWith('/api/v1/suppliers') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  expect((await created).status()).toBe(201);
  await expect(page.getByRole('cell', { name: 'QA-STACK-UI-SUPPLIER', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('cell', { name: 'QA-STACK-UI-SUPPLIER', exact: true })).toBeVisible();
  const saved = (await snapshot()).filter((supplier) => supplier.name === 'QA-STACK-UI-SUPPLIER');
  expect(saved).toHaveLength(1);
  expect(saved[0].tenantId).toBe(fixture.actors.owner.profile.tenantId);
});

test('reader has a valid read control but cannot create through the API; real records stay unchanged', async ({ page }) => {
  await signIn(page, 'reader');
  await page.goto('/dashboard/suppliers');
  await expect(page.getByRole('heading', { name: 'Suppliers', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New supplier', exact: true })).toHaveCount(0);
  const allowed = await page.request.get('/api/v1/suppliers');
  expect(allowed.status()).toBe(200);
  const before = await snapshot();
  const denied = await page.request.post('/api/v1/suppliers', { data: { name: 'QA-DENIED-READER' } });
  expect(denied.status()).toBe(403);
  expect(await snapshot()).toEqual(before);
});

test('foreign owner cannot read or alter another tenant supplier and cannot forge its organisation', async ({ page }) => {
  await signIn(page, 'owner');
  const created = await page.request.post('/api/v1/suppliers', { data: { name: 'QA-STACK-ISOLATION' } });
  expect(created.status()).toBe(201);
  const target = (await created.json()) as { _id: string };
  const before = await snapshot();
  await signIn(page, 'foreignOwner');
  expect((await page.request.get('/api/v1/suppliers')).status()).toBe(200);
  expect((await page.request.get(`/api/v1/suppliers/${target._id}`)).status()).toBe(404);
  expect((await page.request.patch(`/api/v1/suppliers/${target._id}`, { data: { name: 'QA-CROSS-TENANT-WRITE' } })).status()).toBe(404);
  expect((await page.request.post('/api/v1/suppliers', {
    data: { name: 'QA-FORGED-ORGANISATION' }, headers: { 'x-organisation-id': fixture.actors.owner.profile.organisationId },
  })).status()).toBe(403);
  expect(await snapshot()).toEqual(before);
});
