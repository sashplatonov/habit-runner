import { expect, test, type Page } from '@playwright/test';

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test.describe('public site', () => {
  test('offers a clear demo path from the landing page', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'telegram-webview', 'Telegram launches use the Mini App entry flow.');

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Keep the next good habit close.' })).toBeVisible();
    const demoLink = page.getByRole('link', { name: 'Open the interactive demo' });
    await expect(demoLink).toBeVisible();
    await expect(demoLink).toHaveCSS('min-height', '44px');
    await demoLink.click();
    await expect(page).toHaveURL(/\/showcase$/);
  });

  test('keeps the public shell usable on compact screens', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'desktop', 'This assertion targets compact layouts.');

    await page.goto('/blog');
    await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const menu = page.getByRole('button', { name: 'Open navigation menu' });
    await menu.click();
    await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Open navigation menu' })).toBeFocused();
    await expectNoHorizontalOverflow(page);
  });

  test('fits a narrow phone and tablet public layout', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'This test owns explicit viewport coverage.');

    for (const viewport of [{ width: 320, height: 740 }, { width: 768, height: 900 }]) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await expect(page.getByRole('heading', { name: 'Keep the next good habit close.' })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });

  test('keeps each desktop blog card cover and copy aligned', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'This assertion targets the two-column card layout.');

    await page.goto('/blog');
    const card = page.getByTestId('blog-post-card').first();
    const cover = card.locator('img');
    const copy = card.getByTestId('blog-post-card-copy');
    const [coverBox, copyBox] = await Promise.all([cover.boundingBox(), copy.boundingBox()]);

    expect(coverBox).not.toBeNull();
    expect(copyBox).not.toBeNull();
    expect(copyBox!.x).toBeGreaterThan(coverBox!.x);
    expect(Math.abs(copyBox!.y - coverBox!.y)).toBeLessThan(2);
  });

  for (const route of ['/features', '/about', '/habit-tracker', '/streak-tracker', '/daily-routine-planner', '/vs/habitica', '/vs/streaks-app', '/vs/beeminder', '/blog', '/blog/best-habit-tracker-pwa']) {
    test(`renders ${route} without public-page overflow`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('main')).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  }
});
