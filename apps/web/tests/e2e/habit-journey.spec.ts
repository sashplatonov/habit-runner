import { expect, test, type Page, type Route } from '@playwright/test';

const habit = {
  id: 'e2e-habit',
  name: 'Read for ten minutes',
  description: 'E2E habit',
  color: 'blue',
  icon: '📚',
  frequency: 'DAILY',
  customDays: [],
  schedule: null,
  targetStreak: 7,
  dailyTarget: 1,
  tags: [],
  archived: false,
  createdAt: '2026-08-08T10:00:00Z',
  updatedAt: '2026-08-08T10:00:00Z',
  version: 1,
  sortOrder: 1,
  reminderTime: null,
  reminderEnabled: true,
  type: 'positive',
  freezeDays: []
};

const secondHabit = {
  ...habit,
  id: 'e2e-second-habit',
  name: 'Stretch for five minutes',
  icon: '🧘'
};

async function json(route: Route, body: unknown, status = 200): Promise<void> {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function mockBackend(page: Page): Promise<void> {
  await page.route(/\/(?:api\/)?auth\//, async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.includes('/auth/session') || pathname.includes('/auth/preferences')) {
      await json(route, pathname.includes('/auth/session')
        ? { userId: 'e2e-user', email: 'e2e@example.test' }
        : { themeId: 'default' });
      return;
    }
    if (pathname.endsWith('/auth/logout')) {
      await route.fulfill({ status: 204 });
      return;
    }
    await route.continue();
  });
  await page.route(/\/(?:api\/)?habits(?:\/|$)/, async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (pathname.endsWith('/habits') && request.method() === 'GET') {
      await json(route, [habit, secondHabit]);
    } else if (pathname.endsWith('/habits') && request.method() === 'POST') {
      const payload = JSON.parse(request.postData() ?? '{}') as Record<string, unknown>;
      await json(route, { ...habit, ...payload, id: 'e2e-created', name: payload['name'] ?? habit.name });
    } else if (pathname.includes('/habits/') && request.method() === 'PUT') {
      await json(route, { ...habit, id: 'e2e-created', name: 'Read for twenty minutes', version: 2 });
    } else if (pathname.includes('/habits/') && request.method() === 'DELETE') {
      await route.fulfill({ status: 204 });
    } else {
      await route.continue();
    }
  });
  await page.route(/\/(?:api\/)?checkins(?:\/|$)/, async (route) => {
    if (route.request().method() === 'GET') {
      await json(route, []);
    } else if (route.request().method() === 'PUT') {
      await json(route, {
        id: 'e2e-checkin', habitId: 'e2e-created', date: '2026-08-08', done: true,
        count: 1, createdAt: '2026-08-08T10:00:00Z', updatedAt: '2026-08-08T10:00:00Z', version: 1
      });
    } else {
      await route.fulfill({ status: 204 });
    }
  });
}

async function seedSession(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('habbitRunner.auth.session', JSON.stringify({ userId: 'e2e-user', email: 'e2e@example.test' }));
  });
}

async function openHabitDetails(page: Page): Promise<void> {
  if (await page.getByRole('button', { name: 'Edit habit' }).isVisible()) {
    return;
  }
  await page
    .getByRole('article', { name: /Read for ten minutes/ })
    .getByRole('button')
    .filter({ hasText: 'Read for ten minutes' })
    .click();
}

