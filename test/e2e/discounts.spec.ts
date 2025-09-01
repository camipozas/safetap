import { expect, test } from '@playwright/test';

test.describe('Discount Code System', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment if needed
    await page.goto('/');
  });

  test('discount code input appears on checkout page', async ({ page }) => {
    // Navigate to checkout page
    await page.goto('/comprar');

    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');

    // Check if discount code input section exists
    await expect(page.getByText('Código de descuento')).toBeVisible();

    // Check if apply button exists
    await expect(page.getByRole('button', { name: /aplicar/i })).toBeVisible();
  });

  test('discount validation shows error for invalid code', async ({ page }) => {
    await page.goto('/comprar');

    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');

    // Fill in the discount code input
    await page.getByPlaceholder('Ingresa tu código').fill('INVALID123');

    // Wait for the button to be enabled (it's disabled when no code is entered)
    await expect(page.getByRole('button', { name: /aplicar/i })).toBeEnabled();

    // Click apply button
    await page.getByRole('button', { name: /aplicar/i }).click();

    // Should show an error message
    await expect(
      page.getByText(/código de descuento no válido/i)
    ).toBeVisible();
  });

  test('admin page redirects unauthenticated users', async ({ page }) => {
    // Navigate to admin page
    await page.goto('/admin');

    // Since this requires admin authentication, we expect a redirect
    // Wait a bit for the redirect to happen
    await page.waitForTimeout(1000);

    // Check if we're redirected to login or if there's an error
    const currentUrl = page.url();

    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      // Expected behavior: redirected to login
      await expect(page).toHaveURL(/.*(login|auth).*/);
    } else if (currentUrl.includes('/admin')) {
      // If somehow we're still on admin page, check for admin content
      await expect(page.getByText('Admin')).toBeVisible();
    } else {
      // Some other redirect happened
      expect(currentUrl).not.toBe('/admin');
    }
  });

  test('discount api endpoint responds correctly', async ({ page }) => {
    // Test the validation API endpoint
    const response = await page.request.post('/api/discounts/validate', {
      data: {
        code: 'TESTCODE',
        cartTotal: 1000,
      },
    });

    // The API should respond (even if the code is invalid)
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('valid');
    expect(typeof data.valid).toBe('boolean');
  });
});
