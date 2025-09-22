'use client';
import { QrCanvas } from '@/components/QrCanvas';

interface StickerQrCodeProps {
  stickerId?: string;
  serial?: string;
  slug?: string;
  size?: number;
  isPreview?: boolean;
  className?: string;
  highQuality?: boolean; // Force high quality for production stickers
  baseUrl?: string; // Base URL for the QR code, should be passed from server
}

export function StickerQrCode({
  stickerId,
  serial,
  slug,
  size = 64,
  isPreview = false,
  className = '',
  highQuality = false,
  baseUrl,
}: StickerQrCodeProps) {
  const defaultBaseUrl = 'https://safetap.cl';
  const resolvedBaseUrl = baseUrl || defaultBaseUrl;

  const identifier = slug || serial || stickerId || 'demo-sticker';
  const qrUrl = `${resolvedBaseUrl}/s/${identifier}`;

  const qrKey = `${identifier}-${size}-${isPreview}-${highQuality}`;

  if (isPreview) {
    // Generate a real QR code for preview, but it won't work in this context
    // This will look exactly like a real QR but won't be functional
    return (
      <div className={`relative ${className}`}>
        <QrCanvas
          key={qrKey}
          url={`${resolvedBaseUrl}/s/preview-demo`}
          size={size}
          className=""
          highResolution={size <= 64}
          alt="QR Code Preview"
          backgroundColor="#ffffff"
          foregroundColor="#000000"
        />
        {/* Perfectly centered watermark for preview */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            className="bg-white/90 text-gray-700 font-bold tracking-wider select-none px-1 py-0.5 rounded shadow-sm border border-gray-200"
            style={{
              fontSize: size > 64 ? '10px' : size > 32 ? '8px' : '6px',
              transform: 'rotate(-45deg)',
            }}
          >
            PREVIEW
          </div>
        </div>
      </div>
    );
  }

  // Show real QR code for production stickers
  return (
    <div className={`relative ${className}`}>
      <QrCanvas
        key={qrKey}
        url={qrUrl}
        size={size}
        className=""
        highResolution={highQuality || size <= 64} // Always high-res for small stickers
        alt={`Código QR SafeTap - ${identifier}`}
        backgroundColor="#ffffff"
        foregroundColor="#000000"
      />
    </div>
  );
}
