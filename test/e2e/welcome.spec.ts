import { expect, test } from '@playwright/test';

test.describe('Welcome Page', () => {
  test('shows sticker CTA when cta=sticker parameter is present', async ({
    page,
  }) => {
    await page.goto('/welcome?cta=sticker');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check main heading
    await expect(page.locator('h1')).toContainText('¡Bienvenida/o!');

    // Check that CTA section is visible
    await expect(page.locator('h2')).toContainText('Consigue tu Sticker NFC');

    // Check CTA buttons - use more specific selectors to avoid conflicts
    const buyButton = page.locator('main a[href="/buy"]');
    await expect(buyButton).toBeVisible();
    await expect(buyButton).toContainText('Comprar sticker');

    const guideButton = page.locator('main a[href="/guide"]');
    await expect(guideButton).toBeVisible();
    await expect(guideButton).toContainText('Ver detalles');
  });

  test('does not show sticker CTA when cta parameter is missing', async ({
    page,
  }) => {
    await page.goto('/welcome');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check main heading
    await expect(page.locator('h1')).toContainText('¡Bienvenida/o!');

    // Check that CTA section is NOT visible - look for the specific text
    await expect(
      page.locator('text=Consigue tu Sticker NFC')
    ).not.toBeVisible();

    // Check that buy button is not visible in main content
    const buyButton = page.locator('main a[href="/buy"]');
    await expect(buyButton).not.toBeVisible();
  });

  test('CTA buttons link to correct pages', async ({ page }) => {
    await page.goto('/welcome?cta=sticker');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check buy button link - use more specific selector to avoid conflicts
    const buyButton = page.locator('main a[href="/buy"]');
    await expect(buyButton).toBeVisible();
    await expect(buyButton).toHaveAttribute('href', '/buy');

    // Check guide button link
    const guideButton = page.locator('main a[href="/guide"]');
    await expect(guideButton).toBeVisible();
    await expect(guideButton).toHaveAttribute('href', '/guide');
  });
});
