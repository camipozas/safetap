'use client';

import { StickerQrCode } from './sticker-qr-code';

interface StickerPreviewProps {
  sticker: {
    id: string;
    slug: string;
    serial: string;
    nameOnSticker: string;
    flagCode: string;
    colorPresetId?: string;
    stickerColor: string;
    textColor: string;
    owner?: {
      name: string | null;
      country: string | null;
    };
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
  showRealQR?: boolean; // Whether to show real QR or preview placeholder
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

export default function StickerPreview({
  sticker,
  size = 200,
}: StickerPreviewProps) {
  // Always prioritize owner data from database for consistency
  const country = sticker.owner?.country || sticker.flagCode || 'CL';
  const flag = FLAGS[country as keyof typeof FLAGS] || '🏳️';

  // Always prioritize owner.name from database for consistency with table
  const displayName = sticker.owner?.name || sticker.nameOnSticker || 'Usuario';

  // Calculate dimensions based on size
  const width = size;
  const height = size;

  return (
    <div className="relative">
      {/* Sticker container */}
      <div
        className="rounded-xl shadow-md border border-gray-200 p-3 flex flex-col justify-between"
        style={{
          backgroundColor: sticker.stickerColor,
          width: `${width}px`,
          height: `${height}px`,
        }}
      >
        {/* Header */}
        <div className="text-center">
          <h1
            className="font-bold mb-1"
            style={{
              color: sticker.textColor,
              fontSize: `${Math.max(size * 0.08, 10)}px`,
            }}
          >
            SafeTap
          </h1>
        </div>

        {/* Personal info */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span style={{ fontSize: `${Math.max(size * 0.12, 16)}px` }}>
            {flag}
          </span>
          <div className="text-center">
            <p
              className="font-semibold leading-tight"
              style={{
                color: sticker.textColor,
                fontSize: `${Math.max(size * 0.09, 14)}px`,
              }}
            >
              {displayName}
            </p>
          </div>
        </div>

        {/* QR Code and NFC */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <StickerQrCode
              slug={sticker.slug}
              size={Math.max(size * 0.32, 32)}
              isPreview={false}
              className="mx-auto"
            />
          </div>

          <div className="flex-1 text-center">
            {/* NFC Icon */}
            <div className="mb-1">
              <svg
                className="mx-auto"
                style={{
                  width: `${Math.max(size * 0.16, 16)}px`,
                  height: `${Math.max(size * 0.16, 16)}px`,
                }}
                fill={sticker.textColor}
                viewBox="0 0 24 24"
              >
                <path d="M20,2H4A2,2 0 0,0 2,4V20A2,2 0 0,0 4,22H20A2,2 0 0,0 22,20V4A2,2 0 0,0 20,2M20,20H4V4H20V20Z" />
                <path d="M18,6H16V9H13V11H11V13H9V16H7V18H9V16H11V14H13V12H15V9H18V6Z" />
              </svg>
            </div>
            <p
              className="font-normal leading-tight"
              style={{
                color: sticker.textColor,
                fontSize: `${Math.max(size * 0.035, 7)}px`,
              }}
            >
              INFORMACIÓN
            </p>
            <p
              className="font-normal leading-tight"
              style={{
                color: sticker.textColor,
                fontSize: `${Math.max(size * 0.035, 7)}px`,
              }}
            >
              DE EMERGENCIA
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
