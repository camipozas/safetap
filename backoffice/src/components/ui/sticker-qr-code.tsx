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
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }
  return window.location.origin.replace(':3002', '');
};

export function StickerQrCode({
  slug,
  size = 64,
  isPreview = false,
  className = '',
}: StickerQrCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const generateQR = async () => {
      if (!slug || isPreview) return;

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
        setQrDataUrl(dataUrl);
      } catch (error) {
        // Silent error handling - show loading state instead
        setQrDataUrl('');
      }
    };

    generateQR();
  }, [slug, size, isPreview]);

  if (isPreview) {
    // Show placeholder for preview mode
    return (
      <div
        className={`bg-gray-200 border border-gray-300 flex items-center justify-center rounded ${className}`}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <div className="text-gray-500 text-xs text-center">
          <div className="w-4 h-4 bg-gray-400 mx-auto mb-1 rounded-sm flex items-center justify-center">
            <span className="text-white text-xs">QR</span>
          </div>
          <span className="text-xs">Preview</span>
        </div>
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
