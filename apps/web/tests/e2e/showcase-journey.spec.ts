import { expect, test } from '@playwright/test';

test.describe('real anonymous showcase journey', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name === 'telegram-webview', 'Telegram user agents intentionally enter the Mini App flow.');
  });

  test('keeps the full habit flow in memory and inside showcase routes', async ({ page }) => {
    const apiRequests: string[] = [];
    const authRequests: string[] = [];
    const persistenceWrites: string[] = [];
    page.on('request', (request) => {
      const pathname = new URL(request.url()).pathname;
      if (pathname.startsWith('/api/')) {
        apiRequests.push(request.url());
      }
      if (pathname.startsWith('/auth/') || pathname.startsWith('/api/auth/')) {
        authRequests.push(request.url());
      }
    });
    await page.addInitScript(() => {
      for (const storage of [localStorage, sessionStorage]) {
        const originalSetItem = storage.setItem.bind(storage);
        storage.setItem = (key, value) => {
          window.dispatchEvent(new CustomEvent('showcase-storage-write', { detail: key }));
          originalSetItem(key, value);
        };
      }
      const originalOpen = indexedDB.open.bind(indexedDB);
      indexedDB.open = ((...args: Parameters<IDBFactory['open']>) => {
        window.dispatchEvent(new CustomEvent('showcase-storage-write', { detail: `indexeddb:${args[0]}` }));
        return originalOpen(...args);
      }) as IDBFactory['open'];
      window.addEventListener('showcase-storage-write', (event) => {
        window.dispatchEvent(new CustomEvent('showcase-write-observed', { detail: (event as CustomEvent<string>).detail }));
      });
    });
    await page.exposeFunction('recordShowcaseWrite', (key: string) => persistenceWrites.push(key));
    await page.addInitScript(() => {
      window.addEventListener('showcase-write-observed', (event) => {
        void (window as Window & { recordShowcaseWrite?: (key: string) => void }).recordShowcaseWrite?.((event as CustomEvent<string>).detail);
      });
    });

    await page.goto('/');
    await page.getByRole('link', { name: 'Open the interactive demo' }).click();
    await expect(page).toHaveURL(/\/showcase$/);
    apiRequests.length = 0;
    authRequests.length = 0;
    persistenceWrites.length = 0;

    const morning = page.locator('article').filter({ hasText: 'Morning pages' });
    await expect(morning).toBeVisible();
    await morning.locator('button[aria-label*="Morning pages"]').last().click();
    await page.goto('/showcase/habit/morning-pages');
    await expect(page).toHaveURL(/\/showcase\/habit\/morning-pages$/);

    await page.getByRole('button', { name: 'Edit habit' }).click();
    await expect(page).toHaveURL(/\/showcase\/habit\/morning-pages\/edit$/);
    await page.getByLabel('Name *').fill('Morning pages — updated');
    await page.getByRole('button', { name: 'Save habit' }).last().click();
    await expect(page).toHaveURL(/\/showcase\/habit\/morning-pages$/);

    await page.getByRole('link', { name: /New Habit/i }).first().click();
    await expect(page).toHaveURL(/\/showcase\/habit\/new$/);
    await page.getByLabel('Name *').fill('Demo reading');
    const addAnyway = page.getByRole('button', { name: 'Add anyway' });
    if (await addAnyway.count() > 0) {
      await addAnyway.click();
    }
    await page.getByRole('button', { name: 'Create habit' }).last().click();
    await expect(page).toHaveURL(/\/showcase\/habit\//);

    await page.goto('/showcase/stats');
    await expect(page).toHaveURL(/\/showcase\/stats$/);
    await expect(page.getByRole('heading', { name: 'Your scheduled progress' })).toBeVisible();
    await page.goto('/showcase');
    await page.getByRole('button', { name: 'Reset demo' }).click();
    await expect(page.getByRole('button', { name: '✍️ Morning pages', exact: true })).toBeVisible();
    await expect(page.getByText('Demo reading')).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole('button', { name: '✍️ Morning pages', exact: true })).toBeVisible();
    await expect(page.getByText('Demo reading')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(apiRequests).toEqual([]);
    expect(authRequests).toEqual([]);
    expect(persistenceWrites).toEqual([]);
  });

  test('keeps mobile navigation inside the anonymous showcase', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/showcase');

    await page.getByRole('link', { name: 'Stats' }).click();
    await expect(page).toHaveURL(/\/showcase\/stats$/);
    await expect(page.getByRole('heading', { name: 'Your scheduled progress' })).toBeVisible();

    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL(/\/showcase$/);
  });
});
