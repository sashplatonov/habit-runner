import { expect, test } from '@playwright/test';

test('website root keeps the public landing available while Telegram SDK is absent', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'telegram-webview', 'Telegram user agents intentionally enter the Mini App flow.');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Habit tracking that keeps the next step obvious.' })).toBeVisible();
});

test('website root has no horizontal overflow at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/');

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('Telegram launch intent never falls back to Google sign-in', async ({ page }) => {
  await page.route('**/telegram-web-app.js*', (route) => route.fulfill({
    contentType: 'application/javascript',
    body: `window.Telegram = { WebApp: { initData: '', initDataUnsafe: { start_param: 'pairing-token' }, themeParams: { bg_color: '#ffffff', text_color: '#ffffff' }, ready() {}, expand() {}, close() {} } };`
  }));

  await page.goto('/?startapp=pairing-token');
  await expect(page.getByRole('heading', { name: 'Telegram connection needs a retry' })).toBeVisible();
  await expect(page.locator('.card')).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(page.getByRole('button', { name: 'Sign in with Google' })).not.toBeVisible();
});

test('Telegram direct link completes pairing with the SDK start parameter', async ({ page }) => {
  await page.addInitScript(() => {
    window.Telegram = {
      WebApp: {
        initData: 'signed-telegram-init-data',
        initDataUnsafe: { start_param: 'pairing-token' },
        themeParams: {},
        ready: () => undefined,
        expand: () => undefined,
        close: () => undefined
      }
    };
  });
  await page.route('**/api/auth/telegram/session', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ userId: 'temporary-telegram-user', email: null })
  }));
  await page.route('**/api/auth/link/telegram/complete', async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      token: 'pairing-token',
      initData: 'signed-telegram-init-data'
    });
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ userId: 'web-owner', email: 'owner@example.test' })
    });
  });

  await page.goto('/?tgWebAppStartParam=pairing-token');
  await expect(page).toHaveURL(/\/app\/dashboard$/);
});

test('Telegram launch shows a retry action when the SDK cannot load', async ({ page }) => {
  let sdkRequests = 0;
  await page.route('**/telegram-web-app.js*', (route) => {
    sdkRequests += 1;
    if (sdkRequests === 1) {
      return route.abort();
    }
    return route.fulfill({
      contentType: 'application/javascript',
      body: `window.Telegram = { WebApp: { initData: 'signed-telegram-init-data', initDataUnsafe: {}, themeParams: {}, ready() {}, expand() {}, close() {} } };`
    });
  });
  await page.route('**/api/auth/telegram/session', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ userId: 'telegram-user', email: null })
  }));
  await page.route('**/api/auth/link/telegram/complete', async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      token: 'pairing-token',
      initData: 'signed-telegram-init-data'
    });
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ userId: 'telegram-user', email: null })
    });
  });

  await page.goto('/?startapp=pairing-token');
  await expect(page.getByRole('heading', { name: 'Telegram connection needs a retry' })).toBeVisible();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect.poll(() => sdkRequests).toBe(2);
  await expect(page).toHaveURL(/\/app\/dashboard$/);
});

test('root authenticates a Telegram Mini App user without showing Google sign-in', async ({ page }) => {
  await page.addInitScript(() => {
    window.Telegram = {
      WebApp: {
        initData: 'signed-telegram-init-data',
        initDataUnsafe: {},
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

test('Telegram entry follows dark webview theme parameters', async ({ page }) => {
  await page.addInitScript(() => {
    window.Telegram = {
      WebApp: {
        initData: 'signed-telegram-init-data',
        initDataUnsafe: {},
        themeParams: {
          bg_color: '#101010',
          secondary_bg_color: '#2a2a2a',
          text_color: '#f8fafc',
          hint_color: '#a1a1aa',
          button_color: '#2ea043',
          button_text_color: '#ffffff'
        },
        ready: () => undefined,
        expand: () => undefined,
        close: () => undefined
      }
    };
  });

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Continue with Telegram' })).toBeVisible();
  await expect(page.locator('.entry')).toHaveCSS('background-color', 'rgb(16, 16, 16)');
  await expect(page.locator('.card')).toHaveCSS('background-color', 'rgb(42, 42, 42)');
  await expect(page.getByRole('button', { name: 'Continue with Telegram' })).toHaveCSS('min-height', '44px');
});

test('Telegram Mini App starts Google account linking from a verified Telegram session', async ({ page }) => {
  await page.addInitScript(() => {
    window.Telegram = { WebApp: { initData: 'signed-telegram-init-data', initDataUnsafe: {}, themeParams: {}, ready: () => undefined, expand: () => undefined, close: () => undefined } };
  });
  await page.route('**/api/auth/telegram/session', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ userId: 'telegram-user', email: null }) }));
  await page.route('**/api/auth/google/link/start*', (route) => route.fulfill({ contentType: 'text/html', body: '<title>Google OAuth</title>' }));

  await page.goto('/');
  const request = page.waitForRequest((candidate) => new URL(candidate.url()).pathname === '/api/auth/google/link/start');
  await page.getByRole('button', { name: 'Sign in with Google' }).click();
  await request;
});

test('Telegram Mini App preserves the CSRF header for an existing browser session', async ({ page }) => {
  await page.context().addCookies([{ name: 'habbit_runner_csrf_token', value: 'csrf-token', url: 'http://127.0.0.1:4173' }]);
  await page.addInitScript(() => {
    window.Telegram = { WebApp: { initData: 'signed-telegram-init-data', initDataUnsafe: {}, themeParams: {}, ready: () => undefined, expand: () => undefined, close: () => undefined } };
  });

  let csrfHeader = '';
  await page.route('**/api/auth/telegram/session', async (route) => {
    csrfHeader = route.request().headers()['x-csrf-token'] ?? '';
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ userId: 'telegram-user', email: null }) });
  });

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Continue with Telegram' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue with Telegram' }).click();
  await expect.poll(() => csrfHeader).toBe('csrf-token');
});
