import { expect, test } from '@playwright/test';

test('account linking remains behind the authenticated shell', async ({ page }) => {
  await page.goto('/app/account');
  await expect(page).toHaveURL(/\/\?returnTo=/);
});
