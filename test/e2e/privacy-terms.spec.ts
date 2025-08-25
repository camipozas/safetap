import { expect, test } from '@playwright/test';

test.describe('Privacy and Terms Pages', () => {
  test.describe('Privacy Page', () => {
    test('privacy page loads correctly', async ({ page }) => {
      await page.goto('/privacy');

      // Wait for page to fully load
      await page.waitForLoadState('networkidle');

      // Check that the page loads without errors
      await expect(page).toHaveTitle('SafeTap', { timeout: 10000 });

      // Check that main content is visible
      await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    });

    test('displays privacy policy content in Spanish', async ({ page }) => {
      await page.goto('/privacy');

      // Check for main heading
      await expect(page.locator('h1')).toContainText('Política de Privacidad');

      // Check for key sections - use more specific selectors
      await expect(
        page.getByRole('heading', { name: 'Información que Recopilamos' })
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Cómo Utilizamos tu Información' })
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Compartir Información' })
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Seguridad de los Datos' })
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Tus Derechos' })
      ).toBeVisible();

      // Check for specific privacy-related content
      await expect(
        page.locator('text=En safetap, valoramos y protegemos tu privacidad')
      ).toBeVisible();
      await expect(page.locator('text=Información de perfil:')).toBeVisible();
      await expect(page.locator('text=Información de cuenta:')).toBeVisible();

      // Check for contact information
      await expect(page.locator('text=privacy@safetap.cl')).toBeVisible();
      await expect(
        page.locator('text=Dirección: Santiago, Chile')
      ).toBeVisible();
    });

    test('displays last updated date', async ({ page }) => {
      await page.goto('/privacy');

      // Check for last updated date
      await expect(page.locator('text=Última actualización:')).toBeVisible();
    });
  });

  test.describe('Terms Page', () => {
    test('terms page loads correctly', async ({ page }) => {
      await page.goto('/terms');

      // Wait for page to fully load
      await page.waitForLoadState('networkidle');

      // Check that the page loads without errors
      await expect(page).toHaveTitle('SafeTap', { timeout: 10000 });

      // Check that main content is visible
      await expect(page.locator('body')).toBeVisible();
    });

    test('displays terms and conditions content in Spanish', async ({
      page,
    }) => {
      await page.goto('/terms');

      // Check for main heading
      await expect(page.locator('h1')).toContainText('Términos y Condiciones');

      // Check for key sections - use more specific selectors
      await expect(
        page.getByRole('heading', { name: 'Descripción del Servicio' })
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Registro y Cuenta' })
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Uso Aceptable' })
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: 'Pago y Facturación' })
      ).toBeVisible();
      await expect(
        page.getByRole('heading', { name: '5. Privacidad e Información' })
      ).toBeVisible();

      // Check for specific terms-related content
      await expect(
        page.locator(
          'text=Estos términos y condiciones rigen el uso del servicio safetap'
        )
      ).toBeVisible();
      await expect(
        page.locator(
          'text=safetap es un servicio que proporciona stickers inteligentes'
        )
      ).toBeVisible();

      // Check for contact information
      await expect(page.locator('text=legal@safetap.cl')).toBeVisible();
      await expect(
        page.locator('text=Dirección: Santiago, Chile')
      ).toBeVisible();
    });

    test('contains cross-reference link to privacy policy', async ({
      page,
    }) => {
      await page.goto('/terms');

      // Check for privacy policy link in the main content (not footer)
      const privacyLink = page.getByRole('link', {
        name: 'Política de Privacidad',
      });
      await expect(privacyLink).toBeVisible();
      await expect(privacyLink).toHaveAttribute('href', '/privacy');
    });

    test('displays last updated date', async ({ page }) => {
      await page.goto('/terms');

      // Check for last updated date
      await expect(page.locator('text=Última actualización:')).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('privacy link in terms page works', async ({ page }) => {
      await page.goto('/terms');

      // Click on privacy policy link in main content
      const privacyLink = page.getByRole('link', {
        name: 'Política de Privacidad',
      });
      await privacyLink.click();

      // Should navigate to privacy page
      await expect(page).toHaveURL('/privacy');
      await expect(page.locator('h1')).toContainText('Política de Privacidad');
    });
  });
});

test.describe('Footer Links', () => {
  test('footer contains privacy and terms links on homepage', async ({
    page,
  }) => {
    await page.goto('/');

    // Check for footer links
    const footer = page.locator('footer');

    const privacyLink = footer.locator('a[href="/privacy"]');
    await expect(privacyLink).toBeVisible();
    await expect(privacyLink).toContainText('Privacidad');

    const termsLink = footer.locator('a[href="/terms"]');
    await expect(termsLink).toBeVisible();
    await expect(termsLink).toContainText('Términos y Condiciones');
  });

  test('footer privacy link navigates correctly', async ({ page }) => {
    await page.goto('/');

    // Click on privacy link in footer
    const privacyLink = page.locator('footer a[href="/privacy"]');
    await privacyLink.click();

    // Should navigate to privacy page
    await expect(page).toHaveURL('/privacy');
    await expect(page.locator('h1')).toContainText('Política de Privacidad');
  });

  test('footer terms link navigates correctly', async ({ page }) => {
    await page.goto('/');

    // Click on terms link in footer
    const termsLink = page.locator('footer a[href="/terms"]');
    await termsLink.click();

    // Should navigate to terms page
    await expect(page).toHaveURL('/terms');
    await expect(page.locator('h1')).toContainText('Términos y Condiciones');
  });

  test('footer links are present on all main pages', async ({ page }) => {
    const pagesToTest = ['/', '/buy', '/login'];

    for (const pagePath of pagesToTest) {
      await page.goto(pagePath);

      const footer = page.locator('footer');

      // Check privacy link
      const privacyLink = footer.locator('a[href="/privacy"]');
      await expect(privacyLink).toBeVisible();

      // Check terms link
      const termsLink = footer.locator('a[href="/terms"]');
      await expect(termsLink).toBeVisible();
    }
  });
});
