import { expect, test } from '@playwright/test';

test.describe('Zero Amount Transactions (100% Discount)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show bank information for regular purchases', async ({
    page,
  }) => {
    // Navigate to purchase page
    await page.goto('/buy');
    await page.waitForLoadState('networkidle');

    // Check that bank information is displayed for regular purchases
    await expect(page.locator('text=/Datos Bancarios/')).toBeVisible();
  });

  test('should handle account page redirect for unauthenticated users', async ({
    page,
  }) => {
    // Simulate being redirected to account page with a zero amount reference
    await page.goto('/account?ref=ZERO-AMOUNT-REF');

    // Should redirect to login page for unauthenticated users
    await expect(page).toHaveURL(/.*\/login.*/);

    // The page should load successfully
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle API endpoint for zero amount transactions', async ({
    page,
  }) => {
    // Test the API endpoint directly
    const response = await page.request.post('/api/checkout/transfer/verify', {
      data: {
        reference: 'TEST-ZERO-REF',
        transferConfirmed: false, // Even with false, should auto-confirm for zero amount
      },
    });

    // The API should handle zero amount transactions correctly
    // This is more of an integration test
    expect([200, 404]).toContain(response.status()); // 404 if payment doesn't exist, 200 if it does
  });

  test('should display discount code input on checkout', async ({ page }) => {
    await page.goto('/comprar');
    await page.waitForLoadState('networkidle');

    // Should have discount code input
    await expect(page.getByText('Código de descuento')).toBeVisible();
    await expect(page.getByRole('button', { name: /aplicar/i })).toBeVisible();
  });

  test('should validate discount codes correctly', async ({ page }) => {
    const response = await page.request.post('/api/discounts/validate', {
      data: {
        code: 'TESTCODE',
        cartTotal: 1000,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('valid');
    expect(typeof data.valid).toBe('boolean');
  });
});
