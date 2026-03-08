/**
 * E2E Test: Admin CRUD Operations
 * 
 * Tests the full CRUD flow for projects to prevent regression.
 */

import { test, expect, Page } from '@playwright/test';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password';

// Helper: Login to admin
async function loginAdmin(page: Page) {
  await page.goto('/admin/login');
  await page.waitForSelector('input[type="password"]');
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin/);
}

// Helper: Create a test project
async function createProject(page: Page, projectName: string) {
  await page.goto('/admin/projects');
  await page.waitForSelector('text=Projects');
  
  // Click add new button
  await page.click('text=Add New');
  await page.waitForSelector('text=Create New Project');
  
  // Fill basic info
  await page.fill('input[name="title"]', projectName);
  await page.fill('input[name="client"]', 'Test Client');
  await page.fill('input[name="year"]', '2024');
  await page.fill('textarea[name="description"]', 'This is a test project created by E2E test');
  
  // Select type
  await page.selectOption('select[name="type"]', 'commercial');
  
  // Add tag
  await page.fill('input[placeholder="Add tag..."]', 'test');
  await page.keyboard.press('Enter');
  
  // Save
  await page.click('button:has-text("Create Project")');
  
  // Wait for redirect to edit page
  await page.waitForURL(/\/admin\/projects\/edit/);
  
  // Return project ID from URL
  const url = page.url();
  const projectId = url.split('/').pop();
  return projectId;
}

// Helper: Update a project
async function updateProject(page: Page, projectId: string) {
  await page.goto(`/admin/projects/edit/${projectId}`);
  await page.waitForSelector('text=Edit Project');
  
  // Update title
  const updatedTitle = `Updated - ${Date.now()}`;
  await page.fill('input[name="title"]', updatedTitle);
  
  // Save
  await page.click('button:has-text("Save Changes")');
  
  // Wait for success indicator
  await page.waitForSelector('text=Saved');
  
  return updatedTitle;
}

// Helper: Delete a project
async function deleteProject(page: Page, projectId: string) {
  await page.goto('/admin/projects');
  await page.waitForSelector('text=Projects');
  
  // Find project and click delete
  const projectRow = await page.locator(`[data-project-id="${projectId}"]`).first();
  await projectRow.locator('button:has-text("Delete")').click();
  
  // Confirm delete
  await page.waitForSelector('text=Are you sure');
  await page.click('button:has-text("Confirm")');
  
  // Wait for project to disappear
  await expect(projectRow).not.toBeVisible();
}

test.describe('Admin Project CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginAdmin(page);
  });

  test('should create a new project', async ({ page }) => {
    const projectName = `E2E Test Project ${Date.now()}`;
    const projectId = await createProject(page, projectName);
    
    expect(projectId).toBeTruthy();
    
    // Verify project appears in list
    await page.goto('/admin/projects');
    await expect(page.locator(`text=${projectName}`)).toBeVisible();
  });

  test('should update an existing project', async ({ page }) => {
    // Create project first
    const projectName = `Update Test ${Date.now()}`;
    const projectId = await createProject(page, projectName);
    
    // Update it
    const updatedTitle = await updateProject(page, projectId!);
    
    // Verify update
    await page.goto('/admin/projects');
    await expect(page.locator(`text=${updatedTitle}`)).toBeVisible();
  });

  test('should delete a project', async ({ page }) => {
    // Create project first
    const projectName = `Delete Test ${Date.now()}`;
    const projectId = await createProject(page, projectName);
    
    // Delete it
    await deleteProject(page, projectId!);
    
    // Verify deletion
    await page.goto('/admin/projects');
    await expect(page.locator(`text=${projectName}`)).not.toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/admin/projects');
    await page.click('text=Add New');
    await page.waitForSelector('text=Create New Project');
    
    // Try to submit without filling required fields
    await page.click('button:has-text("Create Project")');
    
    // Should show validation errors
    await expect(page.locator('text=Title is required')).toBeVisible();
    await expect(page.locator('text=Client is required')).toBeVisible();
  });

  test('should reflect changes on homepage after CRUD', async ({ page }) => {
    // Create project
    const projectName = `Homepage Test ${Date.now()}`;
    const projectId = await createProject(page, projectName);
    
    // Check homepage
    await page.goto('/');
    await expect(page.locator(`text=${projectName}`)).toBeVisible();
    
    // Delete project
    await deleteProject(page, projectId!);
    
    // Verify removed from homepage (after ISR revalidate)
    await page.waitForTimeout(2000); // Wait for potential cache
    await page.reload();
    await expect(page.locator(`text=${projectName}`)).not.toBeVisible();
  });
});

test.describe('API Response Standardization', () => {
  test('should return standardized success response', async ({ request }) => {
    const response = await request.get('/api/projects');
    const body = await response.json();
    
    // Check standard response format
    expect(body).toHaveProperty('success');
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('meta');
    expect(body.success).toBe(true);
    expect(body.meta).toHaveProperty('timestamp');
  });

  test('should return standardized error response', async ({ request }) => {
    // Test with invalid endpoint
    const response = await request.get('/api/projects/invalid-id-12345');
    
    if (!response.ok()) {
      const body = await response.json();
      expect(body).toHaveProperty('success', false);
      expect(body).toHaveProperty('error');
      expect(body.error).toHaveProperty('code');
      expect(body.error).toHaveProperty('message');
    }
  });
});
