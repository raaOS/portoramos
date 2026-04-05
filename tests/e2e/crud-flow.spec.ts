import { test, expect } from '@playwright/test';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Urgent2025!';

// Helper: Login to admin via API
async function loginAdmin(page: any, context: any) {
  // Get CSRF token
  const csrfRes = await context.request.get('/api/admin/login');
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  
  // Login via API with bypass header
  const loginRes = await context.request.post('/api/admin/login', {
    headers: {
      'X-CSRF-Token': csrfToken,
      'X-Test-Bypass': 'true',
    },
    data: {
      password: ADMIN_PASSWORD,
      lat: -6.2088,
      lng: 106.8456,
      accuracy: 10,
    }
  });
  
  if (!loginRes.ok()) {
    const error = await loginRes.json();
    throw new Error('API login failed: ' + JSON.stringify(error));
  }
  
  await page.goto('/admin', { waitUntil: 'domcontentloaded' });
  await expect(page).not.toHaveURL(/\/admin\/login/);
}

test.describe('Project CRUD Flow (Simplified)', () => {
  test.setTimeout(60000);

  test('should login and access admin dashboard', async ({ page, context }) => {
    await loginAdmin(page, context);
    
    // Verify admin dashboard
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('body')).toContainText('Admin');
  });

  test('should navigate through admin sections', async ({ page, context }) => {
    await loginAdmin(page, context);
    
    // Navigate to projects
    await page.goto('/admin/projects', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText('Projects');
    
    // Navigate to about
    await page.goto('/admin/about', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText('About');
    
    // Navigate back to admin page
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText('Admin Panel');
  });
});
