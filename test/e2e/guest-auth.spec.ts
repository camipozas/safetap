import { expect, test } from '@playwright/test';

test.describe('Email Authentication Flow', () => {
  test('email input is visible and accessible', async ({ page }) => {
    await page.goto('/login');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check that email input is visible
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Check that email input is enabled
    await expect(page.locator('input[type="email"]')).toBeEnabled();

    // Check placeholder text
    await expect(page.locator('input[type="email"]')).toHaveAttribute(
      'placeholder',
      'tu@email.com'
    );
  });

  test('submit button is properly disabled when email is empty', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const submitButton = page.locator('button[type="submit"]');

    // Check button is disabled when email is empty
    await expect(submitButton).toBeDisabled();

    // Check button text
    await expect(submitButton).toContainText('Enviar enlace de acceso');
  });

  test('submit button enables when valid email is entered', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]');
    const submitButton = page.locator('button[type="submit"]');

    // Enter a valid email
    await emailInput.fill('test@example.com');

    // Check button becomes enabled
    await expect(submitButton).toBeEnabled();
  });

  test('form validation works correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]');

    // Check required attribute
    await expect(emailInput).toHaveAttribute('required');

    // Check input type
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('email input has proper accessibility attributes', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]');
    const emailLabel = page.locator('label[for="email"]');

    // Check label is visible and properly associated
    await expect(emailLabel).toBeVisible();
    await expect(emailLabel).toContainText('Dirección de correo electrónico');
    await expect(emailInput).toHaveAttribute('id', 'email');
  });

  test('privacy notice text is visible', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check that privacy notice is visible
    await expect(
      page.locator(
        'text=Al continuar con Google, se creará tu cuenta automáticamente'
      )
    ).toBeVisible();
  });
});
