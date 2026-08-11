import { expect, test } from '@playwright/test';

test.describe('public showcase', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name === 'telegram-webview', 'Telegram user agents intentionally enter the Mini App flow.');
  });

  test('runs an interactive demo without API or persistence activity', async ({ page }) => {
    const apiRequests: string[] = [];
    const persistenceWrites: string[] = [];
    await page.on('request', (request) => {
      if (new URL(request.url()).pathname.startsWith('/api/')) {
        apiRequests.push(request.url());
      }
    });
    await page.addInitScript(() => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key: string, value: string) {
        window.dispatchEvent(new CustomEvent('showcase-storage-write', { detail: key }));
        return originalSetItem.call(this, key, value);
      };
    });
    await page.exposeFunction('recordShowcaseStorageWrite', (key: string) => persistenceWrites.push(key));
    await page.addInitScript(() => {
      window.addEventListener('showcase-storage-write', (event) => {
        void (window as Window & { recordShowcaseStorageWrite?: (key: string) => void }).recordShowcaseStorageWrite?.((event as CustomEvent<string>).detail);
      });
    });

    await page.goto('/showcase');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Temporary showcase.')).toBeVisible();
    await expect(page.getByRole('button', { name: '✍️ Morning pages', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '📚 Read one chapter', exact: true })).toBeVisible();
    if (await page.getByRole('button', { name: 'More actions' }).count() > 0) {
      await page.getByRole('button', { name: 'More actions' }).click();
    } else {
      await page.getByRole('button', { name: 'Choose color theme' }).click();
    }
    await page.getByRole('button', { name: 'Switch to Midnight theme' }).click();
    await expect.poll(() => page.locator('html').getAttribute('data-theme')).toBe('midnight');
    await page.getByRole('button', { name: 'Reset demo' }).click();
    await page.goto('/showcase/habit/morning-pages');
    await expect(page).toHaveURL(/\/showcase\/habit\/morning-pages/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(apiRequests).toEqual([]);
    expect(persistenceWrites).toEqual([]);
  });
});
