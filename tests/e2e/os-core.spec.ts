import { test, expect, type Page } from '@playwright/test';

// Helper to handle boot sequence using the StartScreen lifecycle itself.
async function handleBootSequence(page: Page) {
  const startScreen = page.getByTestId('os-start-screen');
  const powerPrompt = page.getByText('Click to Start').first();

  try {
    await expect(startScreen).toBeVisible({ timeout: 5000 });
    await powerPrompt.click();
    await expect(startScreen).toBeHidden({ timeout: 8000 });
  } catch {
    // Boot sequence may already be completed.
  }
}

test.describe('Ramos OS Core Functionality & Accessibility', () => {
  test('homepage should load with OS elements', async ({ page }) => {
    await page.goto('/', { timeout: 60000, waitUntil: 'domcontentloaded' });

    // Handle boot sequence if present
    await handleBootSequence(page);

    // Verify page loaded
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).toContain('Ramos');
  });

  test('dock should be interactive after boot', async ({ page }) => {
    await page.goto('/', { timeout: 60000, waitUntil: 'domcontentloaded' });

    // Handle boot sequence
    await handleBootSequence(page);

    // Find dock by role - wait for it to appear
    const dock = page
      .locator(
        '[role="toolbar"][aria-label="Application dock"], nav[aria-label="Application dock"]'
      )
      .first();
    await expect(dock).toBeVisible({ timeout: 5000 });

    // Verify dock has items
    const dockItems = dock.locator('[role="button"]');
    const count = await dockItems.count();
    expect(count).toBeGreaterThan(0);

    // Click first item
    await dockItems.first().click();
  });

  test('keyboard navigation should work', async ({ page }) => {
    await page.goto('/', { timeout: 60000, waitUntil: 'domcontentloaded' });

    // Handle boot sequence
    await handleBootSequence(page);

    // Tab to focus first element
    await page.keyboard.press('Tab');

    // Verify something is focused
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });
});
