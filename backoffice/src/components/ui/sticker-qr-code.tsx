'use client';

import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

interface StickerQrCodeProps {
  slug?: string;
  size?: number;
  isPreview?: boolean;
  className?: string;
}

const getBaseUrl = () => {
  if (typeof window === 'undefined') {
    const MAINAPP_PORT = process.env.NEXT_PUBLIC_MAINAPP_PORT || '3000';
    return (
      process.env.NEXT_PUBLIC_BASE_URL || `http://localhost:${MAINAPP_PORT}`
    );
  }

  // Use environment variables for ports, fallback to defaults if not set
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
};

export function StickerQrCode({
  slug,
  size = 64,
  isPreview = false,
  className = '',
}: StickerQrCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const generateQR = async () => {
      if (!slug || isPreview) return;

      // Check if running in browser environment
      if (typeof window === 'undefined') return;

      try {
        const qrUrl = `${getBaseUrl()}/s/${slug}`;
        const dataUrl = await QRCode.toDataURL(qrUrl, {
          width: size * 2, // Generate at 2x for better quality
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });

        // Only update state if component is still mounted
        if (isMounted) {
          setQrDataUrl(dataUrl);
        }
      } catch (error) {
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
    };
  }, [slug, size, isPreview]);

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

  if (!slug || !qrDataUrl) {
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
      <img
        src={qrDataUrl}
        alt="QR Code"
        className="rounded"
        style={{ width: `${size}px`, height: `${size}px` }}
      />
    </div>
  );
}
