
import { test, expect } from '@playwright/test';

test('Admin login shows error when backend unavailable', async ({ page }) => {
  await page.goto('http://localhost:5174/login', { waitUntil: 'load' });
  await page.fill('#email', 'admin@example.com');
  await page.fill('#password', 'ChangeMe123!');
  await page.click('button[type="submit"]');

  const errorAlert = page.locator('.bg-red-50');
  await expect(errorAlert).toBeVisible();

  await page.screenshot({ path: 'login_error.png', fullPage: true });
});

test('Dashboard redirects unauthenticated user to login', async ({ page }) => {
  await page.goto('http://localhost:5174/dashboard', { waitUntil: 'load' });
  await page.waitForURL('**/login', { timeout: 5000 });
  const heading = page.locator('h2:text("Admin Login")');
  await expect(heading).toBeVisible();
});
