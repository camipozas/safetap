'use client';

import { useState } from 'react';

interface StickerPreviewProps {
  name: string;
  flagCode: string;
  stickerColor?: string;
  textColor?: string;
  showRealQR?: boolean; // To distinct between preview and real sticker
  className?: string;
}

// Component for placeholder QR (only in preview)
const PlaceholderQR = () => (
  <div className="w-24 h-24 bg-gray-200 border-2 border-gray-300 flex items-center justify-center rounded">
    <div className="text-gray-500 text-xs text-center">
      <div className="w-4 h-4 bg-gray-400 mx-auto mb-1"></div>
      <span>QR</span>
    </div>
  </div>
);

// Component for real QR (in real sticker)
const RealQR = ({ slug }: { slug: string }) => {
  // En un caso real, aquí generarías el QR con la URL real
  const qrData = `https://www.safetap.cl/s/${slug}`;
  
  return (
    <div className="w-24 h-24 bg-black flex items-center justify-center rounded">
      {/* Here will be the real QR code */}
      <div className="text-white text-xs">QR Real</div>
    </div>
  );
};

// Available flags
const FLAGS = {
  'CL': '🇨🇱',
  'ES': '🇪🇸', 
  'US': '🇺🇸',
  'AR': '🇦🇷',
  'MX': '🇲🇽',
  'PE': '🇵🇪',
  'CO': '🇨🇴',
  'VE': '🇻🇪',
  'EC': '🇪🇨',
  'UY': '🇺🇾',
  'BR': '🇧🇷',
  'FR': '🇫🇷',
  'DE': '🇩🇪',
  'IT': '🇮🇹',
  'GB': '🇬🇧',
};

export default function StickerPreview({ 
  name, 
  flagCode, 
  stickerColor = '#f1f5f9', 
  textColor = '#000000',
  showRealQR = false,
  className = ''
}: StickerPreviewProps) {
  const flag = FLAGS[flagCode as keyof typeof FLAGS] || '🏳️';
  
  return (
    <div className={`relative ${className}`}>
      {/* Sticker container */}
      <div 
        className="w-64 h-64 rounded-2xl shadow-lg border-2 border-gray-300 p-4 flex flex-col justify-between"
        style={{ backgroundColor: stickerColor }}
      >
        {/* Header */}
        <div className="text-center">
          <h1 
            className="text-2xl font-bold mb-2"
            style={{ color: textColor }}
          >
            SafeTap
          </h1>
        </div>

        {/* Personal info */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-3xl">{flag}</span>
          <div className="text-center">
            <p 
              className="text-lg font-semibold"
              style={{ color: textColor }}
            >
              {name || 'Tu Nombre'}
            </p>
          </div>
        </div>

        {/* QR Code and NFC */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {showRealQR ? (
              <RealQR slug={`${name.toLowerCase().replace(/\s+/g, '-')}-${flagCode.toLowerCase()}`} />
            ) : (
              <PlaceholderQR />
            )}
          </div>
          
          <div className="flex-1 text-center">
            {/* NFC Icon */}
            <div className="mb-2">
              <svg 
                className="w-12 h-12 mx-auto" 
                fill={textColor} 
                viewBox="0 0 24 24"
              >
                <path d="M20,2H4A2,2 0 0,0 2,4V20A2,2 0 0,0 4,22H20A2,2 0 0,0 22,20V4A2,2 0 0,0 20,2M20,20H4V4H20V20Z" />
                <path d="M18,6H16V9H13V11H11V13H9V16H7V18H9V16H11V14H13V12H15V9H18V6Z" />
              </svg>
            </div>
            <p 
              className="text-xs font-medium"
              style={{ color: textColor }}
            >
              INFORMACIÓN
            </p>
            <p 
              className="text-xs font-medium"
              style={{ color: textColor }}
            >
              DE EMERGENCIA
            </p>
          </div>
        </div>
      </div>
      
      {/* Preview badge */}
      {!showRealQR && (
        <div className="absolute top-2 right-2 bg-yellow-500 text-yellow-900 text-xs px-2 py-1 rounded-full font-medium">
          Vista Previa
        </div>
      )}
    </div>
  );
}
