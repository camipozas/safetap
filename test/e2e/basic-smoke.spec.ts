import { expect, test } from '@playwright/test';

test.describe('Basic Smoke Tests', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SafeTap/);
    console.log('✅ Homepage loaded successfully');
  });

  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    console.log('✅ Login page loaded successfully');
  });

  test('buy page loads correctly', async ({ page }) => {
    await page.goto('/buy');
    await page.waitForLoadState('networkidle');
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
    console.log('✅ Buy page loaded successfully');
  });

  test('profile page redirects to login when not authenticated', async ({
    page,
  }) => {
    await page.goto('/profile/new');
    // Should redirect to login
    await expect(page).toHaveURL(/.*login.*/);
    console.log('✅ Profile page authentication check working');
  });
});
