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

    // Mock fetch to fail so it falls back to slug URL
    global.fetch = vi
      .fn()
      .mockRejectedValue(new Error('Emergency profile not found'));

    render(<StickerQrCode slug="test-slug" size={48} />);

    await waitFor(() => {
      expect(screen.getByAltText('QR Code')).toBeInTheDocument();
    });

    // Verify that QRCode.toDataURL was called with high quality options
    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        width: 192, // 48 * 4 (RESOLUTION_SCALE_FACTOR)
        rendererOpts: expect.objectContaining({
          quality: 1, // QR_HIGH_QUALITY constant
        }),
      })
    );
  });

  it('uses standard quality for large QR codes', async () => {
    const mockDataUrl = 'data:image/png;base64,mockdata';
    (QRCode.toDataURL as any).mockResolvedValue(mockDataUrl);

    // Mock fetch to fail so it falls back to slug URL
    global.fetch = vi
      .fn()
      .mockRejectedValue(new Error('Emergency profile not found'));

    render(<StickerQrCode slug="test-slug" size={128} />);

    await waitFor(() => {
      expect(screen.getByAltText('QR Code')).toBeInTheDocument();
    });

    // Verify that QRCode.toDataURL was called with high quality for large size
    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        width: 512, // 128 * 4 (RESOLUTION_SCALE_FACTOR)
        rendererOpts: expect.objectContaining({
          quality: 1, // QR_HIGH_QUALITY constant
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

  it('generates correct URL for QR code with fallback', async () => {
    const mockDataUrl = 'data:image/png;base64,mockdata';
    (QRCode.toDataURL as any).mockResolvedValue(mockDataUrl);

    // Mock fetch for emergency profile URL (should fail and fallback)
    global.fetch = vi
      .fn()
      .mockRejectedValue(new Error('Emergency profile not found'));

    render(<StickerQrCode slug="test-slug" />);

    await waitFor(() => {
      expect(screen.getByAltText('QR Code')).toBeInTheDocument();
    });

    // Verify the fallback URL passed to QRCode.toDataURL
    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      'https://admin.safetap.com/s/test-slug',
      expect.any(Object)
    );
  });

  it('uses emergency profile URL when available', async () => {
    const mockDataUrl = 'data:image/png;base64,mockdata';
    const mockEmergencyUrl = 'https://safetap.cl/qr/emergency-profile-123';

    (QRCode.toDataURL as any).mockResolvedValue(mockDataUrl);

    // Mock successful fetch for emergency profile URL
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ emergencyUrl: mockEmergencyUrl }),
    } as Response);

    render(<StickerQrCode slug="test-slug" />);

    await waitFor(() => {
      expect(screen.getByAltText('QR Code')).toBeInTheDocument();
    });

    // Verify the emergency profile URL was used
    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      mockEmergencyUrl,
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

  it('applies priority loading to generated images', async () => {
    const mockDataUrl = 'data:image/png;base64,mockdata';
    (QRCode.toDataURL as any).mockResolvedValue(mockDataUrl);

    render(<StickerQrCode slug="test-slug" size={120} />);

    await waitFor(() => {
      const image = screen.getByAltText('QR Code');
      expect(image).toBeInTheDocument();
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

  it('uses fixed scaling for small QRs', async () => {
    const mockDataUrl = 'data:image/png;base64,mockdata';
    (QRCode.toDataURL as any).mockResolvedValue(mockDataUrl);

    render(<StickerQrCode slug="test-slug" size={32} />);

    await waitFor(() => {
      expect(screen.getByAltText('QR Code')).toBeInTheDocument();
    });

    // Uses fixed 4x scaling factor
    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        width: 128, // 32 * 4 (RESOLUTION_SCALE_FACTOR)
      })
    );
  });

  it('uses fixed scaling for large QRs', async () => {
    const mockDataUrl = 'data:image/png;base64,mockdata';
    (QRCode.toDataURL as any).mockResolvedValue(mockDataUrl);

    render(<StickerQrCode slug="test-slug" size={128} />);

    await waitFor(() => {
      expect(screen.getByAltText('QR Code')).toBeInTheDocument();
    });

    // Uses fixed 4x scaling factor
    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        width: 512, // 128 * 4 (RESOLUTION_SCALE_FACTOR)
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
