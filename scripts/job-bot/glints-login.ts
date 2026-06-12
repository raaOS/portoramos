/**
 * Glints Login — Otomasi login ke Glints untuk Job Hunter Bot.
 *
 * Menggunakan Playwright untuk melakukan login otomatis ke Glints
 * dan menyimpan session state untuk scraper loker.
 *
 * @module scripts/job-bot/glints-login
 */
import dotenv from 'dotenv';
import { chromium } from 'playwright';
import {
  ensureGlintsSessionDir,
  glintsProfilePath,
} from '../../src/lib/services/glintsBrowserService';

dotenv.config({ path: '.env.local', quiet: true });

async function main() {
  const storageStatePath = await ensureGlintsSessionDir();
  const profilePath = glintsProfilePath();
  const context = await chromium.launchPersistentContext(profilePath, {
    channel: 'chrome',
    headless: false,
    slowMo: 80,
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    viewport: { width: 1280, height: 900 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    ignoreDefaultArgs: ['--enable-automation'],
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
      '--no-default-browser-check',
    ],
  });
  const page = await context.newPage();

  console.log('[Glints Login] Browser opened.');
  console.log(`[Glints Login] Using Chrome profile: ${profilePath}`);
  console.log('[Glints Login] Login manually in the browser window.');
  console.log(
    '[Glints Login] If Google still blocks OAuth, use Glints email/password login in this Chrome window.'
  );
  console.log('[Glints Login] Session will be saved once the page leaves /login.');

  await page.goto('https://glints.com/id/login', {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });

  await page
    .waitForURL((url) => url.hostname.includes('glints.com') && !url.pathname.includes('/login'), {
      timeout: 600_000,
    })
    .catch(() => undefined);

  if (page.url().includes('/login')) {
    console.error('[Glints Login] Login was not detected. Session was not saved.');
    await context.close();
    process.exitCode = 1;
    return;
  }

  await context.storageState({ path: storageStatePath });
  console.log(`[Glints Login] Session saved: ${storageStatePath}`);

  await context.close();
}

void main().catch((error) => {
  console.error('[Glints Login] Failed:', error);
  process.exitCode = 1;
});
