import { expect, test } from '@playwright/test';

test.describe('public showcase', () => {
  test('renders a read-only preview without API or persistence activity', async ({ page }) => {
    const apiRequests: string[] = [];
    const persistenceWrites: string[] = [];
    await page.on('request', (request) => {
      if (request.url().includes('/api/')) {
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
    await expect(page.getByRole('heading', { name: 'See the habit loop before you sign in.' })).toBeVisible();
    await expect(page.getByRole('status', { name: 'Showcase status' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'A calm next-action list' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'A change needs your attention' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in to use the app' })).toHaveAttribute('href', '/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(apiRequests).toEqual([]);
    expect(persistenceWrites).toEqual([]);
  });
});
