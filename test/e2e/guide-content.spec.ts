import { expect, test } from '@playwright/test';

test.describe('Guide Content Corrections', () => {
  test('displays correct information about SafeTap functionality', async ({
    page,
  }) => {
    await page.goto('/guide');

    await expect(
      page.locator(
        'text=SafeTap permite acceder a tu información de emergencia sin necesidad de desbloquear tu teléfono personal'
      )
    ).toBeVisible();

    await expect(
      page.locator('text=funciona incluso cuando tu teléfono está bloqueado')
    ).not.toBeVisible();
  });

  test('has proper responsive layout for sticker customizer', async ({
    page,
  }) => {
    await page.goto('/buy');

    const previewSection = page
      .locator('[data-testid="sticker-preview"]')
      .first();
    await expect(previewSection).toBeVisible();

    await page.setViewportSize({ width: 375, height: 667 });
    await expect(previewSection).toBeVisible();

    const previewContainer = page.locator('.flex.justify-center').first();
    await expect(previewContainer).toBeVisible();
  });
});
