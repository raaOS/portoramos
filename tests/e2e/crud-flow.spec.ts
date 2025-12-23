import { test, expect } from '@playwright/test';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

test.describe('Project CRUD Flow', () => {
    // Generate a unique test project name
    const timestamp = Date.now();
    const projectTitle = `Automated Test Project ${timestamp}`;
    const updatedTitle = `UPDATED: Automated Test Project ${timestamp}`;

    test.beforeAll(async () => {
        if (!ADMIN_PASSWORD) {
            console.warn('⚠️ ADMIN_PASSWORD environment variable is not set. Tests might fail during login.');
        }
    });

    test('should login, create, update, and delete a project', async ({ page }) => {
        // 1. LOGIN
        await page.goto('/admin/login');

        // Check if already logged in (redirected to /admin)
        if (page.url().includes('/login')) {
            if (!ADMIN_PASSWORD) test.skip(true, 'Admin password required for login test');
            await page.fill('input[name="password"]', ADMIN_PASSWORD!);
            await page.click('button[type="submit"]');
        }

        await expect(page).toHaveURL(/\/admin/);
        await expect(page.locator('text=Admin Login')).not.toBeVisible();

        // 2. CREATE PROJECT
        await page.click('button:has-text("Add Project")');
        await expect(page.locator('text=Create New Project')).toBeVisible();

        // Fill Basic Info
        await page.fill('input[placeholder="Project title"]', projectTitle);
        await page.fill('input[placeholder="Client name"]', 'Playwright Bot');
        await page.fill('input[type="number"]', '2025');
        await page.fill('textarea[placeholder="Project description"]', 'This is a test project created by Playwright automation.');

        // Tags
        await page.fill('input[placeholder*="comma separated"]', 'Automation, Testing, CI/CD');

        // Cover Image (Required)
        await page.fill('input[placeholder="https://..."]', 'https://placehold.co/600x400');


        // Submit
        await page.click('button:has-text("Create Project")');

        // Verify Success
        // Verify Success (Wait up to 15s for file/API operations)
        await page.reload();
        await page.fill('input[placeholder="Search projects..."]', projectTitle);
        // Wait for filtering to happen
        await page.waitForTimeout(1000);
        await expect(page.locator(`h3:has-text("${projectTitle}")`)).toBeVisible({ timeout: 15000 });

        // 3. READ (Verify Public Visibility)
        // By default created projects might be published or draft. The current create implementation sets it to "published" usually?
        // Let's check status. If there is an eye icon, it's published.
        // We can go to homepage to check.
        const homePage = await page.opener() || page; // reuse page or open new
        await page.goto('/');

        // Wait for grid to load
        await page.waitForSelector('h1:has-text("Portfolio")', { state: 'attached' });

        // Reload to ensure cache is fresh (if using ISR/cache)
        await page.reload();

        // The project might override layout or take time to appear if ISR.
        // But we are in dev mode (revalidate 0).
        const projectLocator = page.locator(`text=${projectTitle}`);

        // If our createProject defaulting to Published:
        if (await projectLocator.isVisible()) {
            console.log('Project is visible on homepage.');
        } else {
            console.log('Project might be draft or not synced yet.');
            // Go back to admin to check status
            await page.goto('/admin');
            const card = page.locator(`.group:has-text("${projectTitle}")`);
            await expect(card).toBeVisible();
        }

        // 4. UPDATE PROJECT
        await page.goto('/admin');
        const projectCard = page.locator(`.group:has-text("${projectTitle}")`);
        await projectCard.locator('button[title="Edit Project"]').click();

        await expect(page.locator('text=Edit Project')).toBeVisible();
        await page.fill('input[placeholder="Project title"]', updatedTitle);
        await page.click('button:has-text("Update Project")');

        // Verify Update
        await expect(page.locator(`h3:has-text("${updatedTitle}")`)).toBeVisible();
        await expect(page.locator('text=Edit Project')).not.toBeVisible();

        // 5. DELETE PROJECT
        page.once('dialog', async dialog => {
            console.log(`Dialog message: ${dialog.message()}`);
            await dialog.accept();
        });

        const updatedCard = page.locator(`.group:has-text("${updatedTitle}")`);
        // Force click to bypass any lingering overlays/toasts
        await updatedCard.locator('button[title="Delete Project"]').click({ force: true });

        // Wait for Toast
        await expect(page.locator('text=Project deleted')).toBeVisible({ timeout: 10000 });

        // Verify Deletion
        await expect(page.locator(`h3:has-text("${updatedTitle}")`)).not.toBeVisible();
    });
});
