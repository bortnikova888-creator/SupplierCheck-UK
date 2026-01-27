import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser } from 'playwright';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const distDir = path.resolve(repoRoot, 'apps/web/dist');
const distIndexPath = path.resolve(distDir, 'index.html');
const distAvailable = existsSync(distIndexPath);
const browserExecutable = chromium.executablePath();
const browserAvailable = existsSync(browserExecutable);
const shouldRun = distAvailable && browserAvailable;
const maybeIt = shouldRun ? it : it.skip;

let browser: Browser;

describe('UI smoke test', () => {
  beforeAll(async () => {
    if (!shouldRun) {
      return;
    }
    browser = await chromium.launch();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  maybeIt('shows key pending banner only after lookup', async () => {
    const html = await readFile(distIndexPath, 'utf8');
    const scriptMatch = html.match(/<script[^>]*src="(\/assets\/[^\"]+)"[^>]*><\/script>/i);

    if (!scriptMatch) {
      throw new Error('Unable to find built script in dist/index.html');
    }

    const scriptPath = path.resolve(distDir, scriptMatch[1].replace(/^\//, ''));
    const scriptContent = await readFile(scriptPath, 'utf8');

    const inlineHtml = html
      .replace(/<link rel="stylesheet"[^>]*>/gi, '')
      .replace(scriptMatch[0], `<script type="module">${scriptContent}</script>`);

    const page = await browser.newPage();

    await page.addInitScript(() => {
      const originalFetch = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        const url = typeof input === 'string' ? input : input.url;

        if (url.includes('/health')) {
          return new Response(
            JSON.stringify({
              status: 'ok',
              timestamp: new Date().toISOString(),
              service: 'api',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        if (url.includes('/api/search')) {
          return new Response(
            JSON.stringify({
              error: {
                code: 'COMPANIES_HOUSE_API_KEY_PENDING',
                message: 'Companies House API key pending',
                statusCode: 503,
              },
            }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        }

        return originalFetch(input, init);
      };
    });

    await page.setContent(inlineHtml, { waitUntil: 'domcontentloaded' });

    const pendingBanner = page.getByText('Companies House API key pending');
    expect(await pendingBanner.isVisible()).toBe(false);

    await page.getByPlaceholder('Search companies').fill('Marine');
    await page.getByRole('button', { name: 'Search' }).click();

    await page.waitForSelector('text=Companies House API key pending');
    expect(await pendingBanner.isVisible()).toBe(true);

    await page.close();
  });
});
