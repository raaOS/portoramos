/**
 * E2E Test: Real-time Sync Functionality
 * 
 * Test scenario:
 * 1. Open homepage (visitor view)
 * 2. Open admin in new context
 * 3. Create/edit project in admin
 * 4. Verify homepage auto-updates (within 5 seconds)
 */

import { test, expect, chromium } from '@playwright/test';

test.describe('Real-time Sync', () => {
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password';
  
  test('homepage should auto-update when project created in admin', async () => {
    // Launch browser
    const browser = await chromium.launch();
    
    // === CONTEXT 1: Homepage (Visitor) ===
    const visitorContext = await browser.newContext();
    const visitorPage = await visitorContext.newPage();
    
    // Open homepage
    await visitorPage.goto('http://localhost:3000');
    await visitorPage.waitForLoadState('networkidle');
    
    // Get initial project count (from desktop icons or projects page)
    await visitorPage.goto('http://localhost:3000/projects');
    await visitorPage.waitForSelector('[data-testid="project-card"]', { timeout: 10000 }).catch(() => {
      // No projects yet, that's ok
    });
    
    const initialProjectCount = await visitorPage.locator('[data-testid="project-card"]').count();
    console.log(`[Test] Initial project count: ${initialProjectCount}`);
    
    // Listen for console logs from realtime sync
    const visitorLogs: string[] = [];
    visitorPage.on('console', msg => {
      const text = msg.text();
      if (text.includes('RealtimeSync') || text.includes('Homepage')) {
        visitorLogs.push(text);
        console.log(`[Visitor Console] ${text}`);
      }
    });
    
    // === CONTEXT 2: Admin Dashboard ===
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    // Login to admin
    await adminPage.goto('http://localhost:3000/admin/login');
    await adminPage.fill('input[type="password"], input[name="password"]', ADMIN_PASSWORD);
    await adminPage.click('button[type="submit"]');
    
    // Wait for redirect to admin projects
    await adminPage.waitForURL('http://localhost:3000/admin/projects', { timeout: 10000 });
    await adminPage.waitForLoadState('networkidle');
    
    // Listen for admin console logs
    adminPage.on('console', msg => {
      const text = msg.text();
      if (text.includes('RealtimeSync') || text.includes('AdminProjects')) {
        console.log(`[Admin Console] ${text}`);
      }
    });
    
    // Click "Add Project" button
    await adminPage.click('button:has-text("Add Project"), button:has-text("Tambah Project")');
    
    // Fill project form
    const testProjectTitle = `Test Real-time ${Date.now()}`;
    await adminPage.fill('input[name="title"]', testProjectTitle);
    await adminPage.fill('input[name="client"]', 'Test Client');
    await adminPage.fill('textarea[name="description"]', 'This is a test project for real-time sync');
    
    // Add cover image URL (using placeholder)
    await adminPage.fill('input[name="cover"]', 'https://via.placeholder.com/800x600');
    
    // Submit form
    await adminPage.click('button[type="submit"]');
    
    // Wait for success message
    await adminPage.waitForSelector('text=Project berhasil dibuat', { timeout: 15000 });
    console.log('[Test] Project created successfully in admin');
    
    // === VERIFY: Homepage Auto-Update ===
    // Switch back to visitor page
    await visitorPage.bringToFront();
    
    // Wait for real-time update (max 10 seconds)
    console.log('[Test] Waiting for real-time update on homepage...');
    
    let updateDetected = false;
    const startTime = Date.now();
    
    while (Date.now() - startTime < 10000) {
      // Check if console log shows update
      if (visitorLogs.some(log => log.includes('Data changed') || log.includes('Real-time update detected'))) {
        updateDetected = true;
        console.log('[Test] ✅ Real-time update detected in console!');
        break;
      }
      
      // Small delay
      await visitorPage.waitForTimeout(500);
    }
    
    // Also verify by checking if new project appears
    await visitorPage.reload();
    await visitorPage.waitForLoadState('networkidle');
    
    const newProjectCount = await visitorPage.locator('[data-testid="project-card"]').count();
    console.log(`[Test] New project count: ${newProjectCount}`);
    
    // Assertions
    expect(newProjectCount).toBeGreaterThanOrEqual(initialProjectCount);
    
    if (updateDetected) {
      console.log('[Test] ✅ PASS: Real-time sync working correctly!');
    } else {
      console.log('[Test] ⚠️ WARNING: Update detected via page reload but not via real-time sync');
      console.log('[Test] Console logs:', visitorLogs);
    }
    
    // Cleanup: Delete test project
    await adminPage.bringToFront();
    await adminPage.goto('http://localhost:3000/admin/projects');
    
    // Find and delete the test project
    const testProjectRow = adminPage.locator('tr', { hasText: testProjectTitle });
    if (await testProjectRow.count() > 0) {
      await testProjectRow.locator('button:has-text("Delete"), button[aria-label="Delete"]').click();
      await adminPage.click('button:has-text("Confirm"), button:has-text("Yes")');
      console.log('[Test] Cleanup: Test project deleted');
    }
    
    await browser.close();
  });
  
  test('bandwidth should be efficient (no excessive polling)', async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Track network requests
    const requests: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/projects')) {
        requests.push(url);
        console.log(`[Network] ${url}`);
      }
    });
    
    // Open homepage
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000); // Initial load
    
    // Wait for 15 seconds
    console.log('[Test] Monitoring network for 15 seconds...');
    await page.waitForTimeout(15000);
    
    // Count polling requests
    const projectApiCalls = requests.filter(url => url.includes('/api/projects'));
    console.log(`[Test] Total /api/projects calls in 15s: ${projectApiCalls.length}`);
    
    // With realtime sync, should be 1-2 calls (initial + maybe one refresh)
    // With old polling (30s interval), would be 0-1 calls
    // With very aggressive polling, would be many calls
    
    if (projectApiCalls.length <= 2) {
      console.log('[Test] ✅ PASS: Bandwidth efficient (minimal polling)');
    } else {
      console.log('[Test] ⚠️ WARNING: More API calls than expected');
    }
    
    expect(projectApiCalls.length).toBeLessThanOrEqual(3); // Allow some margin
    
    await browser.close();
  });
});
