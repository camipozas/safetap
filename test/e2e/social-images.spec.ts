import { expect, test } from '@playwright/test';

test.describe('Social Media Images Verification', () => {
  test('Open Graph images are accessible and properly formatted', async ({
    page,
  }) => {
    await page.goto('/');

    // Check Open Graph image meta tag
    const ogImage = page.locator('meta[property="og:image"]');
    const ogImageUrl = await ogImage.getAttribute('content');
    expect(ogImageUrl).toBeTruthy();

    // Verify the image URL is reachable
    if (ogImageUrl) {
      const response = await page.request.get(ogImageUrl);
      expect(response.status()).toBe(200);

      // Check that it's an image
      const contentType = response.headers()['content-type'];
      expect(contentType).toMatch(/image\/(png|jpeg|jpg|webp)/);
    }

    // Check image dimensions are specified
    const ogImageWidth = page.locator('meta[property="og:image:width"]');
    await expect(ogImageWidth).toHaveAttribute('content', '1200');

    const ogImageHeight = page.locator('meta[property="og:image:height"]');
    await expect(ogImageHeight).toHaveAttribute('content', '630');
  });

  test('Twitter Card images are accessible', async ({ page }) => {
    await page.goto('/');

    // Check Twitter image meta tag
    const twitterImage = page.locator('meta[name="twitter:image"]');
    const twitterImageUrl = await twitterImage.getAttribute('content');
    expect(twitterImageUrl).toBeTruthy();

    // Verify the image URL is reachable
    if (twitterImageUrl) {
      const response = await page.request.get(twitterImageUrl);
      expect(response.status()).toBe(200);

      // Check that it's an image
      const contentType = response.headers()['content-type'];
      expect(contentType).toMatch(/image\/(png|jpeg|jpg|webp)/);
    }
  });

  test('Profile pages have unique social images', async ({ page }) => {
    await page.goto('/s/demo-chile');

    // Check that profile has specific Open Graph image
    const ogImage = page.locator('meta[property="og:image"]');
    const ogImageUrl = await ogImage.getAttribute('content');
    expect(ogImageUrl).toBeTruthy();

    // Should not be the same as main site
    expect(ogImageUrl).not.toBe(
      'https://safetap.cl/api/og-image?title=SafeTap&type=og'
    );

    // Verify accessibility
    if (ogImageUrl) {
      const response = await page.request.get(ogImageUrl);
      expect(response.status()).toBe(200);
    }
  });

  test('Images have proper alt text for accessibility', async ({ page }) => {
    await page.goto('/');

    // Check Open Graph image alt text
    const ogImageAlt = page.locator('meta[property="og:image:alt"]');
    const altText = await ogImageAlt.getAttribute('content');
    expect(altText).toBeTruthy();
    expect(altText).toContain('SafeTap');
    expect(altText).toContain('emergencia');
  });

  test('Social sharing preview looks good', async ({ page }) => {
    await page.goto('/s/demo-chile');

    // Get all the social media meta tags
    const title = await page
      .locator('meta[property="og:title"]')
      .getAttribute('content');
    const description = await page
      .locator('meta[property="og:description"]')
      .getAttribute('content');
    const image = await page
      .locator('meta[property="og:image"]')
      .getAttribute('content');
    const url = await page
      .locator('meta[property="og:url"]')
      .getAttribute('content');

    // Verify all required elements are present
    expect(title).toBeTruthy();
    expect(description).toBeTruthy();
    expect(image).toBeTruthy();
    expect(url).toBeTruthy();

    // Verify content quality
    expect(title!.length).toBeGreaterThan(10);
    expect(title!.length).toBeLessThan(60); // Optimal for social media

    expect(description!.length).toBeGreaterThan(50);
    expect(description!.length).toBeLessThan(160); // Good for social media

    // Verify URL structure
    expect(url).toMatch(/^https:\/\/safetap\.cl\//);
  });
});
