/**
 * Utility functions for URL generation in the backoffice
 */

/**
 * Gets the base URL for the main application (not backoffice).
 * Handles different environments including development and production.
 */
export function getMainAppUrl(): string {
  if (typeof window === 'undefined') {
    return (
      process.env.NEXT_PUBLIC_MAIN_APP_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      `http://localhost:${process.env.NEXT_PUBLIC_MAINAPP_PORT || '3000'}`
    );
  }

  if (process.env.NEXT_PUBLIC_MAIN_APP_URL) {
    return process.env.NEXT_PUBLIC_MAIN_APP_URL;
  }

  const BACKOFFICE_PORT = process.env.NEXT_PUBLIC_BACKOFFICE_PORT || '3001';
  const MAINAPP_PORT = process.env.NEXT_PUBLIC_MAINAPP_PORT || '3000';
  const { protocol, hostname } = window.location;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const currentOrigin = window.location.origin;
    if (currentOrigin.includes(`:${BACKOFFICE_PORT}`)) {
      return currentOrigin.replace(`:${BACKOFFICE_PORT}`, `:${MAINAPP_PORT}`);
    }
    return `${protocol}//${hostname}:${MAINAPP_PORT}`;
  }

  return `${protocol}//${hostname}`;
}

/**
 * Gets the emergency profile URL for a sticker, with fallback to slug-based URL.
 * This function handles the API call and fallback logic used in QR generation.
 *
 * @param stickerId - The sticker's database ID
 * @param fallbackSlug - The slug to use in fallback URL construction if API call fails
 * @returns Promise resolving to the QR URL (either emergency profile or slug-based)
 */
export async function getQrUrlForSticker(
  stickerId: string,
  fallbackSlug?: string
): Promise<string> {
  try {
    const response = await fetch(
      `/api/admin/emergency-profile-url/${stickerId}`
    );

    if (response.ok) {
      const data = await response.json();
      return data.emergencyUrl;
    }
  } catch (error) {
    console.warn(
      'Failed to fetch emergency profile URL for sticker:',
      stickerId,
      error
    );
  }

  // CRITICAL: Use the fallbackSlug if provided, don't use stickerId as slug
  if (!fallbackSlug) {
    console.error(
      `No fallback slug provided for sticker ${stickerId}. This will likely result in a broken URL.`
    );
  }

  const mainAppUrl = getMainAppUrl();
  const slug = fallbackSlug || 'missing-slug';
  return `${mainAppUrl}/s/${slug}`;
}
