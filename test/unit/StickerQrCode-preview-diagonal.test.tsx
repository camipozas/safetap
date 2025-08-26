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

describe('StickerQrCode - Preview Diagonal Fix', () => {
  it('renders preview with properly centered diagonal watermark', () => {
    render(<StickerQrCode isPreview={true} size={64} />);

    // Check that preview container exists
    const previewContainer = screen.getByTestId('qr-canvas').parentElement;
    expect(previewContainer).toHaveClass('relative');

    // Check that watermark container exists with proper positioning
    const watermarkContainer = previewContainer?.querySelector(
      '.absolute.inset-0.pointer-events-none'
    );
    expect(watermarkContainer).toBeInTheDocument();

    // Check that the watermark text has proper styling and positioning
    const watermarkText = watermarkContainer?.querySelector('div');
    expect(watermarkText).toHaveTextContent('PREVIEW');
    expect(watermarkText).toHaveClass('bg-white/90');
    expect(watermarkText).toHaveClass('text-gray-700');
    expect(watermarkText).toHaveClass('font-bold');
    expect(watermarkText).toHaveClass('tracking-wider');
    expect(watermarkText).toHaveClass('select-none');
    expect(watermarkText).toHaveClass('shadow-sm');
    expect(watermarkText).toHaveClass('border');
    expect(watermarkText).toHaveClass('border-gray-200');
  });

  it('adjusts watermark font size based on QR code size', () => {
    const { rerender } = render(<StickerQrCode isPreview={true} size={32} />);

    let watermarkText = document.querySelector('.bg-white\\/90');
    expect(watermarkText).toHaveStyle({ fontSize: '6px' });

    rerender(<StickerQrCode isPreview={true} size={64} />);

    watermarkText = document.querySelector('.bg-white\\/90');
    expect(watermarkText).toHaveStyle({ fontSize: '8px' });

    rerender(<StickerQrCode isPreview={true} size={128} />);

    watermarkText = document.querySelector('.bg-white\\/90');
    expect(watermarkText).toHaveStyle({ fontSize: '10px' });
  });

  it('uses proper transform for diagonal watermark', () => {
    render(<StickerQrCode isPreview={true} size={64} />);

    const watermarkText = document.querySelector('.bg-white\\/90');
    expect(watermarkText).toHaveStyle({
      transform: 'rotate(-45deg)',
    });
  });

  it('maintains proper contrast and visibility', () => {
    render(<StickerQrCode isPreview={true} size={64} />);

    const watermarkText = document.querySelector('.bg-white\\/90');
    expect(watermarkText).toHaveClass('bg-white/90'); // High opacity for better visibility
    expect(watermarkText).toHaveClass('text-gray-700'); // Good contrast
    expect(watermarkText).toHaveClass('shadow-sm'); // Subtle shadow for depth
    expect(watermarkText).toHaveClass('border'); // Border for definition
  });

  it('does not show watermark on real QR codes', () => {
    render(<StickerQrCode isPreview={false} stickerId="test-123" />);

    const watermarkContainer = document.querySelector(
      '.absolute.inset-0.pointer-events-none'
    );
    expect(watermarkContainer).not.toBeInTheDocument();
  });

  it('positions watermark as non-interactive overlay with perfect centering', () => {
    render(<StickerQrCode isPreview={true} size={64} />);

    const watermarkContainer = document.querySelector(
      '.absolute.inset-0.pointer-events-none'
    );
    expect(watermarkContainer).toHaveClass('pointer-events-none');
    expect(watermarkContainer).toHaveClass('absolute');
    expect(watermarkContainer).toHaveClass('inset-0');

    // Verify the watermark container has proper flexbox centering styles
    expect(watermarkContainer).toHaveStyle({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    });
  });

  it('applies correct rotation angle for diagonal watermark', () => {
    render(<StickerQrCode isPreview={true} size={64} />);

    const watermarkText = document.querySelector('.bg-white\\/90');
    expect(watermarkText).toHaveStyle({
      transform: 'rotate(-45deg)',
    });
  });

  it('has proper padding and rounded corners for watermark', () => {
    render(<StickerQrCode isPreview={true} size={64} />);

    const watermarkText = document.querySelector('.bg-white\\/90');
    expect(watermarkText).toHaveClass('px-1');
    expect(watermarkText).toHaveClass('py-0.5');
    expect(watermarkText).toHaveClass('rounded');
  });

  it('maintains consistent styling across different sizes', () => {
    const sizes = [32, 64, 128];

    sizes.forEach((size) => {
      const { unmount } = render(
        <StickerQrCode isPreview={true} size={size} />
      );

      const watermarkText = document.querySelector('.bg-white\\/90');
      expect(watermarkText).toHaveClass('bg-white/90');
      expect(watermarkText).toHaveClass('text-gray-700');
      expect(watermarkText).toHaveClass('font-bold');
      expect(watermarkText).toHaveClass('tracking-wider');
      expect(watermarkText).toHaveClass('select-none');
      expect(watermarkText).toHaveClass('shadow-sm');
      expect(watermarkText).toHaveClass('border');
      expect(watermarkText).toHaveClass('border-gray-200');

      unmount();
    });
  });
});
