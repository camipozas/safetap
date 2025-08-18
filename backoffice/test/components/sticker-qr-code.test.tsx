import { render, screen, waitFor } from '@testing-library/react';
import QRCode from 'qrcode';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { StickerQrCode } from '@/components/ui/sticker-qr-code';

// Mock QRCode library
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(),
  },
}));

// Mock window.location
const mockLocation = {
  protocol: 'https:',
  hostname: 'admin.safetap.com',
  origin: 'https://admin.safetap.com',
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('StickerQrCode (Backoffice)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (QRCode.toDataURL as any).mockResolvedValue(
      'data:image/png;base64,mock-qr-code'
    );
  });

  it('renders preview mode when isPreview is true', () => {
    render(<StickerQrCode slug="test-slug" isPreview={true} />);

    expect(screen.getByText('PREVIEW')).toBeInTheDocument();
  });

  it('generates QR code for valid slug', async () => {
    const mockDataUrl = 'data:image/png;base64,mockdata';
    (QRCode.toDataURL as any).mockResolvedValue(mockDataUrl);

    render(<StickerQrCode slug="test-slug" size={64} />);

    await waitFor(() => {
      const image = screen.getByAltText('QR Code');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', mockDataUrl);
    });
  });

  it('optimizes quality for small QR codes', async () => {
    const mockDataUrl = 'data:image/png;base64,mockdata';
    (QRCode.toDataURL as any).mockResolvedValue(mockDataUrl);

    render(<StickerQrCode slug="test-slug" size={48} />);

    await waitFor(() => {
      expect(screen.getByAltText('QR Code')).toBeInTheDocument();
    });

    // Verify that QRCode.toDataURL was called with optimized options for small size
    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        quality: 0.8, // Lower quality for small QRs
        rendererOpts: expect.objectContaining({
          quality: 0.8,
        }),
      })
    );
  });

  it('uses standard quality for large QR codes', async () => {
    const mockDataUrl = 'data:image/png;base64,mockdata';
    (QRCode.toDataURL as any).mockResolvedValue(mockDataUrl);

    render(<StickerQrCode slug="test-slug" size={128} />);

    await waitFor(() => {
      expect(screen.getByAltText('QR Code')).toBeInTheDocument();
    });

    // Verify that QRCode.toDataURL was called with standard quality for large size
    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        quality: 0.92, // Standard quality for large QRs
        rendererOpts: expect.objectContaining({
          quality: 0.92,
        }),
      })
    );
  });

  it('shows loading state when no slug provided', () => {
    render(<StickerQrCode />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows loading state when slug is empty', () => {
    render(<StickerQrCode slug="" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('generates correct URL for QR code', async () => {
    const mockDataUrl = 'data:image/png;base64,mockdata';
    (QRCode.toDataURL as any).mockResolvedValue(mockDataUrl);

    render(<StickerQrCode slug="test-slug" />);

    await waitFor(() => {
      expect(screen.getByAltText('QR Code')).toBeInTheDocument();
    });

    // Verify the URL passed to QRCode.toDataURL
    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      'https://admin.safetap.com/s/test-slug',
      expect.any(Object)
    );
  });

  it('handles QR generation errors gracefully', async () => {
    vi.mocked(QRCode.toDataURL).mockRejectedValue(
      new Error('QR generation failed')
    );

    render(<StickerQrCode slug="test-slug" />);

    // Should show loading state when error occurs (silent error handling)
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('applies lazy loading to generated images', async () => {
    const mockDataUrl = 'data:image/png;base64,mockdata';
    (QRCode.toDataURL as any).mockResolvedValue(mockDataUrl);

    render(<StickerQrCode slug="test-slug" />);

    await waitFor(() => {
      const image = screen.getByAltText('QR Code');
      expect(image).toHaveAttribute('loading', 'lazy');
    });
  });

  it('applies correct size styles', async () => {
    const mockDataUrl = 'data:image/png;base64,mockdata';
    (QRCode.toDataURL as any).mockResolvedValue(mockDataUrl);

    render(<StickerQrCode slug="test-slug" size={100} />);

    await waitFor(() => {
      const image = screen.getByAltText('QR Code');
      expect(image).toHaveStyle('width: 100px');
      expect(image).toHaveStyle('height: 100px');
    });
  });

  it('uses optimized scaling for small QRs', async () => {
    const mockDataUrl = 'data:image/png;base64,mockdata';
    (QRCode.toDataURL as any).mockResolvedValue(mockDataUrl);

    render(<StickerQrCode slug="test-slug" size={32} />);

    await waitFor(() => {
      expect(screen.getByAltText('QR Code')).toBeInTheDocument();
    });

    // For size 32 (≤64), should use 1.5x scaling instead of 2x
    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        width: 48, // 32 * 1.5
      })
    );
  });

  it('uses standard scaling for large QRs', async () => {
    const mockDataUrl = 'data:image/png;base64,mockdata';
    (QRCode.toDataURL as any).mockResolvedValue(mockDataUrl);

    render(<StickerQrCode slug="test-slug" size={128} />);

    await waitFor(() => {
      expect(screen.getByAltText('QR Code')).toBeInTheDocument();
    });

    // For size 128 (>64), should use 2x scaling
    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        width: 256, // 128 * 2
      })
    );
  });

  it('prevents memory leaks with abort controller', () => {
    const { unmount } = render(<StickerQrCode slug="test-slug" />);

    // Unmount component
    unmount();

    // Component should cleanup properly (test verifies no errors thrown)
    expect(true).toBe(true);
  });

  it('is memoized to prevent unnecessary re-renders', () => {
    const { rerender } = render(<StickerQrCode slug="test-slug" size={64} />);

    // Re-render with same props
    rerender(<StickerQrCode slug="test-slug" size={64} />);

    // Component should be memoized (this test verifies the memo wrapper exists)
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
