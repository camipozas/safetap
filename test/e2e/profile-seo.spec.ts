import { expect, test } from '@playwright/test';

test.describe('Profile SEO Meta Tags', () => {
  test('dynamic profile pages have proper meta tags', async ({ page }) => {
    // Test the demo profile page
    await page.goto('/s/demo-chile');
    await page.waitForLoadState('networkidle');

    // Check that meta tags are generated dynamically
    const pageTitle = await page.title();
    expect(pageTitle).toContain('Demo SafeTap Chile');
    expect(pageTitle).toContain('SafeTap');

    // Check Open Graph title
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute(
      'content',
      'Demo SafeTap Chile - Información de Emergencia'
    );

    // Check that URL is properly formed
    const ogUrl = page.locator('meta[property="og:url"]');
    await expect(ogUrl).toHaveAttribute(
      'content',
      'https://safetap.cl/s/demo-chile'
    );

    // Check that description is informative
    const ogDescription = page.locator('meta[property="og:description"]');
    const descriptionContent = await ogDescription.getAttribute('content');
    expect(descriptionContent).not.toBeNull();
    expect(descriptionContent).toContain('SafeTap');
    expect(descriptionContent!.length).toBeGreaterThan(50); // Adequate length for SEO
    expect(descriptionContent!.length).toBeLessThan(160); // Not too long for search results
  });

  test('profile URLs are clean and SEO-friendly', async ({ page }) => {
    await page.goto('/s/demo-chile');

    // Verify URL structure
    const currentUrl = page.url();

    // Check URL length (should be under 100 characters for optimal SEO)
    expect(currentUrl.length).toBeLessThan(100);

    // Check URL contains no unnecessary query parameters
    expect(currentUrl).not.toContain('?');
    expect(currentUrl).not.toContain('&');

    // Check URL is clean and readable
    expect(currentUrl).toMatch(/\/s\/[a-z0-9-]+$/);

    // Verify slug is meaningful
    expect(currentUrl).toContain('demo-chile');
  });

  test('meta images are optimized for sharing', async ({ page }) => {
    await page.goto('/s/demo-chile');

    // Check Open Graph image
    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveAttribute(
      'content',
      'https://safetap.cl/favicon.svg'
    );

    // Check image dimensions are specified
    const ogImageWidth = page.locator('meta[property="og:image:width"]');
    await expect(ogImageWidth).toHaveAttribute('content', '1200');

    const ogImageHeight = page.locator('meta[property="og:image:height"]');
    await expect(ogImageHeight).toHaveAttribute('content', '630');

    // Check alt text is provided
    const ogImageAlt = page.locator('meta[property="og:image:alt"]');
    const altText = await ogImageAlt.getAttribute('content');
    expect(altText).toContain('SafeTap');
    expect(altText).toContain('emergencia');
  });

  test('Twitter Cards are properly configured', async ({ page }) => {
    await page.goto('/s/demo-chile');

    // Check Twitter card type
    const twitterCard = page.locator('meta[name="twitter:card"]');
    await expect(twitterCard).toHaveAttribute('content', 'summary_large_image');

    // Check Twitter title
    const twitterTitle = page.locator('meta[name="twitter:title"]');
    await expect(twitterTitle).toHaveAttribute(
      'content',
      'Demo SafeTap Chile - Información de Emergencia'
    );

    // Check Twitter description
    const twitterDescription = page.locator('meta[name="twitter:description"]');
    const descContent = await twitterDescription.getAttribute('content');
    expect(descContent).not.toBeNull();
    expect(descContent).toContain('SafeTap');
    expect(descContent!.length).toBeLessThan(200); // Twitter description limit

    // Check Twitter image
    const twitterImage = page.locator('meta[name="twitter:image"]');
    await expect(twitterImage).toHaveAttribute(
      'content',
      'https://safetap.cl/favicon.svg'
    );
  });

  test('privacy and indexing settings are appropriate', async ({ page }) => {
    await page.goto('/s/demo-chile');

    // Demo page should be indexable for SEO purposes
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toHaveAttribute('content', 'index, follow');

    // Check other potential robot directives
    const googleBot = page.locator('meta[name="googlebot"]');
    if ((await googleBot.count()) > 0) {
      const content = await googleBot.getAttribute('content');
      expect(content).toContain('index');
      expect(content).toContain('follow');
    }
  });
});
