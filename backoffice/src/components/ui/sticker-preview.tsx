'use client';

import { memo } from 'react';
import { StickerQrCode } from './sticker-qr-code';

interface StickerPreviewProps {
  sticker: {
    id: string;
    slug: string;
    serial: string;
    nameOnSticker: string;
    flagCode: string;
    stickerColor: string;
    textColor: string;
    profile?: {
      bloodType: string | null;
      contacts: {
        name: string;
        phone: string;
        relation: string;
      }[];
    } | null;
  };
  size?: number;
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
} as const;

const StickerPreviewComponent = ({
  sticker,
  className = '',
}: StickerPreviewProps) => {
  const flag = FLAGS[sticker.flagCode as keyof typeof FLAGS] || '🏳️';

  return (
    <div className={`relative ${className}`} data-testid="sticker-preview">
      {/* Sticker container - usando las mismas clases que SafeTap */}
      <div
        className="w-40 h-40 sm:w-48 sm:h-48 rounded-xl shadow-md border border-gray-200 p-2 sm:p-3 flex flex-col justify-between"
        style={{ backgroundColor: sticker.stickerColor }}
      >
        {/* Header */}
        <div className="text-center">
          <h1
            className="text-sm sm:text-lg font-bold mb-1"
            style={{ color: sticker.textColor }}
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
              style={{ color: sticker.textColor }}
            >
              {sticker.nameOnSticker || 'Sin nombre'}
            </p>
          </div>
        </div>

        {/* QR Code and NFC */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <StickerQrCode
              slug={sticker.slug}
              size={64}
              isPreview={false}
              className="mx-auto"
            />
          </div>

          <div className="flex-1 text-center">
            {/* NFC Icon */}
            <div className="mb-1">
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 mx-auto"
                fill={sticker.textColor}
                viewBox="0 0 24 24"
              >
                <path d="M20,2H4A2,2 0 0,0 2,4V20A2,2 0 0,0 4,22H20A2,2 0 0,0 22,20V4A2,2 0 0,0 20,2M20,20H4V4H20V20Z" />
                <path d="M18,6H16V9H13V11H11V13H9V16H7V18H9V16H11V14H13V12H15V9H18V6Z" />
              </svg>
            </div>
            <p
              className="text-xs font-normal leading-none"
              style={{ color: sticker.textColor, fontSize: '0.75rem' }}
            >
              INFORMACIÓN
            </p>
            <p
              className="text-xs font-normal leading-none"
              style={{ color: sticker.textColor, fontSize: '0.75rem' }}
            >
              DE EMERGENCIA
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StickerPreview = memo(StickerPreviewComponent);
export default StickerPreview;
