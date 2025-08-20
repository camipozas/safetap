import { expect, test } from '@playwright/test';

test.describe('Demo Emergency Page', () => {
  test('demo-chile page loads correctly', async ({ page }) => {
    await page.goto('/s/demo-chile');

    // Check that the page loads without errors
    await expect(page).toHaveTitle('safetap');

    // Check that main content is visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('displays María González profile information', async ({ page }) => {
    await page.goto('/s/demo-chile');

    // Check for main title and name
    await expect(page.getByText('🚨 INFORMACIÓN DE EMERGENCIA')).toBeVisible();
    await expect(page.getByText('María González')).toBeVisible();

    // Check for medical information
    await expect(page.getByText('Tipo de sangre')).toBeVisible();
    await expect(page.locator('text=O+')).toBeVisible();

    await expect(page.getByText('Alergias')).toBeVisible();
    await expect(page.locator('text=Penicilina')).toBeVisible();

    await expect(page.getByText('Condiciones médicas')).toBeVisible();
    await expect(page.locator('text=Diabetes')).toBeVisible();

    await expect(page.getByText('Medicamentos')).toBeVisible();
    await expect(page.locator('text=Insulina')).toBeVisible();
  });

  test('displays emergency contacts section', async ({ page }) => {
    await page.goto('/s/demo-chile');

    // Check for emergency contacts section
    await expect(page.locator('h2')).toContainText('Contactos de emergencia');

    // Check for primary contact (spouse)
    await expect(page.locator('text=Carlos González')).toBeVisible();
    await expect(page.locator('text=Esposo')).toBeVisible();
    await expect(page.locator('text=+56912345678')).toBeVisible();
    await expect(page.locator('text=Preferido')).toBeVisible();

    // Check for doctor contact
    await expect(page.locator('text=Dr. Pedro Ramírez')).toBeVisible();
    await expect(page.locator('text=Endocrinólogo')).toBeVisible();

    // Check for daughter contact
    await expect(page.locator('text=Ana González')).toBeVisible();
    await expect(page.locator('text=Hija')).toBeVisible();
  });

  test('displays demo disclaimer footer', async ({ page }) => {
    await page.goto('/s/demo-chile');

    // Check for demo disclaimer
    await expect(page.locator('text=Ejemplo de perfil SafeTap')).toBeVisible();
    await expect(
      page.locator(
        'text=Este es un ejemplo de cómo se ve la información de emergencia'
      )
    ).toBeVisible();
  });

  test('does not show sticker slug information', async ({ page }) => {
    await page.goto('/s/demo-chile');

    // Should NOT contain the sticker slug line
    await expect(page.locator('text=Sticker: /s/demo-chile')).not.toBeVisible();
  });
});
