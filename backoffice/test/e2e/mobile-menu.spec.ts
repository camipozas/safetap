import { expect, test } from '@playwright/test';

test.describe('Backoffice Mobile Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('mobile menu button works correctly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const menuButton = page.getByTestId('mobile-toggle');
    await expect(menuButton).toBeVisible();

    const sidebar = page.getByTestId('sidebar-container');
    await expect(sidebar).toHaveAttribute('data-open', 'false');

    await menuButton.click();

    await expect(sidebar).toHaveAttribute('data-open', 'true');

    const overlay = page.locator('.fixed.inset-0.bg-black.bg-opacity-50');
    await expect(overlay).toBeVisible();

    await overlay.click();

    await expect(sidebar).toHaveAttribute('data-open', 'false');
  });

  test('menu button has proper touch optimization', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const menuButton = page.getByTestId('mobile-toggle');
    await expect(menuButton).toBeVisible();

    await expect(menuButton).toHaveClass(/touch-manipulation/);
  });

  test('navigation works in mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const menuButton = page.getByTestId('mobile-toggle');
    await menuButton.click();

    const ordersLink = page.getByText('Órdenes');
    await ordersLink.click();

    await expect(page).toHaveURL(/.*\/dashboard\/orders/);

    const sidebar = page.getByTestId('sidebar-container');
    await expect(sidebar).toHaveAttribute('data-open', 'false');
  });
});
