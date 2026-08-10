import { expect, test } from '@playwright/test';

test('redirects the legacy Mini App route to the website root', async ({ page }) => {
  await page.goto('/telegram');
  await expect(page).toHaveURL(/\/$/);
});
