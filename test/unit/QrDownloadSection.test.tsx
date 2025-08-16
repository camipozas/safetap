import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { QrDownloadSection } from '@/components/QrDownloadSection';

// Mock QrCanvas component
vi.mock('@/components/QrCanvas', () => ({
  QrCanvas: ({
    url,
    size,
    className,
  }: {
    url: string;
    size: number;
    className: string;
  }) => (
    <div
      data-testid="qr-canvas"
      data-url={url}
      data-size={size}
      className={className}
    >
      QR Canvas Mock
    </div>
  ),
}));

describe('QrDownloadSection', () => {
  const defaultProps = {
    url: 'https://safetap.cl/s/test-sticker',
    filename: 'john-doe-qr',
  };

  it('renders download section with QR canvas', () => {
    render(<QrDownloadSection {...defaultProps} />);

    expect(screen.getByTestId('qr-canvas')).toBeInTheDocument();
  });

  it('displays QR code with correct URL', () => {
    render(<QrDownloadSection {...defaultProps} />);

    const qrCanvas = screen.getByTestId('qr-canvas');
    expect(qrCanvas).toHaveAttribute(
      'data-url',
      'https://safetap.cl/s/test-sticker'
    );
  });

  it('shows download controls', () => {
    render(<QrDownloadSection {...defaultProps} />);

    // Check for size selector by label
    expect(screen.getByLabelText(/tamaño final/i)).toBeInTheDocument();

    // Check for download button
    expect(
      screen.getByRole('button', { name: /descargar png/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /descargar svg/i })
    ).toBeInTheDocument();
  });

  it('provides quality options', () => {
    render(<QrDownloadSection {...defaultProps} />);

    expect(
      screen.getByLabelText(/resolución de impresión/i)
    ).toBeInTheDocument();
  });

  it('handles missing filename prop', () => {
    render(<QrDownloadSection url="https://test.com/qr" />);

    expect(screen.getByTestId('qr-canvas')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    render(<QrDownloadSection {...defaultProps} className="custom-class" />);

    const container = screen
      .getByText('Descarga QR de Alta Resolución')
      .closest('div');
    expect(container).toHaveClass('custom-class');
  });

  it('renders with default filename when not provided', () => {
    render(<QrDownloadSection url="https://test.com/qr" />);

    // Component should render successfully with default filename
    expect(screen.getByTestId('qr-canvas')).toBeInTheDocument();
  });
});
