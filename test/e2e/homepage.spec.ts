import { expect, test } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads successfully', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads without errors
    await expect(page).toHaveTitle('SafeTap - Tu información vital, en un tap');

    // Check that main content is visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('displays main navigation elements', async ({ page }) => {
    await page.goto('/');

    // Check for key navigation elements
    await expect(
      page.locator('header').getByRole('link', { name: 'Inicio SafeTap' })
    ).toBeVisible();

    // Check for main action buttons - should only have "Comprar ahora" now
    const buyButton = page.getByRole('link', { name: 'Comprar ahora' });
    await expect(buyButton).toBeVisible();
    await expect(buyButton).toHaveAttribute('href', '/buy');

    // Verify the "Ver ejemplo" button is NOT present in hero section
    const heroSection = page.locator('section').first();
    await expect(heroSection.locator('text=Ver ejemplo')).not.toBeVisible();
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

  test('displays demo sticker with Chilean data', async ({ page }) => {
    await page.goto('/');

    // Check that the demo sticker section is visible
    const productSection = page.locator('section').nth(1); // Second section should be product preview

    // Should contain Chilean flag and Carlos Herrera name in the sticker
    await expect(productSection).toBeVisible();

    // Check for the contact info link below the sticker
    const contactLink = page.locator(
      'text=Ver ejemplo información de contacto →'
    );
    await expect(contactLink).toBeVisible();

    // Verify the link points to the demo page
    await expect(contactLink).toHaveAttribute('href', '/s/demo-chile');
  });

  test('sticker demo link navigates correctly', async ({ page }) => {
    await page.goto('/');

    // Click on the contact info link
    const contactLink = page.locator(
      'text=Ver ejemplo información de contacto →'
    );
    await contactLink.click();

    // Should navigate to demo emergency page
    await expect(page).toHaveURL('/s/demo-chile');

    // Should show María González profile
    await expect(
      page.getByRole('heading', { name: 'Información de Emergencia' })
    ).toBeVisible();
    await expect(page.getByText('María González')).toBeVisible();
  });

  test('footer contains privacy and terms links', async ({ page }) => {
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
});
