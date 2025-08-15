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
  <div className="w-16 h-16 bg-gray-200 border border-gray-300 flex items-center justify-center rounded">
    <div className="text-gray-500 text-xs text-center">
      <div className="w-3 h-3 bg-gray-400 mx-auto mb-1"></div>
      <span className="text-xs">QR</span>
    </div>
  </div>
);

// Component for real QR (in real sticker)
const RealQR = ({ slug }: { slug: string }) => {
  // En un caso real, aquí generarías el QR con la URL real
  const qrData = `https://www.safetap.cl/s/${slug}`;
  
  return (
    <div className="w-16 h-16 bg-black flex items-center justify-center rounded">
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
        className="w-48 h-48 rounded-xl shadow-md border border-gray-200 p-3 flex flex-col justify-between"
        style={{ backgroundColor: stickerColor }}
      >
        {/* Header */}
        <div className="text-center">
          <h1 
            className="text-lg font-bold mb-1"
            style={{ color: textColor }}
          >
            SafeTap
          </h1>
        </div>

        {/* Personal info */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-2xl">{flag}</span>
          <div className="text-center">
            <p 
              className="text-sm font-semibold leading-tight"
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
            <div className="mb-1">
              <svg 
                className="w-8 h-8 mx-auto" 
                fill={textColor} 
                viewBox="0 0 24 24"
              >
                <path d="M20,2H4A2,2 0 0,0 2,4V20A2,2 0 0,0 4,22H20A2,2 0 0,0 22,20V4A2,2 0 0,0 20,2M20,20H4V4H20V20Z" />
                <path d="M18,6H16V9H13V11H11V13H9V16H7V18H9V16H11V14H13V12H15V9H18V6Z" />
              </svg>
            </div>
            <p 
              className="text-xs font-medium leading-tight"
              style={{ color: textColor }}
            >
              INFORMACIÓN
            </p>
            <p 
              className="text-xs font-medium leading-tight"
              style={{ color: textColor }}
            >
              DE EMERGENCIA
            </p>
          </div>
        </div>
      </div>
      
      {/* Preview badge - más pequeño y discreto */}
      {!showRealQR && (
        <div className="absolute -top-1 -right-1 bg-amber-400 text-amber-900 text-xs px-1.5 py-0.5 rounded-md font-medium shadow-sm">
          Preview
        </div>
      )}
    </div>
  );
}
