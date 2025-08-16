import { render, screen, waitFor } from '@testing-library/react';
import QRCode from 'qrcode';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QrCanvas } from '@/components/QrCanvas';

// Mock QRCode library
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(),
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
    (QRCode.toDataURL as any).mockResolvedValue(
      'data:image/png;base64,mock-qr-code'
    );
  });

  it('renders loading state initially', () => {
    (QRCode.toDataURL as any).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<QrCanvas url="https://example.com" />);

    expect(screen.getByText('Generando QR...')).toBeInTheDocument();
  });

  it('generates QR code successfully', async () => {
    const mockDataUrl = 'data:image/png;base64,mockdata';
    (QRCode.toDataURL as any).mockResolvedValue(mockDataUrl);

    render(<QrCanvas url="https://example.com" alt="Test QR" />);

    await waitFor(() => {
      expect(screen.getByTestId('qr-image')).toBeInTheDocument();
    });

    const image = screen.getByTestId('qr-image');
    expect(image).toHaveAttribute('src', mockDataUrl);
    expect(image).toHaveAttribute('alt', 'Test QR');
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
