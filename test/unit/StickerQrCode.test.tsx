import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { StickerQrCode } from '@/components/StickerQrCode';

// Mock QrCanvas component
vi.mock('@/components/QrCanvas', () => ({
  QrCanvas: ({
    url,
    size,
    className,
    alt,
  }: {
    url: string;
    size: number;
    className: string;
    alt: string;
  }) => (
    <div
      data-testid="qr-canvas"
      data-url={url}
      data-size={size}
      className={className}
      data-alt={alt}
    >
      QR Canvas Mock
    </div>
  ),
}));

describe('StickerQrCode', () => {
  it('renders preview mode placeholder by default', () => {
    render(<StickerQrCode />);

    // By default, isPreview is false, so it should render QR canvas, not the preview placeholder
    expect(screen.getByTestId('qr-canvas')).toBeInTheDocument();
  });

  it('renders preview mode when isPreview is true', () => {
    render(<StickerQrCode isPreview={true} />);

    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.queryByTestId('qr-canvas')).not.toBeInTheDocument();
  });

  it('renders real QR code when isPreview is false', () => {
    render(<StickerQrCode isPreview={false} stickerId="test-123" />);

    expect(screen.queryByText('Preview')).not.toBeInTheDocument();
    expect(screen.getByTestId('qr-canvas')).toBeInTheDocument();
  });

  it('uses serial for URL when provided', () => {
    render(<StickerQrCode isPreview={false} serial="ABC123" />);

    const qrCanvas = screen.getByTestId('qr-canvas');
    expect(qrCanvas).toHaveAttribute('data-url', 'https://safetap.cl/s/ABC123');
  });

  it('falls back to stickerId when serial not provided', () => {
    render(<StickerQrCode isPreview={false} stickerId="test-456" />);

    const qrCanvas = screen.getByTestId('qr-canvas');
    expect(qrCanvas).toHaveAttribute(
      'data-url',
      'https://safetap.cl/s/test-456'
    );
  });

  it('uses demo sticker when no identifier provided', () => {
    render(<StickerQrCode isPreview={false} />);

    const qrCanvas = screen.getByTestId('qr-canvas');
    expect(qrCanvas).toHaveAttribute(
      'data-url',
      'https://safetap.cl/s/demo-sticker'
    );
  });

  it('uses custom base URL when provided', () => {
    render(
      <StickerQrCode
        isPreview={false}
        serial="ABC123"
        baseUrl="https://custom.com"
      />
    );

    const qrCanvas = screen.getByTestId('qr-canvas');
    expect(qrCanvas).toHaveAttribute('data-url', 'https://custom.com/s/ABC123');
  });

  it('applies custom size', () => {
    render(<StickerQrCode isPreview={false} size={128} />);

    const qrCanvas = screen.getByTestId('qr-canvas');
    expect(qrCanvas).toHaveAttribute('data-size', '128');
  });

  it('renders high quality QR codes without HD indicator', () => {
    render(<StickerQrCode isPreview={false} highQuality={true} />);

    // HD indicator should no longer be shown
    expect(screen.queryByText('HD')).not.toBeInTheDocument();

    // But QR Canvas should still be rendered
    expect(screen.getByTestId('qr-canvas')).toBeInTheDocument();
  });

  it('renders small QR codes without HD indicator', () => {
    render(<StickerQrCode isPreview={false} size={64} />);

    // HD indicator should no longer be shown for small QR codes
    expect(screen.queryByText('HD')).not.toBeInTheDocument();

    // But QR Canvas should still be rendered
    expect(screen.getByTestId('qr-canvas')).toBeInTheDocument();
  });

  it('does not show HD indicator for any QR codes', () => {
    render(<StickerQrCode isPreview={false} size={200} highQuality={false} />);

    // HD indicator should never be shown anymore
    expect(screen.queryByText('HD')).not.toBeInTheDocument();
  });

  it('applies custom className to preview', () => {
    render(<StickerQrCode isPreview={true} className="custom-class" />);

    const container = screen.getByText('Preview').closest('div')?.parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('applies custom className to real QR', () => {
    render(<StickerQrCode isPreview={false} className="custom-class" />);

    const container = screen.getByTestId('qr-canvas').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('renders with correct alt text', () => {
    render(<StickerQrCode isPreview={false} serial="ABC123" />);

    const qrCanvas = screen.getByTestId('qr-canvas');
    expect(qrCanvas).toHaveAttribute('data-alt', 'Código QR SafeTap - ABC123');
  });

  it('renders preview with correct dimensions', () => {
    render(<StickerQrCode isPreview={true} size={100} />);

    const preview = screen.getByText('Preview').closest('div')?.parentElement;
    expect(preview).toHaveStyle({ width: '100px', height: '100px' });
  });
});
