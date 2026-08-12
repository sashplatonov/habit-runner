import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDirectory, '..');
const repositoryRoot = path.resolve(webRoot, '..', '..');
const baseUrl = process.env.SCREENSHOT_BASE_URL ?? 'http://127.0.0.1:4173';
const webScreenshotDirectory = path.join(webRoot, 'static', 'screenshots');
const documentationAssetDirectory = path.join(repositoryRoot, 'docs', 'assets', 'screenshots');

const captures = [
  { path: '/showcase', output: path.join(webScreenshotDirectory, 'desktop.png'), viewport: { width: 1440, height: 900 } },
  { path: '/showcase/habit/morning-pages', output: path.join(webScreenshotDirectory, 'habit-detail.png'), viewport: { width: 1440, height: 900 } },
  { path: '/showcase/stats', output: path.join(webScreenshotDirectory, 'progress.png'), viewport: { width: 1440, height: 900 } },
  {
    path: '/showcase',
    output: path.join(webScreenshotDirectory, 'mobile.png'),
    viewport: { width: 390, height: 844 },
    context: {
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36 TelegramWebview'
    }
  },
  { path: '/showcase', output: path.join(documentationAssetDirectory, 'github-social-preview.png'), viewport: { width: 1280, height: 640 } }
];

await fs.mkdir(webScreenshotDirectory, { recursive: true });
await fs.mkdir(documentationAssetDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
  for (const capture of captures) {
    const context = await browser.newContext({ viewport: capture.viewport, deviceScaleFactor: 1, ...capture.context });
    const page = await context.newPage();
    await page.goto(new URL(capture.path, baseUrl).toString(), { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: '[data-showcase-notice] { display: none !important; }' });
    await page.screenshot({ path: capture.output, fullPage: false });
    await context.close();
  }
} finally {
  await browser.close();
}
