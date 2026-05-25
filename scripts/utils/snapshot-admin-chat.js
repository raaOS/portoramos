const { chromium } = require('playwright');
const path = require('path');

async function snapshotAdminChat() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });

  try {
    console.log('Navigating to Admin Testimonial...');
    // Login bypass by setting cookie or just typing it in
    await page.goto('http://localhost:3000/admin/testimonial');

    // Wait for password prompt
    const passwordInput = await page.locator('input[type="password"]');
    if ((await passwordInput.count()) > 0) {
      await passwordInput.fill(process.env.ADMIN_PASSWORD || 'rahasia123');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
    }

    console.log('Waiting for Testimonials to load...');
    await page.waitForTimeout(3000);

    // Click on the first testimonial to open the editor
    const firstChat = await page.locator('text=Bram - Digital Agency').first();
    if ((await firstChat.count()) > 0) {
      console.log('Clicking Bram contact...');
      await firstChat.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('Clicking first available contact...');
      await page.mouse.click(200, 200);
      await page.waitForTimeout(2000);
    }

    const outPath = path.join(process.cwd(), 'admin_chat_fix_verification.png');
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`Saved screenshot to ${outPath}`);
  } catch (e) {
    console.error('Error during snapshot:', e);
  } finally {
    await browser.close();
  }
}

snapshotAdminChat();
