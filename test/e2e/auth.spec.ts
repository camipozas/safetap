import { expect, test } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login');

    // Check page title
    await expect(page).toHaveTitle('safetap');

    // Check for login form elements
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('displays validation errors for empty form', async ({ page }) => {
    await page.goto('/login');

    // Submit button should be disabled when email is empty
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
  });

  test('shows error for invalid email format', async ({ page }) => {
    await page.goto('/login');

    // Fill invalid email
    await page.locator('input[type="email"]').fill('invalid-email');

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Check that the form submission was handled (no navigation occurred)
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('handles login attempt with valid format', async ({ page }) => {
    await page.goto('/login');

    // Fill valid credentials
    await page.locator('input[type="email"]').fill('test@example.com');

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Should either show success message or redirect
    // We'll check for either success message or account redirect
    await page.waitForLoadState('networkidle');
    const currentUrl = page.url();
    const hasSuccessMessage = await page
      .locator('text=/revisa.*correo/i')
      .isVisible();

    // Either should have success message or be redirected to account
    expect(hasSuccessMessage || currentUrl.includes('/account')).toBeTruthy();
  });
});
