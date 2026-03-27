import { test, expect } from '@playwright/test';

test('3D Infinite Canvas should load and be interactive', async ({ page }) => {
    // Navigate to projects page with 3D view
    await page.goto('/projects?view=3d');

    // Wait for the canvas to load
    const canvas = page.locator('div[style*="perspective"]');
    await expect(canvas).toBeVisible();

    // Check for project cards
    const cards = page.locator('.absolute.left-1\\/2.top-1\\/2');
    await expect(cards.first()).toBeVisible();

    // Verify at least some cards are rendered
    const count = await cards.count();
    console.log(`Verified ${count} cards on 3D canvas`);
    expect(count).toBeGreaterThan(0);

    // Simulate drag interaction
    const box = await canvas.boundingBox();
    if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 100);
        await page.mouse.up();
    }

    // Check for no console errors
    const errors: string[] = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });

    // Perform a small scroll
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(1000);

    expect(errors.length).toBe(0);
});
