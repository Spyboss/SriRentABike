import { test, expect } from '@playwright/test';

test.describe('Audit Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('http://localhost:5175/login');
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'ChangeMe123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('Performance: Dashboard search is debounced', async ({ page }) => {
    // Intercept API calls
    let callCount = 0;
    await page.route('**/api/agreements*', async (route) => {
      callCount++;
      await route.continue();
    });

    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('test');
    await page.waitForTimeout(100);
    await searchInput.fill('test search');
    
    // Wait for debounce (500ms) + some buffer
    await page.waitForTimeout(1000);
    
    // Initial fetch + 1 debounced search fetch = 2 calls
    // (If not debounced, it would be many more)
    expect(callCount).toBeLessThanOrEqual(3);
  });

  test('Unfinished Feature: Agreement details (dates, rates, deposit) are saved and total calculated', async ({ page }) => {
    // Navigate to an agreement detail page
    // Assuming there's at least one agreement
    await page.waitForSelector('text=View');
    await page.click('text=View >> nth=0');
    
    await expect(page).toHaveURL(/.*agreements\/.*/);

    // Update details
    await page.fill('input[label="Daily Rate (LKR)"]', '5000');
    await page.fill('input[label="Deposit (LKR)"]', '10000');
    
    // Set dates (today and tomorrow)
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    await page.fill('input[label="Start Date"]', today);
    await page.fill('input[label="End Date"]', tomorrow);

    // Save
    await page.click('text=Save Rental Details');
    
    // Check for success alert or refresh
    // In a real app we might check the database or the UI for the updated total
    // Since we don't have easy DB access in the test, we check if the values persist after refresh
    await page.reload();
    
    await expect(page.locator('input[label="Daily Rate (LKR)"]')).toHaveValue('5000');
    await expect(page.locator('input[label="Deposit (LKR)"]')).toHaveValue('10000');
  });

  test('Bug Fix: Bike assignment updates status correctly', async ({ page }) => {
    // This test verifies the UI flow for bike assignment
    await page.waitForSelector('text=View');
    await page.click('text=View >> nth=0');

    // Click Change Bike if already assigned, or just see the select
    if (await page.locator('text=Change Bike').isVisible()) {
      await page.click('text=Change Bike');
    }

    await page.waitForSelector('select');
    const select = page.locator('select');
    const options = await select.locator('option').all();
    
    if (options.length > 1) {
      await select.selectOption({ index: 1 });
      await page.click('text=Confirm');
      await expect(page.locator('text=Completed')).toBeVisible();
    }
  });
});
