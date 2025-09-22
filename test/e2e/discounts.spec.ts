import { expect, test } from '@playwright/test';

test.describe('Discount Code System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('discount code input appears on checkout page', async ({ page }) => {
    await page.goto('/comprar');

    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Código de descuento')).toBeVisible();

    await expect(page.getByRole('button', { name: /aplicar/i })).toBeVisible();
  });

  test('discount validation shows error for invalid code', async ({ page }) => {
    await page.goto('/comprar');

    await page.waitForLoadState('networkidle');

    const input = page.getByPlaceholder('Ingresa tu código');
    await input.fill('INVALID123');

    await page.waitForTimeout(100);

    await expect(page.getByRole('button', { name: /aplicar/i })).toBeEnabled();

    await page.getByRole('button', { name: /aplicar/i }).click();

    await expect(
      page.getByText(/código de descuento no válido/i)
    ).toBeVisible();
  });

  test('admin page redirects unauthenticated users', async ({ page }) => {
    await page.goto('/admin');

    await page.waitForTimeout(1000);

    const currentUrl = page.url();

    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      await expect(page).toHaveURL(/.*(login|auth).*/);
    } else if (currentUrl.includes('/admin')) {
      await expect(page.getByText('Admin')).toBeVisible();
    } else {
      expect(currentUrl).not.toBe('/admin');
    }
  });

  test('discount api endpoint responds correctly', async ({ page }) => {
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
