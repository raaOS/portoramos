import { test, expect } from '@playwright/test';

test.describe('Ramos OS Core Functionality & Accessibility', () => {

    test.beforeEach(async ({ page }) => {
        // Go to the homepage where the OS is rendered
        await page.goto('/');

        // Wait for hydration and StartScreen to mount
        await page.waitForTimeout(3000);

        // Click and press space to start the boot sequence
        // We click the main boot overlay (z-[10000])
        const startScreen = page.locator('div.fixed.inset-0.z-\\[10000\\]');
        if (await startScreen.count() > 0) {
            await startScreen.click({ force: true });
        }
        await page.keyboard.press('Space');

        // Wait for the boot sequence to finish (StartScreen takes ~5-7s total)
        await expect(startScreen).not.toBeVisible({ timeout: 30000 });
    });

    test('should open a window from the dock', async ({ page }) => {
        // Find a dock item (e.g., About Me)
        const aboutDockItem = page.locator('[role="button"][aria-label="About Me"]');
        await expect(aboutDockItem).toBeVisible();

        await aboutDockItem.click();

        // Check if the About Me window appears
        const aboutWindow = page.locator('[role="dialog"][aria-label="Finder: About Me"]');
        await expect(aboutWindow).toBeVisible();
        await expect(aboutWindow).toContainText(/Ramos/i);
    });

    test('should close window using Escape key', async ({ page }) => {
        // Open a window first (Trash)
        const trashDockItem = page.locator('[role="button"][aria-label="Trash"]');
        await trashDockItem.click();

        const trashWindow = page.locator('[role="dialog"][aria-label="Recycle Bin"]');
        await expect(trashWindow).toBeVisible();

        // Ensure window is focused
        await trashWindow.click();

        // Press Escape
        await page.keyboard.press('Escape');

        // Check if window is closed
        await expect(trashWindow).not.toBeVisible();
    });

    test('should maintain focus trap within the window', async ({ page }) => {
        // Open a window with multiple focusable elements (About Me)
        await page.locator('[role="button"][aria-label="About Me"]').click();
        const aboutWindow = page.locator('[role="dialog"][aria-label="Finder: About Me"]');
        await expect(aboutWindow).toBeVisible();

        // Focus the window
        await aboutWindow.focus();

        // Get all focusable elements in the window
        const focusable = aboutWindow.locator('button, [role="button"], input, textarea, [tabindex="0"]');
        const count = await focusable.count();
        expect(count).toBeGreaterThan(1);

        // Tab through elements and verify it loops back
        for (let i = 0; i < count + 1; i++) {
            await page.keyboard.press('Tab');
        }

        // The focused element should still be contained within the window
        const focusedElement = page.locator(':focus');
        await expect(aboutWindow.locator(focusedElement)).toBeVisible();
    });

    test('desktop icons should have focus rings', async ({ page }) => {
        // Press Tab to focus desktop icons
        await page.keyboard.press('Tab');

        const firstIcon = page.locator('[role="button"][aria-label]').first();
        await firstIcon.focus();

        // Check for focus ring class
        const classes = await firstIcon.getAttribute('class');
        expect(classes).toContain('focus-visible:ring-2');
    });

    test('should support shortcut Ctrl+Enter to maximize window', async ({ page }) => {
        await page.locator('[role="button"][aria-label="Projects"]').click();
        const projectsWindow = page.locator('[role="dialog"][aria-label="Projects"]');
        await expect(projectsWindow).toBeVisible();

        // Focus and press Ctrl+Enter
        await projectsWindow.focus();
        await page.keyboard.press('Control+Enter');

        // Check if maximized (width should be 100%)
        const box = await projectsWindow.boundingBox();
        const viewport = page.viewportSize();
        if (box && viewport) {
            // Allow some deviation for borders/rounding
            expect(box.width).toBeGreaterThan(viewport.width - 10);
        }
    });

});
