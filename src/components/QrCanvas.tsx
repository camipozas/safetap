'use client';
import Image from 'next/image';
import QRCode from 'qrcode';
import { memo, useEffect, useRef, useState } from 'react';

// QR Code generation constants
const QR_IMAGE_QUALITY = 0.92;

interface QrCanvasProps {
  url: string;
  alt?: string;
  size?: number;
  className?: string;
  highResolution?: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
}

const QrCanvasComponent = function QrCanvas({
  url,
  alt = 'Código QR',
  size = 200,
  className = '',
  highResolution = false,
  backgroundColor = '#ffffff',
  foregroundColor = '#000000',
}: QrCanvasProps) {
  const [dataUrl, setDataUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!url || url.trim() === '') {
      setError('URL requerida');
      setIsLoading(false);
      return;
    }

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    let active = true;
    setIsLoading(true);
    setError(null);

    // Calculate final QR size with optimization for mobile
    const qrSize = highResolution ? size * 2 : size;

    // Configure QR options with error handling and performance optimization
    const qrOptions = {
      width: qrSize,
      height: qrSize,
      margin: 1,
      color: {
        dark: foregroundColor || '#000000',
        light: backgroundColor || '#ffffff',
      },
      errorCorrectionLevel: 'M' as const,
      type: 'image/png' as const,
      quality: size <= 64 ? 0.8 : QR_IMAGE_QUALITY, // Lower quality for small QRs
      rendererOpts: {
        quality: size <= 64 ? 0.8 : QR_IMAGE_QUALITY,
      },
    };

    QRCode.toDataURL(url, qrOptions)
      .then((generatedDataUrl) => {
        if (active) {
          setDataUrl(generatedDataUrl);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(`Error: ${err.message || 'Code generation failed'}`);
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [url, size, highResolution, backgroundColor, foregroundColor]);

  const displaySize = `${size}px`;

  if (isLoading) {
    return (
      <div
        className={`bg-slate-200 rounded flex items-center justify-center ${className}`}
        style={{ width: displaySize, height: displaySize }}
      >
        <div className="animate-pulse text-slate-600 text-sm text-center">
          <div className="mb-1">🔄</div>
          <div>Generando QR...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-red-100 border border-red-300 rounded flex items-center justify-center ${className}`}
        style={{ width: displaySize, height: displaySize }}
      >
        <div className="text-red-600 text-xs text-center px-2">
          <div className="mb-1">❌</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        className={`bg-yellow-100 border border-yellow-300 rounded flex items-center justify-center ${className}`}
        style={{ width: displaySize, height: displaySize }}
      >
        <div className="text-yellow-700 text-xs text-center px-2">
          <div className="mb-1">⚠️</div>
          <div>Sin datos QR</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: displaySize,
        height: displaySize,
      }}
      className={className}
    >
      <Image
        src={dataUrl}
        alt={alt}
        className="rounded border"
        width={size}
        height={size}
        style={{ width: displaySize, height: displaySize }}
        loading="lazy"
        unoptimized
        priority={size > 100} // Priority for larger QRs only
      />
    </div>
  );
};

export const QrCanvas = memo(QrCanvasComponent);