test.describe.serial('critical habit journey', () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page);
    await mockBackend(page);
  });

  test('creates, checks in, edits, reviews progress, and deletes a habit', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.getByRole('button', { name: 'Add habit' }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Add habit' }).first().click();
    await page.getByLabel('Name *').fill('Read for ten minutes');
    await page.getByRole('button', { name: 'Create habit' }).last().click();
    await expect(page).toHaveURL(/\/app\/dashboard|\/app\/habit\//);

    await openHabitDetails(page);
    await expect(page.getByText(/Read for ten minutes/).first()).toBeVisible();

    await page.goto('/app/stats');
    await expect(page.getByRole('heading', { name: /Simple progress/ })).toBeVisible();

    await page.goto('/app/dashboard');
    await openHabitDetails(page);
    await page.getByRole('button', { name: 'Edit habit' }).click();
    await page.getByLabel('Name *').fill('Read for twenty minutes');
    await page.getByRole('button', { name: 'Save habit' }).last().click();
    await expect(page.getByRole('button', { name: 'Delete habit' })).toBeVisible();

    await page.getByRole('button', { name: 'Delete habit' }).click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
  });

  test('shows safe validation state', async ({ page }) => {
    await page.route(/\/(?:api\/)?habits$/, async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            type: 'https://habbit-runner.dev/errors/validation',
            title: 'Constraint Violation',
            status: 400,
            detail: 'create.name must not be blank',
            errorCode: 'VALIDATION_FAILED'
          })
        });
        return;
      }
      await route.continue();
    });
    await page.goto('/app/habit/new');
    await page.getByLabel('Name *').fill('Conflict proof');
    await page.getByRole('button', { name: 'Create habit' }).last().click();
    await expect(page.getByRole('alert')).toContainText('Check the highlighted fields');
  });

  test('keeps dashboard heatmaps usable in compact and comfortable layouts', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.goto('/app/dashboard');

    await page.getByRole('button', { name: 'View options' }).click();
    await page.getByRole('region', { name: 'Dashboard view options' }).getByRole('button', { name: 'List' }).click();
    await expect(page.locator('li[data-habit-id]')).toHaveCount(2);
    await expect(page.locator('li[data-habit-id]').first().getByRole('img', { name: /last 30 days/ })).toBeVisible();
    await expect(page.locator('li[data-habit-id]').first().getByRole('button', { name: '📚 Read for ten minutes', exact: true })).toBeVisible();
    await expect(page.locator('li[data-habit-id]').first().getByRole('button', { name: /Complete/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.getByRole('region', { name: 'Dashboard view options' }).getByRole('button', { name: 'Cards' }).click();
    const tiles = page.locator('article[aria-label*="completed"], article[aria-label*="not completed"]');
    await expect(tiles).toHaveCount(2);
    for (const tile of await tiles.all()) {
      const heatmap = tile.getByRole('img', { name: /last 30 days/ });
      await expect(heatmap).toBeVisible();
      const tileBox = await tile.boundingBox();
      const heatmapBox = await heatmap.boundingBox();
      expect(tileBox).not.toBeNull();
      expect(heatmapBox).not.toBeNull();
      expect(heatmapBox!.x).toBeGreaterThanOrEqual(tileBox!.x);
      expect(heatmapBox!.x + heatmapBox!.width).toBeLessThanOrEqual(tileBox!.x + tileBox!.width);
      await expect(tile.getByRole('button', { name: /Complete/ })).toBeVisible();
      await expect(tile.locator('button').filter({ hasText: /Read for ten minutes|Stretch for five minutes/ })).toBeVisible();
    }
  });

  test('keeps description feedback usable at compact mobile and desktop widths', async ({ page }) => {
    for (const viewport of [{ width: 320, height: 740 }, { width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport);
      await page.goto('/app/habit/new');

      const description = page.getByLabel(/Description/);
      await description.fill('x'.repeat(8000));

      await expect(page.getByText('8000 / 8000 characters')).toBeVisible();
      await expect(page.getByText('0 remaining')).toBeVisible();
      await expect(description).toHaveAttribute('maxlength', '8000');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });

  test('shows safe conflict state', async ({ page }) => {
    await page.goto('/app/dashboard');
    await openHabitDetails(page);
    await page.getByRole('button', { name: 'Edit habit' }).click();
    await page.route(/\/(?:api\/)?habits\//, async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            type: 'https://habbit-runner.dev/errors/conflict',
            title: 'Conflict',
            status: 409,
            detail: 'stale version',
            errorCode: 'RESOURCE_VERSION_CONFLICT'
          })
        });
        return;
      }
      await route.continue();
    });
    await page.getByLabel('Name *').fill('Conflict proof updated');
    await page.getByRole('button', { name: 'Save habit' }).last().click();
    await expect(page.getByRole('alert')).toContainText('changed elsewhere');
  });
});
