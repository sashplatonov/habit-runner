import { expect, test } from '@playwright/test';

test('expired session returns the user to the public entry point', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('habbitRunner.auth.session', JSON.stringify({ userId: 'expired-user' }));
  });
  await page.route(/\/(?:api\/)?(?:habits|auth\/refresh)(?:\/|$)/, async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith('/habits') || pathname.endsWith('/auth/refresh')) {
      await route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ status: 403 }) });
      return;
    }
    await route.continue();
  });
  await page.goto('/app/dashboard');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('button', { name: /Sign in with Google/ })).toBeVisible();
});
