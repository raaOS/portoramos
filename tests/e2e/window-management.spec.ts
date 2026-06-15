import { test, expect, type Page } from '@playwright/test';

// Helper to handle boot sequence using the StartScreen lifecycle itself.
async function handleBootSequence(page: Page) {
  const startScreen = page.getByTestId('os-start-screen');
  const powerPrompt = page.getByText('Click to Start').first();

  try {
    await expect(startScreen).toBeVisible({ timeout: 5000 });
    await powerPrompt.click();
    await expect(startScreen).toBeHidden({ timeout: 15000 });
  } catch {
    // Boot sequence may already be completed.
  }
}

test.describe('Ramos OS Window Management', () => {
  test.beforeEach(async ({ page }) => {
    // Go to home page
    await page.goto('/', { timeout: 60000, waitUntil: 'domcontentloaded' });
    await handleBootSequence(page);
  });

  test('should open, drag, resize, and close a window', async ({ page }) => {
    // 1. Open 'About' window from the dock. A window tab can share the same accessible name,
    // so use the stable dock id instead of a broad role/name lookup.
    const aboutIcon = page.locator('#dock-item-about');
    await aboutIcon.click();

    // 2. Verify window frame is visible
    const windowFrame = page.getByTestId('window-frame');
    await expect(windowFrame).toBeVisible({ timeout: 5000 });

    // 3. Get initial position and size
    const initialBox = await windowFrame.boundingBox();
    expect(initialBox).not.toBeNull();
    if (!initialBox) return;

    // 4. Test Dragging (via Title Bar)
    const titleBar = page.getByTestId('window-title-bar');
    await titleBar.hover();
    await page.mouse.down();
    // Drag 100px right, 50px down
    await page.mouse.move(initialBox.x + initialBox.width / 2 + 100, initialBox.y + 15 + 50);
    await page.mouse.up();

    const afterDragBox = await windowFrame.boundingBox();
    expect(afterDragBox?.x).toBeGreaterThan(initialBox.x);
    expect(afterDragBox?.y).toBeGreaterThan(initialBox.y);

    // 5. Test Resizing (Right Edge)
    const rightHandle = page.getByTestId('window-resize-e');
    await rightHandle.hover();
    await page.mouse.down();
    // Expand width by 100px
    await page.mouse.move(afterDragBox!.x + afterDragBox!.width + 100, afterDragBox!.y + 100);
    await page.mouse.up();

    const afterResizeBox = await windowFrame.boundingBox();
    expect(afterResizeBox!.width).toBeGreaterThan(afterDragBox!.width);

    // 6. Test Maximize
    const maximizeBtn = page.getByLabel('Maximize window');
    await maximizeBtn.click();

    // Wait for animation
    await page.waitForTimeout(600);

    const maximizedBox = await windowFrame.boundingBox();
    const viewport = page.viewportSize();
    // Maximized window should occupy most of the viewport
    expect(maximizedBox!.width).toBeGreaterThan(viewport!.width - 50);
    expect(maximizedBox!.height).toBeGreaterThan(viewport!.height - 100);

    // 7. Test Close
    const closeBtn = page.getByLabel('Close window');
    await closeBtn.click();

    await expect(windowFrame).toBeHidden({ timeout: 5000 });
  });
});
