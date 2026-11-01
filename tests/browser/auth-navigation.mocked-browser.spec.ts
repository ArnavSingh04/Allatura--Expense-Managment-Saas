import { test, expect } from '../../qa/browser/fixtures';

test.describe('mocked-browser: authentication navigation', () => {
  test('a protected deep link preserves its path and query through synthetic sign-in', async ({ page, app }) => {
    await app.setIdentity('anonymous');
    const destination = `/dashboard/projects/${app.records.project._id}/contracts?view=recent`;

    await page.goto(destination);
    await page.waitForURL((url) => url.pathname === '/auth/login');
    expect(new URL(page.url()).searchParams.get('returnTo')).toBe(destination);

    // Only the identity/API boundary is substituted; navigation and route rendering use Next.
    await app.setIdentity('owner');
    await page.getByRole('link', { name: 'Complete synthetic sign-in', exact: true }).click();
    await expect(page).toHaveURL((url) => `${url.pathname}${url.search}` === destination);
    await expect(page.getByRole('heading', { name: 'Contracts (1)', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: app.records.contract.reference, exact: true })).toBeVisible();
  });

  test('the login entry route preserves a safe internal returnTo including its query', async ({ page, app }) => {
    await app.setIdentity('anonymous');
    const destination = `/dashboard/projects/${app.records.project._id}/contracts?view=recent&source=login`;

    await page.goto(`/login?returnTo=${encodeURIComponent(destination)}`);
    await page.waitForURL((url) => url.pathname === '/auth/login');

    expect(new URL(page.url()).searchParams.get('returnTo')).toBe(destination);
  });

  for (const [label, destination] of [
    ['absolute external URL', 'https://qa.invalid/escape'],
    ['protocol-relative external URL', '//qa.invalid/escape'],
    ['backslash-normalized external URL', '/\\qa.invalid/escape'],
  ] as const) {
    test(`the login entry route rejects a ${label}`, async ({ page, app }) => {
      await app.setIdentity('anonymous');

      await page.goto(`/login?returnTo=${encodeURIComponent(destination)}`);
      await page.waitForURL((url) => url.pathname === '/auth/login');

      // Inspect what the product forwarded, before the fixture's own safe-redirect guard.
      expect(new URL(page.url()).searchParams.get('returnTo')).toBe('/dashboard');
    });
  }

  test('the login entry route defaults to the dashboard without a returnTo', async ({ page, app }) => {
    await app.setIdentity('anonymous');

    await page.goto('/login');
    await page.waitForURL((url) => url.pathname === '/auth/login');

    expect(new URL(page.url()).searchParams.get('returnTo')).toBe('/dashboard');
  });
});
