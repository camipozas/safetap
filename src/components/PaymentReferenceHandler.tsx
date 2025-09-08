'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PaymentReferenceHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasCheckedRedirect, setHasCheckedRedirect] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    console.log('🔄 PaymentReferenceHandler: useEffect triggered');
    console.log(
      '🔄 PaymentReferenceHandler: searchParams:',
      searchParams.toString()
    );
    console.log(
      '🔄 PaymentReferenceHandler: hasCheckedRedirect:',
      hasCheckedRedirect
    );

    // Check if we already have a ref parameter in the URL
    const currentRef = searchParams.get('ref');
    if (currentRef) {
      console.log('🔄 PaymentReferenceHandler: Found ref in URL:', currentRef);
      // If we have a ref in URL, clear sessionStorage to avoid conflicts
      sessionStorage.removeItem('pendingPaymentRef');

      // Check if we should redirect to edit profile
      if (!hasCheckedRedirect) {
        console.log(
          '🔄 PaymentReferenceHandler: Checking redirect to edit profile'
        );
        checkAndRedirectToEditProfile(currentRef);
        setHasCheckedRedirect(true);
      }
      return;
    }

    // Check if we have a pending payment reference in sessionStorage
    const pendingRef = sessionStorage.getItem('pendingPaymentRef');
    if (pendingRef) {
      console.log(
        '🔄 PaymentReferenceHandler: Found pending ref in sessionStorage:',
        pendingRef
      );
      // Clear the stored reference and redirect with it in the URL
      sessionStorage.removeItem('pendingPaymentRef');
      console.log('🔄 Restoring payment reference after login:', pendingRef);
      router.replace(`/account?ref=${encodeURIComponent(pendingRef)}`);
    } else {
      console.log('🔄 PaymentReferenceHandler: No ref found, doing nothing');
    }
  }, [router, searchParams, hasCheckedRedirect]);

  const checkAndRedirectToEditProfile = async (reference: string) => {
    try {
      console.log(
        '🔄 PaymentReferenceHandler: Checking profile setup for reference:',
        reference
      );
      // Check if this is a new purchase that needs profile setup
      const response = await fetch(
        `/api/payments/${reference}/check-profile-setup`
      );

      console.log(
        '🔄 PaymentReferenceHandler: API response status:',
        response.status
      );
      if (response.ok) {
        const data = await response.json();
        console.log('🔄 PaymentReferenceHandler: API response data:', data);

        // If the payment is pending and has no emergency profile, redirect to edit
        if (data.shouldRedirectToEdit && data.stickerId) {
          console.log(
            '🔄 PaymentReferenceHandler: Redirecting to edit profile for new purchase:',
            data.stickerId
          );
          // Use replace instead of push to avoid navigation conflicts
          router.replace(`/sticker/${data.stickerId}/profile/edit?new=true`);
        } else {
          console.log(
            '🔄 PaymentReferenceHandler: No redirect needed, staying on account page'
          );
        }
      } else {
        console.log(
          '🔄 PaymentReferenceHandler: API response not ok, staying on account page'
        );
      }
    } catch (error) {
      console.error(
        '🔄 PaymentReferenceHandler: Error checking profile setup:',
        error
      );
      // Don't redirect if there's an error - let user stay on account page
    }
  };

  return null; // This component doesn't render anything
}
