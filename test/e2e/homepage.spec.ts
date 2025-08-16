import { expect, test } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads successfully', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads without errors
    await expect(page).toHaveTitle('safetap');

    // Check that main content is visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('displays main navigation elements', async ({ page }) => {
    await page.goto('/');

    // Check for key navigation elements
    await expect(
      page.locator('header').getByRole('link', { name: 'Inicio safetap' })
    ).toBeVisible();

    // Check for main action buttons
    const ctaButtons = page.locator('a[href*="buy"], a[href*="login"]');
    await expect(ctaButtons.first()).toBeVisible();
  });

  test('has accessible content', async ({ page }) => {
    await page.goto('/');

    // Check for proper heading structure
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();

    // Check for proper alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });
});
