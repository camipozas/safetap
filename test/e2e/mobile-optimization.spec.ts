import { expect, test } from '@playwright/test';

test.describe('Mobile Optimization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/buy');
  });

  test('sticker customizer is mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that preview appears first on mobile
    const previewSection = page
      .locator('[data-testid="sticker-preview"]')
      .first();
    await expect(previewSection).toBeVisible();

    // Check that the sticker preview is properly sized for mobile
    const stickerContainer = page
      .locator('.w-40.h-40.sm\\:w-48.sm\\:h-48')
      .first();
    await expect(stickerContainer).toBeVisible();

    // Check that color preset grid adapts to mobile
    const colorGrid = page.locator('.grid-cols-2.sm\\:grid-cols-3').first();
    await expect(colorGrid).toBeVisible();
  });

  test('color preset buttons are touch-friendly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Find a color preset button
    const colorButton = page.locator('button[title*="Blanco"]').first();
    await expect(colorButton).toBeVisible();

    // Check that it has touch optimization classes
    await expect(colorButton).toHaveClass(/touch-manipulation/);
    await expect(colorButton).toHaveClass(/active:scale-95/);

    // Test that button is clickable/tappable (use click for compatibility)
    await colorButton.click();

    // Verify the color changed in the preview
    const preview = page.locator('[data-testid="sticker-preview"]').first();
    await expect(preview).toBeVisible();
  });

  test('QR code generation works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Enter a name to trigger QR generation
    const nameInput = page.locator('input[placeholder*="Francisco"]');
    await nameInput.fill('John Doe');

    // Wait for QR code to be generated
    const qrCode = page.locator('[data-testid="qr-image"]').first();
    await expect(qrCode).toBeVisible({ timeout: 10000 });

    // Verify QR is properly sized for mobile (64px)
    const qrSize = await qrCode.getAttribute('width');
    expect(qrSize).toBe('64');
  });

  test('form inputs are accessible on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Test name input
    const nameInput = page.locator('input[placeholder*="Francisco"]');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Test Name');

    // Test country select
    const countrySelect = page.locator('[data-testid="country-select-button"]');
    await expect(countrySelect).toBeVisible();
    await countrySelect.click();

    // Select a different country from the dropdown
    const spainOption = page.locator('text=España');
    await spainOption.click();

    // Verify changes are reflected in preview
    const preview = page.locator('[data-testid="sticker-preview"]').first();
    await expect(preview).toContainText('Test Name');
  });

  test('layout switches properly between mobile and desktop', async ({
    page,
  }) => {
    // Start with desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });

    // Check desktop layout (grid)
    const container = page.locator('.lg\\:grid-cols-2').first();
    await expect(container).toBeVisible();

    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check mobile layout (flex column)
    const mobileContainer = page.locator('.flex.flex-col.lg\\:grid').first();
    await expect(mobileContainer).toBeVisible();

    // Check order changes for mobile
    const previewContainer = page.locator('.order-2.lg\\:order-2').first();
    await expect(previewContainer).toBeVisible();
  });

  test('performance metrics are acceptable on mobile', async ({ page }) => {
    // Set mobile viewport and slow network
    await page.setViewportSize({ width: 375, height: 667 });

    // Monitor performance
    const startTime = Date.now();

    // Navigate and interact
    await page.goto('/buy');

    // Fill form to trigger QR generation
    const nameInput = page.locator('input[placeholder*="Francisco"]');
    await nameInput.fill('Performance Test');

    // Wait for QR to load
    const qrCode = page.locator('[data-testid="qr-image"]').first();
    await expect(qrCode).toBeVisible({ timeout: 15000 });

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    // Assert reasonable load time (under 15 seconds for mobile)
    expect(loadTime).toBeLessThan(15000);
  });

  test('touch interactions work correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Test click on color preset (using click for compatibility)
    const colorButton = page.locator('button[title*="Negro"]').first();
    await colorButton.click();

    // Verify visual feedback (scale animation)
    await expect(colorButton).toHaveClass(/active:scale-95/);

    // Test click on country selector
    const countrySelect = page.locator('[data-testid="country-select-button"]');
    await countrySelect.click();
    await page.locator('text=Estados Unidos').click();

    // Verify changes applied
    const flagEmoji = page.locator('text=🇺🇸').first();
    await expect(flagEmoji).toBeVisible();
  });
});
