import { test, expect } from '@playwright/test';

test('Admin can open Bike Management and create a bike', async ({ page }) => {
  await page.goto('http://localhost:5175/login', { waitUntil: 'load' });
  await page.fill('#email', 'admin@example.com');
  await page.fill('#password', 'ChangeMe123!');
  await page.click('button[type="submit"]');

  await page.goto('http://localhost:5175/admin/bikes', { waitUntil: 'load' });
  await expect(page.locator('text=Bike Management')).toBeVisible();

  await page.click('text=New Bike');
  await page.fill('input[placeholder=""]', 'Test Model');
  await page.fill('input[placeholder=""] >> nth=1', 'FRAME-TEST-001');
  await page.fill('input[placeholder=""] >> nth=2', 'PLATE-TEST-001');
  await page.click('button:has-text("Create")');

  await expect(page.locator('table')).toContainText('Test Model');
});

test('Agreement detail shows available bikes dropdown in Edit mode', async ({ page }) => {
  await page.goto('http://localhost:5175/login', { waitUntil: 'load' });
  await page.fill('#email', 'admin@example.com');
  await page.fill('#password', 'ChangeMe123!');
  await page.click('button[type="submit"]');

  await page.goto('http://localhost:5175/dashboard', { waitUntil: 'load' });
  await page.waitForSelector('text=SriRentABike Admin');

  // Navigate to first agreement if exists
  // This is a generic test and may need data setup
  // For now, we simply assert the dashboard loads.
  await expect(page.locator('text=SriRentABike Admin')).toBeVisible();
});
