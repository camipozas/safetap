'use client';

import { useEffect, useState } from 'react';

export function useTemporaryPaymentRef() {
  const [tempReference, setTempReference] = useState<string | null>(null);

  useEffect(() => {
    // Check if we already have a pending payment reference first
    let existingRef = sessionStorage.getItem('pendingPaymentRef');

    if (!existingRef) {
      // Check for temporary reference
      existingRef = sessionStorage.getItem('tempPaymentRef');

      if (!existingRef) {
        // Generate a new temporary reference
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const timeStr = now.getTime().toString().slice(-6); // Last 6 digits of timestamp
        existingRef = `SAFETAP-${dateStr}-${timeStr}`;

        sessionStorage.setItem('tempPaymentRef', existingRef);
      }
    }

    setTempReference(existingRef);
  }, []);

  const clearTemporaryRef = () => {
    sessionStorage.removeItem('tempPaymentRef');
    sessionStorage.removeItem('pendingPaymentRef');
    setTempReference(null);
  };

  const markAsConfirmed = (confirmedRef: string) => {
    // Move from temp to pending and clear temp
    sessionStorage.removeItem('tempPaymentRef');
    sessionStorage.setItem('pendingPaymentRef', confirmedRef);
    setTempReference(confirmedRef);
  };

  return { tempReference, clearTemporaryRef, markAsConfirmed };
}
