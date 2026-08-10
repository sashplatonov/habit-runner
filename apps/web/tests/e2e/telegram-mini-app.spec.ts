import { expect, test } from '@playwright/test';

test('Telegram Mini App has a safe outside-Telegram recovery state', async ({ page }) => {
  await page.goto('/telegram');
  await expect(page.getByRole('heading', { name: 'Telegram Mini App' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
});

test('website root keeps the public landing available while Telegram SDK is absent', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Habit tracking that keeps the next step obvious.' })).toBeVisible();
});

test('root authenticates a Telegram Mini App user without showing Google sign-in', async ({ page }) => {
  await page.addInitScript(() => {
    window.Telegram = {
      WebApp: {
        initData: 'signed-telegram-init-data',
        startParam: null,
        themeParams: {},
        ready: () => undefined,
        expand: () => undefined,
        close: () => undefined
      }
    };
  });
  await page.route('**/api/auth/telegram/session', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ userId: 'telegram-user', email: null })
    });
  });

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Continue with Telegram' })).toBeVisible();
  await expect(page.getByText('Sign in with Google')).not.toBeVisible();
});
