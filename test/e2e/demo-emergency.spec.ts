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

  test('has proper SEO meta tags for social sharing', async ({ page }) => {
    await page.goto('/s/demo-chile');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check basic meta tags
    await expect(page).toHaveTitle(
      'Demo SafeTap Chile - Información de Emergencia | SafeTap'
    );

    // Check Open Graph meta tags
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute(
      'content',
      'Demo SafeTap Chile - Información de Emergencia'
    );

    const ogDescription = page.locator('meta[property="og:description"]');
    await expect(ogDescription).toHaveAttribute(
      'content',
      /Ejemplo interactivo de perfil de emergencia SafeTap/
    );

    const ogUrl = page.locator('meta[property="og:url"]');
    await expect(ogUrl).toHaveAttribute(
      'content',
      'https://safetap.cl/s/demo-chile'
    );

    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveAttribute(
      'content',
      'https://safetap.cl/og-image.png'
    );

    const ogType = page.locator('meta[property="og:type"]');
    await expect(ogType).toHaveAttribute('content', 'website');

    // Check Twitter Card meta tags
    const twitterCard = page.locator('meta[name="twitter:card"]');
    await expect(twitterCard).toHaveAttribute('content', 'summary_large_image');

    const twitterTitle = page.locator('meta[name="twitter:title"]');
    await expect(twitterTitle).toHaveAttribute(
      'content',
      'Demo SafeTap Chile - Información de Emergencia'
    );

    const twitterDescription = page.locator('meta[name="twitter:description"]');
    await expect(twitterDescription).toHaveAttribute(
      'content',
      /Ejemplo interactivo de perfil de emergencia SafeTap/
    );
  });

  test('URLs are SEO-friendly and not too long', async ({ page }) => {
    await page.goto('/s/demo-chile');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check that current URL is clean and SEO-friendly
    const currentUrl = page.url();
    expect(currentUrl).toBe('http://localhost:3000/s/demo-chile');

    // Verify URL length is reasonable for SEO (Google recommends < 100 characters for URLs)
    expect(currentUrl.length).toBeLessThan(100);

    // Check that the URL doesn't contain unnecessary parameters
    expect(currentUrl).not.toContain('?');
    expect(currentUrl).not.toContain('#');

    // Verify URL structure is clean and readable
    expect(currentUrl).toMatch(/^https?:\/\/[^\/]+\/s\/[a-z0-9-]+$/);

    // Check canonical URL meta tag if present
    const canonicalLink = page.locator('link[rel="canonical"]');
    if ((await canonicalLink.count()) > 0) {
      const canonicalUrl = await canonicalLink.getAttribute('href');
      expect(canonicalUrl).toBe('https://safetap.cl/s/demo-chile');
    }
  });
});
