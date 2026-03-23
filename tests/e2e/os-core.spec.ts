import { test, expect } from '@playwright/test';

// Helper to handle boot sequence - detects StartScreen by its keyhole/text content
async function handleBootSequence(page: any) {
    // StartScreen has specific text "Click or Press Space"
    const startScreen = page.locator('text=Click or Press Space').first();
    
    if (await startScreen.isVisible().catch(() => false)) {
        // Click to start boot
        await startScreen.click();
        await page.keyboard.press('Space');
        
        // Wait for boot animation (about 5 seconds based on BOOT_CONFIG)
        await page.waitForTimeout(6000);
    }
}

test.describe('Ramos OS Core Functionality & Accessibility', () => {
    test('homepage should load with OS elements', async ({ page }) => {
        await page.goto('/', { timeout: 60000 });
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        
        // Handle boot sequence if present
        await handleBootSequence(page);
        
        // Verify page loaded
        await expect(page.locator('body')).toBeVisible();
        const title = await page.title();
        expect(title).toContain('Ramos');
    });

    test('dock should be interactive after boot', async ({ page }) => {
        await page.goto('/', { timeout: 60000 });
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        
        // Handle boot sequence
        await handleBootSequence(page);
        
        // Find dock by role - wait for it to appear
        const dock = page.locator('nav[role="toolbar"]').first();
        await expect(dock).toBeVisible({ timeout: 5000 });
        
        // Verify dock has items
        const dockItems = dock.locator('[role="button"]');
        const count = await dockItems.count();
        expect(count).toBeGreaterThan(0);
        
        // Click first item
        await dockItems.first().click();
    });

    test('keyboard navigation should work', async ({ page }) => {
        await page.goto('/', { timeout: 60000 });
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        
        // Handle boot sequence
        await handleBootSequence(page);
        
        // Tab to focus first element
        await page.keyboard.press('Tab');
        
        // Verify something is focused
        const focused = page.locator(':focus');
        await expect(focused).toBeVisible();
    });
});
