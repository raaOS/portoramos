const { chromium } = require('playwright');
const path = require('path');

async function snapshotChat() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });

  try {
    console.log('Navigating to homepage...');
    await page.goto('http://localhost:3000');

    console.log('Waiting for OS to load...');
    await page.waitForTimeout(4000);

    console.log('Clicking the Testimonial App Icon...');
    // Find the icon by its label text
    const testimonialApp = page.getByText('Testimonials', { exact: true }).first();
    if ((await testimonialApp.count()) > 0) {
      await testimonialApp.dblclick();
    } else {
      console.log(
        'Could not find exact text. Clicking the first desktop icon containing Testimonial...'
      );
      await page.locator('text=Testimonial').first().dblclick();
    }

    console.log('Waiting for Chat Window...');
    await page.waitForTimeout(3000);

    // Click on "Bram - Digital Agency" who has the "Kolase Lanskap Menanjak" video project
    const bramContact = await page.locator('text=Bram').first();
    if ((await bramContact.count()) > 0) {
      console.log('Clicking Bram contact...');
      await bramContact.click();
      await page.waitForTimeout(2000);
    }

    const outPath = path.join(process.cwd(), 'chat_fix_verification.png');
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`Saved screenshot to ${outPath}`);
  } catch (e) {
    console.error('Error during snapshot:', e);
  } finally {
    await browser.close();
  }
}

snapshotChat();
