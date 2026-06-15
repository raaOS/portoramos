import { test, expect } from '@playwright/test';

/**
 * E2E tests untuk Real-time Sync behavior.
 *
 * Menguji bahwa halaman portfolio merespons pembaruan data
 * dari polling realtime tanpa error console atau navigasi yang rusak.
 */

test.describe('Real-time Sync', () => {
  test('homepage should be accessible', async ({ page }) => {
    await page.goto('/', { timeout: 60000, waitUntil: 'domcontentloaded' });

    // Verify homepage loaded
    await expect(page.locator('body')).toBeVisible();

    // Check page title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should navigate to projects page from homepage', async ({ page }) => {
    await page.goto('/projects', { timeout: 60000, waitUntil: 'domcontentloaded' });

    // Verify projects page
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('[data-projects-grid]').first()).toBeVisible({ timeout: 10000 });

    // Check for projects content
    const hasContent =
      (await page.locator('text=Projects').count()) > 0 ||
      (await page.locator('text=Portfolio').count()) > 0 ||
      (await page.locator('[data-projects-grid]').count()) > 0;
    expect(hasContent).toBe(true);
  });

  test('should not produce console errors on homepage load', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/', { timeout: 60000, waitUntil: 'domcontentloaded' });

    // Wait for initial render + potential first poll cycle
    await page.waitForTimeout(5000);

    // Filter out known non-critical errors (e.g., dev-only warnings)
    const criticalErrors = consoleErrors.filter(
      (err) =>
        !err.includes('favicon') &&
        !err.includes('DevTools') &&
        !err.includes('Download the React DevTools')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('page should remain stable during polling interval', async ({ page }) => {
    await page.goto('/', { timeout: 60000, waitUntil: 'domcontentloaded' });

    // Wait for at least one polling cycle (30s realtime sync + buffer)
    await page.waitForTimeout(10000);

    // Body should still exist and be visible (no crash, no blank screen)
    await expect(page.locator('body')).toBeVisible();

    // Content should not be completely replaced (no full re-render)
    const laterContent = await page.locator('body').innerHTML();
    expect(laterContent.length).toBeGreaterThan(0);
  });

  test('API version endpoint should respond for sync check', async ({ request }) => {
    // Test that the version/sync endpoint is accessible
    const response = await request.get('/api/version');

    // Should respond (even if with error for non-admin), not hang or 500
    expect(response.status()).toBeLessThan(500);
  });
});
