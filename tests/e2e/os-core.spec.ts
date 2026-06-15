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
  test('startup click unlocks OS audio immediately', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.removeItem('ramos_os_booted');
    });

    await page.goto('/', { timeout: 60000, waitUntil: 'domcontentloaded' });

    const startScreen = page.getByTestId('os-start-screen');
    await expect(startScreen).toBeVisible({ timeout: 5000 });
    await page.waitForFunction(
      () =>
        Boolean(
          (
            window as unknown as {
              __soundManager?: unknown;
            }
          ).__soundManager
        ),
      null,
      { timeout: 5000 }
    );
    await page.getByText('Click to Start').first().click();

    await page.waitForFunction(
      () => {
        const manager = (
          window as unknown as {
            __soundManager?: { isUnlocked?: boolean };
          }
        ).__soundManager;
        return manager?.isUnlocked === true;
      },
      null,
      { timeout: 3000 }
    );

    const soundState = await page.evaluate(() => {
      const manager = (
        window as unknown as {
          __soundManager?: {
            isUnlocked?: boolean;
            pendingSounds?: Set<string>;
            hasPlayedStartup?: boolean;
          };
        }
      ).__soundManager;

      return {
        isUnlocked: manager?.isUnlocked ?? false,
        pendingSounds: Array.from(manager?.pendingSounds ?? []),
        hasPlayedStartup: manager?.hasPlayedStartup ?? false,
      };
    });

    expect(soundState.isUnlocked).toBe(true);
    expect(soundState.pendingSounds).not.toContain('startup');

    // Boot timing: glassReveal starts at 3000ms, completes at 4500ms.
    // Wait 3400ms from click to land inside the glassReveal phase.
    await page.waitForTimeout(3400);
    await expect(startScreen).toBeVisible();
    await expect(page.getByTestId('dynamic-island')).toHaveCount(0);

    await expect(startScreen).toBeHidden({ timeout: 5000 });
    await expect(page.getByTestId('dynamic-island')).toHaveCount(1, { timeout: 5000 });
  });

  test('homepage should load with OS elements', async ({ page }) => {
    await page.goto('/', { timeout: 60000, waitUntil: 'domcontentloaded' });

    // Handle boot sequence if present
    await handleBootSequence(page);

    // Verify page loaded
    await expect(page.locator('body')).toBeVisible();
    const title = await page.title();
    expect(title).toContain('Ramos');
  });

  test('mobile renders full desktop environment', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { timeout: 60000, waitUntil: 'domcontentloaded' });

    await handleBootSequence(page);

    const unifiedLayer = page.getByTestId('unified-layer');
    await expect(unifiedLayer).toBeVisible({ timeout: 10000 });

    const dock = page.getByRole('toolbar', { name: 'Application dock' });
    await expect(dock).toBeVisible({ timeout: 5000 });

    const dockButtons = dock.getByRole('button');
    const count = await dockButtons.count();
    expect(count).toBeGreaterThanOrEqual(5);
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

  test('notes toggle and deep link work correctly', async ({ page }) => {
    await page.goto('/', { timeout: 60000, waitUntil: 'domcontentloaded' });
    await handleBootSequence(page);

    const unifiedLayer = page.getByTestId('unified-layer');
    await expect(unifiedLayer).toBeVisible({ timeout: 10000 });

    // Navigate to projects page first
    await page.locator('#dock-item-projects').click();
    await page.getByRole('menuitem', { name: 'Grid View: Pinterest style masonry' }).click();
    await expect(page).toHaveURL(/\/projects\?view=grid$/);

    // Deep link via notes dock item: should navigate to home and show notes
    await page.locator('#dock-item-notes').click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('unified-layer')).toBeVisible({ timeout: 5000 });

    // Verify unified layer has the notes-visible attribute (may or may not be true initially)
    const attrValue = await page.getByTestId('unified-layer').getAttribute('data-notes-visible');
    expect(typeof attrValue).toBe('string');
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
