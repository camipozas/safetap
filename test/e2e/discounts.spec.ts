import { expect, test } from '@playwright/test';

test.describe('Discount Code System', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment if needed
    await page.goto('/');
  });

  test('discount code input appears on checkout page', async ({ page }) => {
    // Navigate to checkout page (adjust path based on your routing)
    await page.goto('/comprar');

    // Check if discount code input section exists
    await expect(page.getByText('Código de descuento')).toBeVisible();

    // Check if apply button exists
    await expect(page.getByRole('button', { name: /aplicar/i })).toBeVisible();
  });

  test('discount validation shows error for invalid code', async ({ page }) => {
    await page.goto('/comprar');

    // Fill in the discount code input
    await page.getByPlaceholder('Ingresa tu código').fill('INVALID123');

    // Click apply button
    await page.getByRole('button', { name: /aplicar/i }).click();

    // Should show an error message
    await expect(
      page.getByText(/código de descuento no válido/i)
    ).toBeVisible();
  });

  test('admin can access discount management page', async ({ page }) => {
    // This test assumes you have admin authentication set up
    // You may need to modify this based on your auth setup

    await page.goto('/admin');

    // Look for the discount management link/button
    await expect(page.getByText('Códigos de Descuento')).toBeVisible();

    // Click to go to discount management
    await page.getByText('Códigos de Descuento').click();

    // Should be on the discount management page
    await expect(
      page.getByRole('heading', { name: /códigos de descuento/i })
    ).toBeVisible();

    // Should see the create button
    await expect(
      page.getByRole('button', { name: /crear código/i })
    ).toBeVisible();
  });

  test('admin can open create discount form', async ({ page }) => {
    // Navigate to admin discount page
    await page.goto('/admin/discounts');

    // Click create discount button
    await page.getByRole('button', { name: /crear código/i }).click();

    // Should see the form
    await expect(
      page.getByRole('heading', { name: /crear código de descuento/i })
    ).toBeVisible();

    // Check form fields exist
    await expect(page.getByLabel(/código/i)).toBeVisible();
    await expect(page.getByLabel(/tipo/i)).toBeVisible();
    await expect(page.getByLabel(/monto/i)).toBeVisible();
  });

  test('discount api endpoint responds correctly', async ({ page }) => {
    // Test the validation API endpoint
    const response = await page.request.post('/api/discounts/validate', {
      data: {
        code: 'TESTCODE',
        cartTotal: 1000,
      },
    });

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('valid');
    expect(typeof data.valid).toBe('boolean');
  });
});
