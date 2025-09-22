/**
 * Utility functions for URL generation in the backoffice
 */

/**
 * Gets the base URL for the main application (not backoffice).
 * Handles different environments including development and production.
 */
export function getMainAppUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side: Use environment variables with fallbacks
    return (
      process.env.NEXT_PUBLIC_MAIN_APP_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      `http://localhost:${process.env.NEXT_PUBLIC_MAINAPP_PORT || '3000'}`
    );
  }

  // Client-side: Check if we have a dedicated main app URL set
  if (process.env.NEXT_PUBLIC_MAIN_APP_URL) {
    return process.env.NEXT_PUBLIC_MAIN_APP_URL;
  }

  // Use environment variables for ports, fallback to defaults if not set
  const BACKOFFICE_PORT = process.env.NEXT_PUBLIC_BACKOFFICE_PORT || '3001';
  const MAINAPP_PORT = process.env.NEXT_PUBLIC_MAINAPP_PORT || '3000';
  const { protocol, hostname } = window.location;

  // Handle localhost/development environments
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const currentOrigin = window.location.origin;
    // If current URL contains the backoffice port, replace with main app port
    if (currentOrigin.includes(`:${BACKOFFICE_PORT}`)) {
      return currentOrigin.replace(`:${BACKOFFICE_PORT}`, `:${MAINAPP_PORT}`);
    }
    // Otherwise construct the main app URL
    return `${protocol}//${hostname}:${MAINAPP_PORT}`;
  }

  // Production environment: assume same hostname without port
  return `${protocol}//${hostname}`;
}

/**
 * Gets the emergency profile URL for a sticker, with fallback to slug-based URL.
 * This function handles the API call and fallback logic used in QR generation.
 *
 * @param stickerId - The sticker's database ID (preferred) or slug (fallback)
 * @param fallbackSlug - The slug to use in fallback URL construction if API call fails
 * @returns Promise resolving to the QR URL (either emergency profile or slug-based)
 */
export async function getQrUrlForSticker(
  stickerId: string,
  fallbackSlug?: string
): Promise<string> {
  try {
    // Try to get emergency profile URL first
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

  // Fallback to slug-based URL if emergency profile not available
  const mainAppUrl = getMainAppUrl();
  const slug = fallbackSlug || stickerId; // Use stickerId as fallback if no slug provided
  return `${mainAppUrl}/s/${slug}`;
}
