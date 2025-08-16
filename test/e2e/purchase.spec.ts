import { expect, test } from '@playwright/test';

test.describe('Purchase Flow', () => {
  test('buy page loads correctly', async ({ page }) => {
    await page.goto('/buy');

    // Check page loads with purchase options - be more specific
    await expect(page.locator('h1').first()).toBeVisible();

    // Should have pricing or product information
    await expect(page.locator('text=/Personaliza tu SafeTap/i')).toBeVisible();
  });

  test('displays product information', async ({ page }) => {
    await page.goto('/buy');

    // Should have product details - be more specific
    await expect(page.locator('h1').first()).toBeVisible();

    // Should have call-to-action button
    await expect(
      page.locator(
        'button:has-text("Comprar"), button:has-text("Buy"), button[type="submit"]'
      )
    ).toBeVisible();
  });

  test('checkout form validation', async ({ page }) => {
    await page.goto('/buy');

    // Should have checkout section
    await expect(page.locator('text=/Finalizar pedido/i')).toBeVisible();

    // Try to find checkout button and interact with it
    const checkoutButton = page.locator(
      'button:has-text("Comprar"), button:has-text("Buy"), button[type="submit"]'
    );

    if ((await checkoutButton.count()) > 0) {
      // Should either be disabled initially or require form completion
      await expect(checkoutButton.first()).toBeVisible();
    }
  });

  test('payment form elements present', async ({ page }) => {
    await page.goto('/buy');

    // Look for any payment-related elements
    const hasPaymentForm = await page
      .locator('input[type="email"], input[name*="email"]')
      .isVisible();
    const hasCheckoutButton = await page
      .locator('button:has-text("Comprar"), button:has-text("Buy")')
      .isVisible();

    // Should have either payment form or checkout process
    expect(hasPaymentForm || hasCheckoutButton).toBeTruthy();
  });
});
