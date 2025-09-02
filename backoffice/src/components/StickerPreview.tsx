'use client';

import Image from 'next/image';
import { memo } from 'react';

import { StickerQrCode } from '@/components/StickerQrCode';
import { getCountryFlag } from '@/lib/countries';

interface StickerPreviewProps {
  name: string;
  flagCode: string;
  stickerColor?: string;
  textColor?: string;
  showRealQR?: boolean; // To distinct between preview and real sticker
  stickerId?: string; // For real stickers
  serial?: string; // For real stickers
  slug?: string; // For using slug instead of stickerId
  className?: string;
}

const StickerPreviewComponent = ({
  name,
  flagCode,
  stickerColor = '#f1f5f9',
  textColor = '#000000',
  showRealQR = true, // Default to true in backoffice (no preview badge)
  stickerId,
  serial,
  slug,
  className = '',
}: StickerPreviewProps) => {
  const flag = getCountryFlag(flagCode);

  // Use slug if provided, otherwise use stickerId or serial
  const identifier = slug || serial || stickerId || 'demo-sticker';

  return (
    <div className={`relative ${className}`} data-testid="sticker-preview">
      {/* Sticker container */}
      <div
        className="w-40 h-40 sm:w-48 sm:h-48 rounded-xl shadow-md border border-gray-200 p-2 sm:p-3 flex flex-col justify-between"
        style={{ backgroundColor: stickerColor }}
        data-testid="sticker-container"
      >
        {/* Header */}
        <div className="text-center">
          <h1
            className="text-sm sm:text-lg font-bold mb-1"
            style={{ color: textColor }}
          >
            SafeTap
          </h1>
        </div>

        {/* Personal info */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 mb-2 sm:mb-3">
          <span className="text-xl sm:text-2xl">{flag}</span>
          <div className="text-center">
            <p
              className="text-sm sm:text-base font-semibold leading-tight"
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
              stickerId={identifier}
              serial={serial}
              size={64}
              isPreview={!showRealQR}
              highQuality={true} // Forzar alta calidad en backoffice
              className="mx-auto"
            />
          </div>

          <div className="flex-1 text-center">
            {/* NFC Icon as image for better capture */}
            <div className="mb-1">
              <Image
                className="w-6 h-6 sm:w-8 sm:h-8 mx-auto"
                src={`data:image/svg+xml;base64,${btoa(`
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fill="${textColor}" d="M20,2H4A2,2 0 0,0 2,4V20A2,2 0 0,0 4,22H20A2,2 0 0,0 22,20V4A2,2 0 0,0 20,2M20,20H4V4H20V20Z" />
                    <path fill="${textColor}" d="M18,6H16V9H13V11H11V13H9V16H7V18H9V16H11V14H13V12H15V9H18V6Z" />
                  </svg>
                `)}`}
                alt="NFC Icon"
                width={32}
                height={32}
              />
            </div>
            <p
              className="text-xs font-normal leading-none"
              style={{ color: textColor, fontSize: '0.75rem' }}
            >
              INFORMACIÓN
            </p>
            <p
              className="text-xs font-normal leading-none"
              style={{ color: textColor, fontSize: '0.75rem' }}
            >
              DE EMERGENCIA
            </p>
          </div>
        </div>
      </div>

      {/* NO Preview badge in backoffice - always show real sticker */}
    </div>
  );
};

const StickerPreview = memo(StickerPreviewComponent);
export default StickerPreview;
