import { test, expect } from '../../qa/browser/fixtures';

test.describe('mocked-browser: contract navigation', () => {
  test('a contract reference opens an actual detail route with its contract', async ({ page, app }) => {
    await app.setIdentity('owner');
    const listPath = `/dashboard/projects/${app.records.project._id}/contracts`;
    const detailPath = `${listPath}/${app.records.contract._id}`;
    await page.goto(listPath);
    await expect(page.getByRole('heading', { name: 'Contracts (1)', exact: true })).toBeVisible();

    const contractLink = page.getByRole('link', { name: app.records.contract.reference, exact: true });
    await expect(contractLink).toHaveAttribute('href', detailPath);
    await contractLink.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL((url) => url.pathname === detailPath);

    // Reload tests the real route response even when Next initially navigates with RSC.
    const detailResponse = await page.reload();
    expect(detailResponse?.status(), 'A linked contract detail route must resolve successfully').toBe(200);
    await expect(page.getByRole('main')).toContainText(app.records.contract.reference);
  });

  test('a viewer can read the contract list without a creation control', async ({ page, app }) => {
    await app.setIdentity('viewer');
    await page.goto(`/dashboard/projects/${app.records.project._id}/contracts`);

    await expect(page.getByRole('heading', { name: 'Contracts (1)', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: app.records.contract.reference, exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'New contract', exact: true })).toHaveCount(0);
  });
});
