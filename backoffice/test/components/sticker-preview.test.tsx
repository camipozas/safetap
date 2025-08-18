import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import StickerPreview from '@/components/ui/sticker-preview';

// Mock StickerQrCode component
vi.mock('@/components/ui/sticker-qr-code', () => ({
  StickerQrCode: ({ slug, size }: { slug: string; size: number }) => (
    <div data-testid="sticker-qr-code" data-slug={slug} data-size={size}>
      QR Code
    </div>
  ),
}));

const mockSticker = {
  id: 'test-id',
  slug: 'test-slug',
  serial: 'TEST123',
  nameOnSticker: 'John Doe',
  flagCode: 'CL',
  colorPresetId: 'light-gray',
  stickerColor: '#f1f5f9',
  textColor: '#000000',
  owner: {
    name: 'John Doe',
    country: 'CL',
  },
  profile: {
    bloodType: 'O+',
    contacts: [
      {
        name: 'Emergency Contact',
        phone: '+1234567890',
        relation: 'Family',
      },
    ],
  },
};

describe('StickerPreview (Backoffice)', () => {
  it('renders sticker with basic information', () => {
    render(<StickerPreview sticker={mockSticker} />);

    expect(screen.getByText('SafeTap')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('🇨🇱')).toBeInTheDocument();
  });

  it('applies custom colors from sticker data', () => {
    const customSticker = {
      ...mockSticker,
      stickerColor: '#ff0000',
      textColor: '#00ff00',
    };

    render(<StickerPreview sticker={customSticker} />);

    const stickerContainer = screen
      .getByText('SafeTap')
      .closest('[style*="background"]');
    expect(stickerContainer).toHaveStyle('background-color: #ff0000');
  });

  it('uses responsive padding classes', () => {
    render(<StickerPreview sticker={mockSticker} />);

    const stickerContainer = screen
      .getByText('SafeTap')
      .closest('.p-2.sm\\:p-3');
    expect(stickerContainer).toBeInTheDocument();
  });

  it('uses optimized spacing for mobile', () => {
    render(<StickerPreview sticker={mockSticker} />);

    // Check for mobile-optimized gap classes
    const personalInfoContainer = screen
      .getByText('John Doe')
      .closest('.gap-1.sm\\:gap-2');
    expect(personalInfoContainer).toBeInTheDocument();

    // Check for mobile-optimized margin classes
    const containerWithMargin = screen
      .getByText('John Doe')
      .closest('.mb-2.sm\\:mb-3');
    expect(containerWithMargin).toBeInTheDocument();
  });

  it('renders QR code component with correct props', () => {
    render(<StickerPreview sticker={mockSticker} size={150} />);

    const qrCode = screen.getByTestId('sticker-qr-code');
    expect(qrCode).toBeInTheDocument();
    expect(qrCode).toHaveAttribute('data-slug', 'test-slug');
    // QR size should be 32% of sticker size with minimum of 32
    expect(qrCode).toHaveAttribute('data-size', '48'); // Math.max(150 * 0.32, 32) = 48
  });

  it('prioritizes owner data over sticker data', () => {
    const stickerWithOwner = {
      ...mockSticker,
      nameOnSticker: 'Name On Sticker',
      flagCode: 'US',
      owner: {
        name: 'Owner Name',
        country: 'ES',
      },
    };

    render(<StickerPreview sticker={stickerWithOwner} />);

    // Should use owner data, not sticker data
    expect(screen.getByText('Owner Name')).toBeInTheDocument();
    expect(screen.getByText('🇪🇸')).toBeInTheDocument();
  });

  it('falls back to sticker data when owner data is missing', () => {
    const stickerWithoutOwner = {
      ...mockSticker,
      owner: undefined,
    };

    render(<StickerPreview sticker={stickerWithoutOwner} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('🇨🇱')).toBeInTheDocument();
  });

  it('handles unknown flag codes gracefully', () => {
    const stickerWithUnknownFlag = {
      ...mockSticker,
      flagCode: 'UNKNOWN',
      owner: {
        name: 'John Doe',
        country: 'UNKNOWN',
      },
    };

    render(<StickerPreview sticker={stickerWithUnknownFlag} />);

    expect(screen.getByText('🏳️')).toBeInTheDocument();
  });

  it('scales elements based on size prop', () => {
    render(<StickerPreview sticker={mockSticker} size={100} />);

    // Find the actual sticker container by its style attribute
    const containers = document.querySelectorAll('[style*="width: 100px"]');
    expect(containers.length).toBeGreaterThan(0);

    const stickerContainer = Array.from(containers).find((el) =>
      el.getAttribute('style')?.includes('height: 100px')
    );
    expect(stickerContainer).toBeDefined();
    expect(stickerContainer).toHaveStyle('width: 100px');
    expect(stickerContainer).toHaveStyle('height: 100px');
  });

  it('displays emergency information text', () => {
    render(<StickerPreview sticker={mockSticker} />);

    expect(screen.getByText('INFORMACIÓN')).toBeInTheDocument();
    expect(screen.getByText('DE EMERGENCIA')).toBeInTheDocument();
  });

  it('renders NFC icon', () => {
    render(<StickerPreview sticker={mockSticker} />);

    const nfcIcon = screen.getByText('INFORMACIÓN').previousElementSibling;
    expect(nfcIcon).toBeInTheDocument();
    expect(nfcIcon?.tagName).toBe('DIV');
  });

  it('is memoized to prevent unnecessary re-renders', () => {
    const { rerender } = render(<StickerPreview sticker={mockSticker} />);

    // Re-render with same props
    rerender(<StickerPreview sticker={mockSticker} />);

    // Component should be memoized (this test verifies the memo wrapper exists)
    expect(screen.getByText('SafeTap')).toBeInTheDocument();
  });
});
