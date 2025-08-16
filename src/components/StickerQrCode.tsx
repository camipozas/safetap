"use client";
import { QrCanvas } from './QrCanvas';

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
  baseUrl
}: StickerQrCodeProps) {
  // Use the baseUrl prop, fallback to default if not provided
  const resolvedBaseUrl = baseUrl || 'https://safetap.cl';
  
  // Use serial for the public URL, fallback to stickerId for development
  const identifier = serial || stickerId || 'demo-sticker';
  const qrUrl = `${resolvedBaseUrl}/s/${identifier}`;

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

  // Show real QR code for production stickers
  return (
    <div className={`relative ${className}`}>
      <QrCanvas
        url={qrUrl}
        size={size}
        className=""
        highResolution={highQuality || size <= 64} // Always high-res for small stickers
        alt={`Código QR SafeTap - ${identifier}`}
        backgroundColor="#ffffff"
        foregroundColor="#000000"
      />
      
      {/* Quality indicator for high resolution QRs */}
      {(highQuality || size <= 64) && (
        <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full">
          HD
        </div>
      )}
    </div>
  );
}
