import { expect, test } from '@playwright/test';

test.describe('Demo Emergency Page', () => {
  test('demo-chile page loads correctly', async ({ page }) => {
    await page.goto('/s/demo-chile');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check that the page loads without errors
    await expect(page).toHaveTitle(
      'Demo SafeTap Chile - Información de Emergencia | SafeTap',
      { timeout: 10000 }
    );

    // Check that main content is visible
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  });

  test('displays María González profile information', async ({ page }) => {
    await page.goto('/s/demo-chile');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check for main title and name using specific role selector
    await expect(
      page.getByRole('heading', { name: 'Información de Emergencia' })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole('heading', { name: 'María González' })
    ).toBeVisible({ timeout: 10000 });

    // Check for medical information
    await expect(page.getByText('Tipo de sangre')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('text=O+').first()).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByText('Alergias')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Penicilina')).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByText('Condiciones médicas')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('text=Diabetes')).toBeVisible({ timeout: 10000 });

    await expect(page.getByText('Medicamentos')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('text=Insulina')).toBeVisible({ timeout: 10000 });
  });

  test('displays emergency contacts section', async ({ page }) => {
    await page.goto('/s/demo-chile');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check for emergency contacts section
    await expect(
      page.getByRole('heading', { name: 'Contactos de emergencia' })
    ).toBeVisible({ timeout: 10000 });

    // Check for primary contact (spouse)
    await expect(page.locator('text=Carlos González')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('text=Esposo')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=+56912345678')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('text=Preferido')).toBeVisible({
      timeout: 10000,
    });

    // Check for doctor contact
    await expect(page.locator('text=Dr. Pedro Ramírez')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('text=Endocrinólogo')).toBeVisible({
      timeout: 10000,
    });

    // Check for daughter contact
    await expect(page.locator('text=Ana González')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('text=Hija')).toBeVisible({ timeout: 10000 });
  });

  test('displays demo disclaimer footer', async ({ page }) => {
    await page.goto('/s/demo-chile');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check for demo disclaimer - use the first occurrence in the demo banner
    await expect(
      page.locator('p.font-semibold.text-blue-900').first()
    ).toContainText('Ejemplo de perfil SafeTap', { timeout: 10000 });
    await expect(
      page
        .locator(
          'text=Este es un ejemplo de cómo se ve la información de emergencia'
        )
        .first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('does not show sticker slug information', async ({ page }) => {
    await page.goto('/s/demo-chile');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Should NOT contain the sticker slug line
    await expect(page.locator('text=Sticker: /s/demo-chile')).not.toBeVisible();
  });
});
