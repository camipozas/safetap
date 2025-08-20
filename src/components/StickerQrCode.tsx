'use client';
import { QrCanvas } from '@/components/QrCanvas';

interface StickerQrCodeProps {
  stickerId?: string;
  serial?: string;
  size?: number;
  isPreview?: boolean;
  className?: string;
  highQuality?: boolean; // Force high quality for production stickers
  baseUrl?: string; // Base URL for the QR code, should be passed from server
}

export function StickerQrCode({
  stickerId,
  serial,
  size = 64,
  isPreview = false,
  className = '',
  highQuality = false,
  baseUrl,
}: StickerQrCodeProps) {
  // Use the baseUrl prop, fallback to default if not provided
  const resolvedBaseUrl = baseUrl || 'https://safetap.cl';

  // Use serial for the public URL, fallback to stickerId for development
  const identifier = serial || stickerId || 'demo-sticker';
  const qrUrl = `${resolvedBaseUrl}/s/${identifier}`;

  // Create a unique key to force re-render when props change
  const qrKey = `${identifier}-${size}-${isPreview}-${highQuality}`;

  if (isPreview) {
    // Generate a real QR code for preview, but it won't work in this context
    // This will look exactly like a real QR but won't be functional
    return (
      <div className={`relative ${className}`}>
        <QrCanvas
          key={qrKey}
          url="https://safetap.cl/s/preview-demo"
          size={size}
          className=""
          highResolution={size <= 64}
          alt="QR Code Preview"
          backgroundColor="#ffffff"
          foregroundColor="#000000"
        />
        {/* Marca de agua para previews */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="bg-white/80 text-gray-600 text-xs font-medium px-1 py-0.5 rounded transform rotate-45"
            style={{ fontSize: size > 32 ? '6px' : '4px' }}
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
