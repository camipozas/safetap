'use client';

import QRCode from 'qrcode';
import { useEffect, useRef } from 'react';

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
}

export default function StickerPreview({
  sticker,
  size = 200,
}: StickerPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generateSticker = async () => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = size;
      const height = Math.round(size * 1.5); // Proportion 2:3
      canvas.width = width;
      canvas.height = height;

      // Background of the sticker
      ctx.fillStyle = sticker.stickerColor;
      ctx.fillRect(0, 0, width, height);

      // Border
      ctx.strokeStyle = sticker.textColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(5, 5, width - 10, height - 10);

      // Configure text
      ctx.fillStyle = sticker.textColor;
      ctx.textAlign = 'center';

      // Name on sticker
      ctx.font = `bold ${Math.round(width * 0.08)}px Arial`;
      ctx.fillText(sticker.nameOnSticker, width / 2, 30);

      // Flag
      ctx.font = `${Math.round(width * 0.15)}px Arial`;
      ctx.fillText(sticker.flagCode, width / 2, 70);

      // QR Code
      const qrUrl = `${window.location.origin.replace(':3002', '')}/s/${sticker.slug}`;
      try {
        const qrDataUrl = await QRCode.toDataURL(qrUrl, {
          width: Math.round(width * 0.6),
          margin: 1,
          color: {
            dark: sticker.textColor,
            light: sticker.stickerColor,
          },
        });

        const qrImage = new Image();
        qrImage.onload = () => {
          const qrSize = Math.round(width * 0.6);
          const qrX = (width - qrSize) / 2;
          const qrY = 90;
          ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

          // "EMERGENCY PROFILE" text
          ctx.font = `bold ${Math.round(width * 0.06)}px Arial`;
          ctx.fillText('EMERGENCY PROFILE', width / 2, qrY + qrSize + 25);

          // Blood Type if exists
          if (sticker.profile?.bloodType) {
            ctx.font = `bold ${Math.round(width * 0.08)}px Arial`;
            ctx.fillStyle = '#dc2626'; // text-red-600
            ctx.fillText(
              `🩸 ${sticker.profile.bloodType}`,
              width / 2,
              qrY + qrSize + 50
            );
            ctx.fillStyle = sticker.textColor;
          }

          // Emergency contact if exists
          if (sticker.profile?.contacts?.[0]) {
            const contact = sticker.profile.contacts[0];
            ctx.font = `${Math.round(width * 0.04)}px Arial`;
            ctx.fillText(`📞 ${contact.name}`, width / 2, qrY + qrSize + 75);
            ctx.fillText(contact.phone, width / 2, qrY + qrSize + 90);
          }

          // Serial
          ctx.font = `${Math.round(width * 0.03)}px Arial`;
          ctx.fillText(`Serial: ${sticker.serial}`, width / 2, height - 15);
        };
        qrImage.src = qrDataUrl;
      } catch (error) {
        // Fallback: draw a placeholder
        const qrSize = Math.round(width * 0.6);
        const qrX = (width - qrSize) / 2;
        const qrY = 90;
        ctx.fillStyle = sticker.textColor;
        ctx.fillRect(qrX, qrY, qrSize, qrSize);
        ctx.fillStyle = sticker.stickerColor;
        ctx.font = `${Math.round(width * 0.04)}px Arial`;
        ctx.fillText('QR CODE', width / 2, qrY + qrSize / 2);
        ctx.fillStyle = sticker.textColor;
      }
    };

    generateSticker();
  }, [sticker, size]);

  return (
    <canvas
      ref={canvasRef}
      className="border rounded shadow-sm"
      style={{
        maxWidth: '100%',
        height: 'auto',
      }}
    />
  );
}
