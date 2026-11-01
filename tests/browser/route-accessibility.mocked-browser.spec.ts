import { test, expect } from '../../qa/browser/fixtures';

test.describe('mocked-browser: accessible route workflows', () => {
  test('contract entry supports labelled fields, keyboard controls and a readable validation error', async ({ page, app }) => {
    await app.setIdentity('owner');
    const newContractPath = `/dashboard/projects/${app.records.project._id}/contracts/new`;
    const writes: string[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST' && new URL(request.url()).pathname.endsWith('/contracts')) {
        writes.push(request.url());
      }
    });
    await page.goto(newContractPath);

    const reference = page.getByRole('textbox', { name: /^Reference/ });
    await expect(reference).toBeVisible();
    await reference.focus();
    await page.keyboard.type('QA-KEYBOARD-001');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('combobox', { name: /^Status(?:\s|$)/ })).toBeFocused();
    await expect(reference).toHaveValue('QA-KEYBOARD-001');

    const addMilestone = page.getByRole('button', { name: 'Add milestone', exact: true });
    await addMilestone.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('Milestone 1');

    await page.getByRole('button', { name: 'Create contract', exact: true }).focus();
    await page.keyboard.press('Enter');
    const validationAlert = page.getByRole('alert').filter({
      hasText: /^Reference, scope, department, subcontractor and value are required\.$/,
    });
    await expect(validationAlert).toBeVisible();
    await expect(validationAlert).toHaveText('Reference, scope, department, subcontractor and value are required.');
    await expect(page).toHaveURL((url) => url.pathname === newContractPath);
    expect(writes, 'Invalid contract input must not issue a create request').toEqual([]);
  });

  test('mobile navigation can be opened and dismissed using the keyboard', async ({ page, app }) => {
    await app.setIdentity('owner');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/dashboard/projects/${app.records.project._id}/contracts`);
    await expect(page.getByRole('heading', { name: 'Contracts (1)', exact: true })).toBeVisible();

    const openNavigation = page.getByRole('button', { name: 'open navigation', exact: true });
    await openNavigation.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('link', { name: 'Projects', exact: true })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('link', { name: 'Projects', exact: true })).toBeHidden();
    await expect(openNavigation).toBeFocused();
  });

  for (const [identity, heading] of [
    ['pending', 'Waiting for approval'],
    ['rejected', 'Access denied'],
  ] as const) {
    test(`${identity} users receive a clear status screen instead of project content`, async ({ page, app }) => {
      await app.setIdentity(identity);
      await page.goto(`/dashboard/projects/${app.records.project._id}/contracts`);

      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Contracts (1)', exact: true })).toHaveCount(0);
    });
  }

  test('an unavailable account API presents retry and recovers without losing the route', async ({ page, app }) => {
    await app.setIdentity('owner');
    await app.setAuthMeFailure(503);
    const destination = `/dashboard/projects/${app.records.project._id}/contracts`;
    await page.goto(destination);

    await expect(page.getByRole('heading', { name: "We couldn't load your account", exact: true })).toBeVisible();
    const retry = page.getByRole('button', { name: 'Try again', exact: true });
    await expect(retry).toBeVisible();
    await app.setAuthMeFailure(null);
    await retry.focus();
    await page.keyboard.press('Enter');

    await expect(page.getByRole('heading', { name: 'Contracts (1)', exact: true })).toBeVisible();
    await expect(page).toHaveURL((url) => url.pathname === destination);
  });
});
