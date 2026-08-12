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
  { path: '/showcase', output: path.join(webScreenshotDirectory, 'desktop.png'), viewport: { width: 1280, height: 720 } },
  { path: '/showcase/habit/morning-pages', output: path.join(webScreenshotDirectory, 'habit-detail.png'), viewport: { width: 1280, height: 720 } },
  { path: '/showcase/stats', output: path.join(webScreenshotDirectory, 'progress.png'), viewport: { width: 1280, height: 720 } },
  { path: '/showcase', output: path.join(webScreenshotDirectory, 'mobile.png'), viewport: { width: 390, height: 844 } },
  { path: '/showcase', output: path.join(documentationAssetDirectory, 'github-social-preview.png'), viewport: { width: 1280, height: 640 } }
];

await fs.mkdir(webScreenshotDirectory, { recursive: true });
await fs.mkdir(documentationAssetDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
  for (const capture of captures) {
    const page = await browser.newPage({ viewport: capture.viewport, deviceScaleFactor: 1 });
    await page.goto(new URL(capture.path, baseUrl).toString(), { waitUntil: 'networkidle' });
    await page.screenshot({ path: capture.output, fullPage: false });
    await page.close();
  }
} finally {
  await browser.close();
}
