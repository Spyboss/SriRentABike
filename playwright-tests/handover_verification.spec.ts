import { test, expect } from '@playwright/test';

test.describe('SriRentABike Handover Verification', () => {
  
  test('Homepage: Loads correctly with SEO elements', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/SriRentABike/);
    
    // Check main heading
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('Ride the');
    
    // Check if Navbar is present
    await expect(page.locator('nav')).toBeVisible();
    
    // Check meta tags
    const description = await page.getAttribute('meta[name="description"]', 'content');
    expect(description).toBeTruthy();
    
    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    expect(ogTitle).toBeTruthy();
  });

  test('Booking Flow: Guest can start booking', async ({ page }) => {
    await page.goto('/rent');
    
    // Check form title
    await expect(page.locator('h1')).toContainText('Rent a Bike');
    
    // Fill personal details (partial)
    await page.fill('input[name="first_name"]', 'John');
    await page.fill('input[name="last_name"]', 'Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    
    // Check if bike selection is available
    const select = page.locator('select');
    await expect(select).toBeVisible();
    
    // Check if summary section is present
    await expect(page.locator('text=Total Estimate')).toBeVisible();
  });

  test('Admin Flow: Login and Dashboard', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');
    
    // Check login page elements
    await expect(page.locator('h1')).toContainText('Admin Portal');
    
    // Attempt login (this might fail if no admin exists, but we test the UI)
    await page.fill('input[type="email"]', 'admin@srirentabike.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Expect error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('Accessibility: Basic keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Press Tab and check if focus moves to an interactive element
    await page.keyboard.press('Tab');
    const isFocused = await page.evaluate(() => {
      const active = document.activeElement;
      return active && (
        active.tagName === 'A' || 
        active.tagName === 'BUTTON' || 
        active.getAttribute('tabindex') !== null
      );
    });
    expect(isFocused).toBeTruthy();
  });

});
