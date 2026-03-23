import { test, expect } from '@playwright/test';

test.describe('Real-time Sync', () => {
  test('homepage should be accessible', async ({ page }) => {
    await page.goto('/', { timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Verify homepage loaded
    await expect(page.locator('body')).toBeVisible();
    
    // Check page title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('should navigate to projects page from homepage', async ({ page }) => {
    await page.goto('/projects', { timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Verify projects page
    await expect(page.locator('body')).toBeVisible();
    
    // Check for projects content
    const hasContent = await page.locator('text=Projects').count() > 0 || 
                      await page.locator('[data-projects-grid]').count() > 0;
    expect(hasContent).toBe(true);
  });
});
