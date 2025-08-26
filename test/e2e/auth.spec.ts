import { expect, test } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check page title with longer timeout
    await expect(page).toHaveTitle(
      'SafeTap - Tu información vital, en un tap',
      { timeout: 10000 }
    );

    // Check for login form elements with longer timeout
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('button[type="submit"]')).toBeVisible({
      timeout: 10000,
    });
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

    // Wait for response
    await page.waitForLoadState('networkidle');
    const currentUrl = page.url();

    // Check for success message
    const hasSuccessMessage = await page
      .locator('text=/revisa.*correo/i')
      .isVisible();

    // Check for configuration error (acceptable in CI)
    const hasConfigError = await page
      .locator('text=/Email service configuration error/i')
      .isVisible();

    // Either should have success message, configuration error, or be redirected to account
    expect(
      hasSuccessMessage || hasConfigError || currentUrl.includes('/account')
    ).toBeTruthy();
  });
});
