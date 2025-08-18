import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import StickerCustomizer from '@/components/StickerCustomizerNew';

// Mock child components
vi.mock('@/components/CountrySelect', () => ({
  CountrySelect: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => (
    <select
      data-testid="country-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="CL">Chile</option>
      <option value="ES">España</option>
      <option value="US">Estados Unidos</option>
    </select>
  ),
}));

vi.mock('@/components/StickerPreview', () => ({
  default: ({
    name,
    flagCode,
    stickerColor,
    textColor,
  }: {
    name: string;
    flagCode: string;
    stickerColor: string;
    textColor: string;
  }) => (
    <div
      data-testid="sticker-preview"
      data-name={name}
      data-flag={flagCode}
      data-sticker-color={stickerColor}
      data-text-color={textColor}
    >
      Sticker Preview
    </div>
  ),
}));

describe('StickerCustomizer', () => {
  it('renders all customization options', () => {
    render(<StickerCustomizer />);

    expect(screen.getByTestId('sticker-preview')).toBeInTheDocument();
    expect(screen.getByTestId('country-select')).toBeInTheDocument();
    expect(screen.getByDisplayValue('')).toBeInTheDocument(); // Name input
  });

  it('updates name when typing', () => {
    render(<StickerCustomizer />);

    const nameInput = screen.getByPlaceholderText(/francisco pérez/i);
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    const preview = screen.getByTestId('sticker-preview');
    expect(preview).toHaveAttribute('data-name', 'John Doe');
  });

  it('updates country when selecting from dropdown', () => {
    render(<StickerCustomizer />);

    const countrySelect = screen.getByTestId('country-select');
    fireEvent.change(countrySelect, { target: { value: 'ES' } });

    const preview = screen.getByTestId('sticker-preview');
    expect(preview).toHaveAttribute('data-flag', 'ES');
  });

  it('applies preset colors when clicked', () => {
    render(<StickerCustomizer />);

    // Find a preset color button by title attribute
    const blackButton = screen.getByTitle(/negro/i);
    fireEvent.click(blackButton);

    const preview = screen.getByTestId('sticker-preview');
    expect(preview).toHaveAttribute('data-sticker-color', '#000000');
    expect(preview).toHaveAttribute('data-text-color', '#ffffff');
  });

  it('calls onCustomizationChange callback', () => {
    const mockCallback = vi.fn();
    render(<StickerCustomizer onCustomizationChange={mockCallback} />);

    const nameInput = screen.getByPlaceholderText(/francisco pérez/i);
    fireEvent.change(nameInput, { target: { value: 'Test Name' } });

    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Name',
        flagCode: 'CL',
        colorPresetId: 'light-gray',
        stickerColor: '#f1f5f9',
        textColor: '#000000',
      })
    );
  });

  it('updates color preset when selected', () => {
    const mockCallback = vi.fn();
    render(<StickerCustomizer onCustomizationChange={mockCallback} />);

    // Find a preset color button by title attribute - negro (black)
    const blackButton = screen.getByTitle(/negro/i);
    fireEvent.click(blackButton);

    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        colorPresetId: 'black',
        stickerColor: '#000000',
        textColor: '#ffffff',
      })
    );
  });

  it('shows all preset color options', () => {
    render(<StickerCustomizer />);

    // Check that preset colors are displayed by title attributes
    expect(screen.getByTitle(/blanco/i)).toBeInTheDocument();
    expect(screen.getByTitle(/negro/i)).toBeInTheDocument();
    expect(screen.getByTitle(/azul claro/i)).toBeInTheDocument();
    expect(screen.getByTitle(/verde claro/i)).toBeInTheDocument();
  });

  it('maintains state consistency across updates', () => {
    const mockCallback = vi.fn();
    render(<StickerCustomizer onCustomizationChange={mockCallback} />);

    // Make multiple changes
    const nameInput = screen.getByPlaceholderText(/francisco pérez/i);
    fireEvent.change(nameInput, { target: { value: 'John' } });

    const countrySelect = screen.getByTestId('country-select');
    fireEvent.change(countrySelect, { target: { value: 'US' } });

    // Verify final state
    const preview = screen.getByTestId('sticker-preview');
    expect(preview).toHaveAttribute('data-name', 'John');
    expect(preview).toHaveAttribute('data-flag', 'US');

    // Verify callback was called with correct data
    expect(mockCallback).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: 'John',
        flagCode: 'US',
        colorPresetId: 'light-gray',
        stickerColor: '#f1f5f9',
        textColor: '#000000',
      })
    );
  });
});
