import { expect, test } from '@playwright/test';

test('explains how to open the Mini App outside Telegram', async ({ page }) => {
  await page.goto('/telegram');
  await expect(page.getByRole('heading', { name: 'Telegram Mini App' })).toBeVisible();
  await expect(page.getByText(/Open this page from the Habbit Runner Telegram Mini App/)).toBeVisible();
});
