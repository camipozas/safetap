import { expect, test } from '@playwright/test';

test('basic playwright functionality', async ({ page }) => {
  // Test that we can navigate to a basic URL
  await page.goto('https://playwright.dev');

  // Check that the page loads
  await expect(page).toHaveTitle(/Playwright/);
});

// This test would run against your local app when webServer is enabled
test.skip('homepage loads correctly', async ({ page }) => {
  await page.goto('/');

  // Check that the page title is visible
  await expect(page).toHaveTitle(/SafeTap/);

  // Check that main content is visible
  await expect(page.locator('h1')).toBeVisible();
});
