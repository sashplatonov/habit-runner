import { expect, test } from '@playwright/test';

test('website root keeps the public landing available while Telegram SDK is absent', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Habit tracking that keeps the next step obvious.' })).toBeVisible();
});

test('website root has no horizontal overflow at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
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
  await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
  await expect(page.getByText('I have a link code')).not.toBeVisible();
});

test('Telegram Mini App starts Google account linking from a verified Telegram session', async ({ page }) => {
  await page.addInitScript(() => {
    window.Telegram = { WebApp: { initData: 'signed-telegram-init-data', startParam: null, themeParams: {}, ready: () => undefined, expand: () => undefined, close: () => undefined } };
  });
  await page.route('**/api/auth/telegram/session', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ userId: 'telegram-user', email: null }) }));
  await page.route('**/api/auth/google/link/start*', (route) => route.fulfill({ contentType: 'text/html', body: '<title>Google OAuth</title>' }));

  await page.goto('/');
  const request = page.waitForRequest((candidate) => new URL(candidate.url()).pathname === '/api/auth/google/link/start');
  await page.getByRole('button', { name: 'Sign in with Google' }).click();
  await request;
});
