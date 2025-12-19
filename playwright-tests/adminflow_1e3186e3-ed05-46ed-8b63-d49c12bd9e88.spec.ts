
import { test, expect } from '@playwright/test';

test('Admin login attempt with backend unavailable', async ({ page }) => {
  
    // Navigate to URL
    await page.goto('http://localhost:5174/login', { waitUntil: 'load' });

    // Fill input field
    await page.fill('#email', 'admin@example.com');

    // Fill input field
    await page.fill('#password', 'ChangeMe123!');

    // Click element
    await page.click('button[type="submit"]');

    // Expect error alert to appear
    const errorAlert = page.locator('.bg-red-50');
    await expect(errorAlert).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'login_error.png', fullPage: true });
});
