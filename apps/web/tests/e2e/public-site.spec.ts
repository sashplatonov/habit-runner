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

  test('makes the Telegram Mini App a clear secondary entry point', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'telegram-webview', 'Telegram launches use the Mini App entry flow.');

    await page.goto('/');
    const telegramLink = page.getByRole('link', { name: 'Open in Telegram' });
    await expect(telegramLink).toHaveAttribute('href', 'https://t.me/habbit_runner_bot?profile');
    await expect(telegramLink).toHaveAttribute('target', '_blank');
    await expect(telegramLink).toHaveCSS('min-height', '44px');
    await expect(page.getByText('Can I use Habbit Runner from Telegram?', { exact: true })).toBeVisible();

    await page.goto('/features');
    await expect(page.getByRole('heading', { name: 'Ready where you are' })).toBeVisible();
    await expect(page.getByText(/web app on a phone, tablet, or computer.*Telegram Mini App/i)).toBeVisible();
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

  test('keeps compact footer links touch-friendly', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'This assertion targets the narrow viewport.');

    await page.goto('/');
    const footerLinks = page.getByRole('navigation', { name: 'Footer navigation' }).getByRole('link');
    const linkCount = await footerLinks.count();

    for (let index = 0; index < linkCount; index += 1) {
      await expect(footerLinks.nth(index)).toHaveCSS('min-height', '44px');
    }
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
