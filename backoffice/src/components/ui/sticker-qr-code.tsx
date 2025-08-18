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
