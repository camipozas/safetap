'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function PaymentReferenceHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasCheckedRedirect, setHasCheckedRedirect] = useState(false);

  const checkAndRedirectToEditProfile = useCallback(
    async (reference: string) => {
      try {
        // Check if this is a new purchase that needs profile setup
        const response = await fetch(
          `/api/payments/${reference}/check-profile-setup`
        );

        if (response.ok) {
          const data = await response.json();

          // If the payment is pending and has no emergency profile, redirect to edit
          if (data.shouldRedirectToEdit && data.stickerId) {
            // Use replace instead of push to avoid navigation conflicts
            router.replace(`/sticker/${data.stickerId}/profile/edit?new=true`);
          }
        }
      } catch (error) {
        console.error(
          'PaymentReferenceHandler: Error checking profile setup:',
          error
        );
        // Don't redirect if there's an error - let user stay on account page
      }
    },
    [router]
  );

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    // Check if we already have a ref parameter in the URL
    const currentRef = searchParams.get('ref');
    if (currentRef) {
      // If we have a ref in URL, clear sessionStorage to avoid conflicts
      sessionStorage.removeItem('pendingPaymentRef');

      // Check if we should redirect to edit profile
      if (!hasCheckedRedirect) {
        checkAndRedirectToEditProfile(currentRef);
        setHasCheckedRedirect(true);
      }
      return;
    }

    // Check if we have a pending payment reference in sessionStorage
    const pendingRef = sessionStorage.getItem('pendingPaymentRef');
    if (pendingRef) {
      // Clear the stored reference and redirect with it in the URL
      sessionStorage.removeItem('pendingPaymentRef');
      router.replace(`/account?ref=${encodeURIComponent(pendingRef)}`);
    }
  }, [router, searchParams, hasCheckedRedirect, checkAndRedirectToEditProfile]);

  return null; // This component doesn't render anything
}
