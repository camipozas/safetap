import { expect, test } from '@playwright/test';

test.describe('Demo Emergency Page', () => {
  test('demo-chile page loads correctly', async ({ page }) => {
    await page.goto('/s/demo-chile');

    // Check that the page loads without errors
    await expect(page).toHaveTitle('safetap');

    // Check that main content is visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('displays Carlos Herrera profile information', async ({ page }) => {
    await page.goto('/s/demo-chile');

    // Check for main title with Chilean flag
    await expect(page.locator('h1')).toContainText('🇨🇱 Carlos Herrera');

    // Check for medical information
    await expect(page.locator('text=Sangre:')).toBeVisible();
    await expect(page.locator('text=O+')).toBeVisible();

    await expect(page.locator('text=Alergias:')).toBeVisible();
    await expect(page.locator('text=Penicilina, Nueces')).toBeVisible();

    await expect(page.locator('text=Condiciones:')).toBeVisible();
    await expect(page.locator('text=Diabetes tipo 2')).toBeVisible();

    await expect(page.locator('text=Medicaciones:')).toBeVisible();
    await expect(page.locator('text=Metformina 850mg')).toBeVisible();
  });

  test('displays emergency contacts section', async ({ page }) => {
    await page.goto('/s/demo-chile');

    // Check for emergency contacts section
    await expect(page.locator('h2')).toContainText('Contactos de emergencia');

    // Check for primary contact (spouse)
    await expect(page.locator('text=María Elena Herrera')).toBeVisible();
    await expect(page.locator('text=Esposa')).toBeVisible();
    await expect(page.locator('text=+56 9 1234 5678')).toBeVisible();
    await expect(page.locator('text=Preferido')).toBeVisible();

    // Check for doctor contact
    await expect(page.locator('text=Dr. José Martinez')).toBeVisible();
    await expect(page.locator('text=Médico tratante')).toBeVisible();

    // Check for daughter contact
    await expect(page.locator('text=Ana Herrera')).toBeVisible();
    await expect(page.locator('text=Hija')).toBeVisible();
  });

  test('displays demo disclaimer footer', async ({ page }) => {
    await page.goto('/s/demo-chile');

    // Check for demo disclaimer
    await expect(
      page.locator('text=Esta es una página de demostración de SafeTap')
    ).toBeVisible();
    await expect(
      page.locator(
        'text=En producción, esta información se generaría dinámicamente'
      )
    ).toBeVisible();
  });

  test('does not show sticker slug information', async ({ page }) => {
    await page.goto('/s/demo-chile');

    // Should NOT contain the sticker slug line
    await expect(page.locator('text=Sticker: /s/demo-chile')).not.toBeVisible();
  });
});
