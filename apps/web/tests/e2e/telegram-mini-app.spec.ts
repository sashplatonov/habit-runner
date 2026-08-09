import { expect, test } from '@playwright/test';

test('Telegram Mini App has a safe outside-Telegram recovery state', async ({ page }) => {
  await page.goto('/telegram');
  await expect(page.getByRole('heading', { name: 'Telegram Mini App' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
});
