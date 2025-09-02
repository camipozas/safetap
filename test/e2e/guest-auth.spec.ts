import { expect, test } from '@playwright/test';

test.describe('Guest Authentication Flow', () => {
  test('guest sign in button is visible and accessible', async ({ page }) => {
    await page.goto('/login');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check that guest button is visible
    await expect(
      page.locator('button:has-text("Entrar sin SSO (Invitado)")')
    ).toBeVisible();

    // Check that guest button is enabled
    await expect(
      page.locator('button:has-text("Entrar sin SSO (Invitado)")')
    ).toBeEnabled();
  });

  test('guest button has proper styling and text', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const guestButton = page.locator(
      'button:has-text("Entrar sin SSO (Invitado)")'
    );

    // Check button styling
    await expect(guestButton).toHaveClass(/bg-slate-100/);
    await expect(guestButton).toHaveClass(/border/);

    // Check button text
    await expect(guestButton).toContainText('Entrar sin SSO (Invitado)');
  });

  test('guest explanation text is visible', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check that explanation text is visible
    await expect(
      page.locator('text=Como invitado podrás explorar y comprar tu sticker')
    ).toBeVisible();
  });

  test('guest button is positioned correctly in the form', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Check that guest button comes after Google button
    const googleButton = page.locator(
      'button:has-text("Continuar con Google")'
    );
    const guestButton = page.locator(
      'button:has-text("Entrar sin SSO (Invitado)")'
    );

    await expect(googleButton).toBeVisible();
    await expect(guestButton).toBeVisible();

    // Verify button order (guest should be below Google)
    const googlePosition = await googleButton.boundingBox();
    const guestPosition = await guestButton.boundingBox();

    if (googlePosition && guestPosition) {
      expect(guestPosition.y).toBeGreaterThan(googlePosition.y);
    }
  });
});
