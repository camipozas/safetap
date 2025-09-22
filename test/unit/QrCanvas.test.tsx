import { render, screen, waitFor } from '@testing-library/react';
import QRCode from 'qrcode';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QrCanvas } from '@/components/QrCanvas';

// Mock QRCode library
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mock-qr-code'),
  },
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} data-testid="qr-image" />
  ),
}));

describe('QrCanvas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (vi.mocked(QRCode.toDataURL) as ReturnType<typeof vi.fn>).mockResolvedValue(
      'data:image/png;base64,mock-qr-code'
    );
  });

  it('renders loading state initially', () => {
    (
      vi.mocked(QRCode.toDataURL) as ReturnType<typeof vi.fn>
    ).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<QrCanvas url="https://example.com" />);

    expect(screen.getByText('Generando QR...')).toBeInTheDocument();
  });

  it('generates QR code successfully', async () => {
    const mockDataUrl = 'data:image/png;base64,mockdata';
    (vi.mocked(QRCode.toDataURL) as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockDataUrl
    );

    render(<QrCanvas url="https://example.com" alt="Test QR" />);

    await waitFor(() => {
      expect(screen.getByTestId('qr-image')).toBeInTheDocument();
    });

    const image = screen.getByTestId('qr-image');
    expect(image).toHaveAttribute('src', mockDataUrl);
    expect(image).toHaveAttribute('alt', 'Test QR');
  });

  it('optimizes quality for small QR codes', async () => {
    const mockDataUrl = 'data:image/png;base64,mockdata';
    (vi.mocked(QRCode.toDataURL) as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockDataUrl
    );

    render(<QrCanvas url="https://example.com" size={48} />);

    await waitFor(() => {
      expect(screen.getByTestId('qr-image')).toBeInTheDocument();
    });

    // Verify that QRCode.toDataURL was called with optimized options for small size
    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      'https://example.com',
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
    (vi.mocked(QRCode.toDataURL) as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockDataUrl
    );

    render(<QrCanvas url="https://example.com" size={200} />);

    await waitFor(() => {
      expect(screen.getByTestId('qr-image')).toBeInTheDocument();
    });

    // Verify that QRCode.toDataURL was called with standard quality for large size
    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        quality: 0.92, // Standard quality for large QRs
        rendererOpts: expect.objectContaining({
          quality: 0.92,
        }),
      })
    );
  });

  it('optimizes rendering for different sizes', async () => {
    const mockDataUrl = 'data:image/png;base64,mockdata';
    (vi.mocked(QRCode.toDataURL) as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockDataUrl
    );

    // Test large image
    const { rerender } = render(
      <QrCanvas url="https://example.com" size={200} />
    );

    await waitFor(() => {
      expect(screen.getByTestId('qr-image')).toBeInTheDocument();
    });

    // Test that large images are rendered successfully
    expect(screen.getByTestId('qr-image')).toHaveAttribute('width', '200');
    expect(screen.getByTestId('qr-image')).toHaveAttribute('height', '200');

    // Test small image
    rerender(<QrCanvas url="https://example.com" size={64} />);

    await waitFor(() => {
      expect(screen.getByTestId('qr-image')).toBeInTheDocument();
    });

    // Test that small images are rendered successfully
    expect(screen.getByTestId('qr-image')).toHaveAttribute('width', '64');
    expect(screen.getByTestId('qr-image')).toHaveAttribute('height', '64');
  });

  it('handles QR generation error', async () => {
    vi.mocked(QRCode.toDataURL).mockRejectedValue(
      new Error('QR generation failed')
    );

    render(<QrCanvas url="https://example.com" />);

    await waitFor(() => {
      expect(
        screen.getByText('Error: QR generation failed')
      ).toBeInTheDocument();
    });
  });
});
