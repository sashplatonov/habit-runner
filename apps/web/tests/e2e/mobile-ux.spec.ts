import { expect, test, type Page } from '@playwright/test';

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test.describe('compact mobile UX baseline', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name === 'desktop', 'These assertions target the mobile shell.');
  });

  test('keeps Today actions and navigation reachable', async ({ page }) => {
    await page.goto('/showcase');

    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Stats' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'New habit' })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole('button', { name: 'More actions' }).click();
    await expect(page.getByRole('button', { name: 'Search habits' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Choose color theme' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Close menu' }).last().click();
    await expect(page.getByRole('button', { name: 'More actions' })).toBeFocused();

    await page.getByRole('button', { name: 'More actions' }).click();
    await page.getByRole('button', { name: 'Search habits' }).click();
    await expect(page.getByRole('searchbox', { name: 'Search habits' })).toBeFocused();
    await expectNoHorizontalOverflow(page);
  });

  test('keeps Progress readable and switchable', async ({ page }) => {
    await page.goto('/showcase/stats');

    await expect(page.getByRole('heading', { name: 'Simple progress that pushes you forward.' })).toBeVisible();
    await expect(page.getByRole('button', { name: '4 weeks' })).toBeVisible();
    await expect(page.getByRole('button', { name: '12 weeks' })).toBeVisible();
    await expect(page.getByRole('button', { name: '4 weeks' })).toHaveCSS('min-height', '44px');
    await expect(page.getByRole('link', { name: 'Back to today' })).toBeHidden();
    await page.getByRole('button', { name: '4 weeks' }).click();
    await expect(page.getByRole('button', { name: '4 weeks' })).toHaveAttribute('aria-pressed', 'true');
    await expectNoHorizontalOverflow(page);
  });

  test('keeps theme choices reachable inside More', async ({ page }) => {
    await page.goto('/showcase');
    await page.getByRole('button', { name: 'More actions' }).click();

    const themeButton = page.getByRole('button', { name: 'Switch to Midnight theme' });
    await expect(themeButton).toBeVisible();
    await expect(themeButton).toHaveCSS('min-height', '56px');
    await themeButton.click();
    await expect.poll(() => page.locator('html').getAttribute('data-theme')).toBe('midnight');
    await expectNoHorizontalOverflow(page);
  });
});
