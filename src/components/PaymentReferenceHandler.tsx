'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function PaymentReferenceHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
      return;
    }

    // Check if we have a pending payment reference in sessionStorage
    const pendingRef = sessionStorage.getItem('pendingPaymentRef');
    if (pendingRef) {
      // Clear the stored reference and redirect with it in the URL
      sessionStorage.removeItem('pendingPaymentRef');
      console.log('🔄 Restoring payment reference after login:', pendingRef);
      router.replace(`/account?ref=${encodeURIComponent(pendingRef)}`);
    }
  }, [router, searchParams]);

  return null; // This component doesn't render anything
}
