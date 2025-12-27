import { test, expect } from '@playwright/test';

test.describe('Grade A Public Experience', () => {

    test('Homepage loads correctly with Masonry Grid', async ({ page }) => {
        await page.goto('/');
        // Title might vary, just check it loads content
        await expect(page.locator('body')).toBeVisible();

        // Check for masonry grid items or main content
        // Adjust selector based on actual class names used in MasonryGrid.tsx
        // Usually .my-masonry-grid_column or similar from react-masonry-css
        const grid = page.locator('.masonry-grid');
        await expect(grid).toBeVisible();
    });

    test('Navigation links work', async ({ page }) => {
        await page.goto('/');

        // Check if Nav exists
        const nav = page.locator('nav');
        await expect(nav).toBeVisible();

        // Navigate to Works (Karya)
        const workLink = page.getByRole('link', { name: /Karya/i }).first();
        if (await workLink.isVisible()) {
            await workLink.click();
            await expect(page).toHaveURL(/.*\/works/);
        }

        // Navigate to About (Tentang)
        const aboutLink = page.getByRole('link', { name: /Tentang/i }).first();
        if (await aboutLink.isVisible()) {
            await aboutLink.click();
            await expect(page).toHaveURL(/.*\/about/);
        }

        // Navigate to Contact (Kontak)
        const contactLink = page.getByRole('link', { name: /Kontak/i }).first();
        if (await contactLink.isVisible()) {
            await contactLink.click();
            await expect(page).toHaveURL(/.*\/contact/);
        }
    });

    test('Project Detail opens from Grid', async ({ page }) => {
        await page.goto('/works');

        // Wait for grid to load
        await page.waitForSelector('.masonry-grid');

        // Click first project card
        // Structure: .masonry-grid -> .masonry-grid_column -> div -> a
        const firstProjectLink = page.locator('.masonry-grid a').first();

        if (await firstProjectLink.count() > 0) {
            const href = await firstProjectLink.getAttribute('href');
            console.log('Navigating to projects:', href);

            await firstProjectLink.click();
            await expect(page).toHaveURL(new RegExp(href!));

            // Verify project detail loads
            await expect(page.locator('h1')).toBeVisible();
        } else {
            console.log('No projects found in grid to test navigation');
        }
    });

    test('About Page content loads', async ({ page }) => {
        await page.goto('/about');
        // Check for generic content usually on About page
        await expect(page.locator('body')).toContainText(/About|Tentang|Skill/i);
    });

});
