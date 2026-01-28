import type { Browser } from 'playwright';

let browserPromise: Promise<Browser> | null = null;
let isClosing = false;
let shutdownRegistered = false;

async function launchBrowser(): Promise<Browser> {
  const { chromium } = await import('playwright');
  return chromium.launch();
}

async function closeBrowser(): Promise<void> {
  if (!browserPromise || isClosing) {
    return;
  }

  isClosing = true;
  try {
    const browser = await browserPromise;
    await browser.close();
  } catch (error) {
    console.error('Failed to close Playwright browser.', error);
  } finally {
    browserPromise = null;
    isClosing = false;
  }
}

function registerShutdownHooks(): void {
  if (shutdownRegistered) {
    return;
  }

  shutdownRegistered = true;

  const handleShutdown = () => {
    void closeBrowser().finally(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);
  process.on('beforeExit', () => {
    void closeBrowser();
  });
  process.on('exit', () => {
    void closeBrowser();
  });
}

export async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = launchBrowser();
    registerShutdownHooks();
  }

  return browserPromise;
}
