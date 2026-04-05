import { test, expect } from '@playwright/test';

test('3D Infinite Canvas should load and be interactive', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });

    // Navigate to projects page with 3D view
    await page.goto('/projects?view=3d', { waitUntil: 'domcontentloaded' });

    // Wait for the canvas to load
    const canvas = page.locator('[data-canvas-viewport]');
    await expect(canvas).toBeVisible();
    await expect(page.getByText(/Mode: Infinite Canvas/i)).toBeVisible();

    const visibleCardCount = async () => {
        return page.locator('[data-canvas-card]').evaluateAll((elements) => {
            return elements.filter((element) => {
                const htmlElement = element as HTMLElement;
                const style = window.getComputedStyle(htmlElement);
                const rect = htmlElement.getBoundingClientRect();

                return (
                    style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    Number(style.opacity) > 0.01 &&
                    rect.width > 0 &&
                    rect.height > 0
                );
            }).length;
        });
    };

    await expect.poll(visibleCardCount, { timeout: 15000 }).toBeGreaterThan(0);

    // Verify at least some cards are rendered
    const count = await visibleCardCount();
    console.log(`Verified ${count} visible cards on 3D canvas`);
    expect(count).toBeGreaterThan(0);

    // Simulate drag interaction
    const box = await canvas.boundingBox();
    if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 100);
        await page.mouse.up();
    }

    // Perform a small scroll
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(1000);

    expect(errors.length).toBe(0);
});
