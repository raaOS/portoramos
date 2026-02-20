import { test, expect } from '@playwright/test';

test.describe('Grade A Public Experience', () => {

    test('Homepage loads Desktop Environment', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('body')).toBeVisible();

        // Homepage now shows macOS-style Desktop Environment
        // Check for dock (toolbar) presence
        const dock = page.locator('[role="toolbar"][aria-label="Application dock"]');
        await expect(dock).toBeVisible({ timeout: 15000 });

        // Check for menu bar area
        await expect(page.locator('body')).toContainText(/Finder/i);
    });

    test('Projects page loads correctly', async ({ page }) => {
        await page.goto('/projects');
        await expect(page.locator('body')).toBeVisible();

        // Check for masonry grid items or main content on projects page
        const grid = page.locator('.masonry-grid');
        await expect(grid).toBeVisible({ timeout: 10000 });
    });

    test('Contact page loads with CTA', async ({ page }) => {
        await page.goto('/contact');
        await expect(page.locator('body')).toBeVisible();

        // Contact page should have call-to-action content
        await expect(page.locator('body')).toContainText(/Project|Chat|Contact/i);
    });

    test('Project Detail opens from Grid', async ({ page }) => {
        await page.goto('/projects');

        // Wait for grid to load
        await page.waitForSelector('.masonry-grid', { timeout: 10000 });

        // Click first project card
        const firstProjectLink = page.locator('.masonry-grid a').first();

        if (await firstProjectLink.count() > 0) {
            const href = await firstProjectLink.getAttribute('href');
            console.log('Navigating to project:', href);

            await firstProjectLink.click();
            await expect(page).toHaveURL(new RegExp(href!));

            // Verify project detail loads
            await expect(page.locator('h1')).toBeVisible();
        } else {
            console.log('No projects found in grid to test navigation');
        }
    });

});
