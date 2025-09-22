'use client';

import Image from 'next/image';
import QRCode from 'qrcode';
import { memo, useEffect, useRef, useState } from 'react';

import { getMainAppUrl, getQrUrlForSticker } from '@/lib/url-utils';

// Configuration constants for high-quality QR generation
const QR_HIGH_QUALITY = 1.0;
const RESOLUTION_SCALE_FACTOR = 4; // Higher scale for crisp rendering
const ERROR_CORRECTION_LEVEL = 'H'; // High error correction for better readability

interface StickerQrCodeProps {
  stickerId?: string;
  slug?: string;
  size?: number;
  isPreview?: boolean;
  className?: string;
}

export const StickerQrCode = memo(function StickerQrCode({
  stickerId,
  slug,
  size = 120,
  isPreview = false,
  className = '',
}: StickerQrCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    let isMounted = true;

    const generateQR = async () => {
      if ((!stickerId && !slug) || isPreview) return;

      // Check if running in browser environment
      if (typeof window === 'undefined') return;

      try {
        // Get QR URL using the shared utility function
        let qrUrl: string;
        if (stickerId) {
          // If we have stickerId, use it for API lookup with slug as fallback
          qrUrl = await getQrUrlForSticker(stickerId, slug);
        } else {
          // If we only have slug, generate URL directly using environment-aware utility
          const mainAppUrl = getMainAppUrl();
          qrUrl = `${mainAppUrl}/s/${slug}`;
        }

        // High-quality QR code options
        const qrOptions = {
          width: size * RESOLUTION_SCALE_FACTOR, // High resolution for crisp rendering
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: ERROR_CORRECTION_LEVEL as 'L' | 'M' | 'Q' | 'H',
          type: 'image/png' as const,
          rendererOpts: {
            quality: QR_HIGH_QUALITY,
          },
        };

        const dataUrl = await QRCode.toDataURL(qrUrl, qrOptions);

        // Only update state if component is still mounted
        if (isMounted) {
          setQrDataUrl(dataUrl);
        }
      } catch {
        // Silent error handling - show loading state instead
        if (isMounted) {
          setQrDataUrl('');
        }
      }
    };

    generateQR();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [stickerId, slug, size, isPreview]);

  if (isPreview) {
    // Show a fake QR code pattern for preview mode
    return (
      <div
        className={`bg-white border border-gray-300 rounded ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          className="rounded"
        >
          {/* QR-like pattern */}
          <rect fill="#000" x="0" y="0" width="7" height="7" />
          <rect fill="#000" x="9" y="0" width="2" height="7" />
          <rect fill="#000" x="14" y="0" width="7" height="7" />
          <rect fill="#000" x="0" y="9" width="7" height="2" />
          <rect fill="#000" x="14" y="9" width="7" height="2" />
          <rect fill="#000" x="0" y="14" width="7" height="7" />
          <rect fill="#000" x="9" y="14" width="2" height="7" />
          <rect fill="#000" x="14" y="14" width="7" height="7" />

          {/* Random pattern for middle */}
          <rect fill="#000" x="25" y="5" width="2" height="2" />
          <rect fill="#000" x="30" y="8" width="3" height="2" />
          <rect fill="#000" x="28" y="12" width="2" height="3" />
          <rect fill="#000" x="35" y="6" width="2" height="2" />
          <rect fill="#000" x="38" y="10" width="3" height="2" />
          <rect fill="#000" x="25" y="16" width="2" height="2" />
          <rect fill="#000" x="30" y="19" width="2" height="2" />

          {/* Bottom corners */}
          <rect fill="#000" x="0" y="79" width="7" height="7" />
          <rect fill="#000" x="9" y="86" width="2" height="7" />
          <rect fill="#000" x="79" y="79" width="7" height="7" />
          <rect fill="#000" x="86" y="86" width="2" height="7" />

          {/* More random pattern */}
          <rect fill="#000" x="50" y="25" width="2" height="2" />
          <rect fill="#000" x="55" y="28" width="3" height="2" />
          <rect fill="#000" x="60" y="32" width="2" height="3" />
          <rect fill="#000" x="45" y="35" width="2" height="2" />

          {/* Semi-transparent overlay to show it's preview */}
          <rect
            fill="rgba(255,255,255,0.7)"
            x="0"
            y="0"
            width="100"
            height="100"
          />
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#666"
            fontSize="8"
            fontWeight="bold"
          >
            PREVIEW
          </text>
        </svg>
      </div>
    );
  }

  if ((!stickerId && !slug) || !qrDataUrl) {
    // Show loading state
    return (
      <div
        className={`bg-gray-100 border border-gray-300 flex items-center justify-center rounded ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <div className="text-gray-500 text-xs">Loading...</div>
      </div>
    );
  }

  // Show real QR code
  return (
    <div className={`relative ${className}`}>
      <Image
        src={qrDataUrl}
        alt="QR Code"
        width={size}
        height={size}
        className="rounded border border-gray-200 shadow-sm"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          imageRendering: 'crisp-edges', // Better rendering for QR codes
        }}
        priority={size > 100} // Prioritize larger QR codes
        unoptimized // Don't compress QR codes as they need to remain precise
      />
    </div>
  );
});
