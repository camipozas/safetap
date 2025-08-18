'use client';

import { StickerQrCode } from '@/components/StickerQrCode';

interface StickerPreviewProps {
  name: string;
  flagCode: string;
  stickerColor?: string;
  textColor?: string;
  showRealQR?: boolean; // To distinct between preview and real sticker
  stickerId?: string; // For real stickers
  serial?: string; // For real stickers
  className?: string;
}

// Available flags
const FLAGS = {
  CL: '🇨🇱',
  ES: '🇪🇸',
  US: '🇺🇸',
  AR: '🇦🇷',
  MX: '🇲🇽',
  PE: '🇵🇪',
  CO: '🇨🇴',
  VE: '🇻🇪',
  EC: '🇪🇨',
  UY: '🇺🇾',
  BR: '🇧🇷',
  FR: '🇫🇷',
  DE: '🇩🇪',
  IT: '🇮🇹',
  GB: '🇬🇧',
};

export default function StickerPreview({
  name,
  flagCode,
  stickerColor = '#f1f5f9',
  textColor = '#000000',
  showRealQR = false,
  stickerId,
  serial,
  className = '',
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
          <h1 className="text-lg font-bold mb-1" style={{ color: textColor }}>
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
            <StickerQrCode
              stickerId={stickerId}
              serial={serial}
              size={64}
              isPreview={!showRealQR}
              className="mx-auto"
            />
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

      {/* Preview badge - more smallest */}
      {!showRealQR && (
        <div className="absolute -top-1 -right-1 bg-amber-400 text-amber-900 text-xs px-1.5 py-0.5 rounded-md font-medium shadow-sm">
          Preview
        </div>
      )}
    </div>
  );
}
