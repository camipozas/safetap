import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import StickerSelectorGrouped from '@/components/StickerSelectorGrouped';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockGroupedData = {
  groups: [
    {
      key: 'Juan|A+|alergias,penicilina|condiciones|medicamentos|donor|has-insurance',
      name: 'Juan',
      count: 2,
      stickers: [
        {
          id: '1',
          name: 'Juan',
          flagCode: 'CL',
          colorPresetId: 'blue',
          stickerColor: '#3B82F6',
          textColor: '#FFFFFF',
          createdAt: '2023-01-01T00:00:00.000Z',
          hasProfile: true,
          profileSummary: {
            bloodType: 'A+',
            hasAllergies: true,
            hasConditions: false,
            hasMedications: false,
            hasInsurance: true,
            organDonor: true,
          },
        },
        {
          id: '2',
          name: 'Juan',
          flagCode: 'CL',
          colorPresetId: 'blue',
          stickerColor: '#3B82F6',
          textColor: '#FFFFFF',
          createdAt: '2023-01-02T00:00:00.000Z',
          hasProfile: true,
          profileSummary: {
            bloodType: 'A+',
            hasAllergies: true,
            hasConditions: false,
            hasMedications: false,
            hasInsurance: true,
            organDonor: true,
          },
        },
      ],
      hasAnyProfile: true,
      allHaveProfile: true,
      groupSummary: {
        bloodType: 'A+',
        hasAllergies: true,
        hasConditions: false,
        hasMedications: false,
        hasInsurance: true,
        organDonor: true,
      },
    },
    {
      key: 'María|no-profile',
      name: 'María',
      count: 1,
      stickers: [
        {
          id: '3',
          name: 'María',
          flagCode: 'CL',
          colorPresetId: 'red',
          stickerColor: '#EF4444',
          textColor: '#FFFFFF',
          createdAt: '2023-01-03T00:00:00.000Z',
          hasProfile: false,
          profileSummary: null,
        },
      ],
      hasAnyProfile: false,
      allHaveProfile: false,
      groupSummary: null,
    },
  ],
  totalStickers: 3,
  filteredCount: 3,
  isFiltered: false,
};

describe('StickerSelectorGrouped', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // Mock a delayed response
    (global.fetch as any).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <StickerSelectorGrouped
        selectedStickers={[]}
        onSelectionChange={vi.fn()}
      />
    );

    expect(screen.getByText(/stickers/)).toBeInTheDocument();
  });

  it('renders grouped stickers correctly', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGroupedData,
    });

    const mockOnChange = vi.fn();

    render(
      <StickerSelectorGrouped
        selectedStickers={['1']}
        onSelectionChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument();
      expect(screen.getByText('María')).toBeInTheDocument();
      expect(screen.getByText('2 stickers')).toBeInTheDocument();
      expect(screen.getByText('1 sticker')).toBeInTheDocument();
    });

    // Verificar que se muestre el resumen médico
    expect(
      screen.getByText(/Tipo A\+, Alergias, Seguro, Donante/)
    ).toBeInTheDocument();
    expect(screen.getByText('Sin perfil médico')).toBeInTheDocument();
  });

  it('allows individual sticker selection', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGroupedData,
    });

    const mockOnChange = vi.fn();

    render(
      <StickerSelectorGrouped
        selectedStickers={[]}
        onSelectionChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument();
    });

    // Hacer clic en un sticker individual
    const sticker1 = screen
      .getAllByRole('button')
      .find((button) => button.textContent?.includes('Juan'));
    expect(sticker1).toBeInTheDocument();

    if (sticker1) {
      fireEvent.click(sticker1);
      expect(mockOnChange).toHaveBeenCalledWith(['1']);
    }
  });

  it('allows group selection', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGroupedData,
    });

    const mockOnChange = vi.fn();

    render(
      <StickerSelectorGrouped
        selectedStickers={[]}
        onSelectionChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Seleccionar grupo')).toBeInTheDocument();
    });

    // Hacer clic en "Seleccionar grupo"
    const selectGroupButton = screen.getByText('Seleccionar grupo');
    fireEvent.click(selectGroupButton);

    expect(mockOnChange).toHaveBeenCalledWith(['1', '2']);
  });

  it('handles specific sticker mode', async () => {
    // Mock the simple stickers endpoint for specific sticker mode
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stickers: mockGroupedData.groups[0].stickers.slice(0, 1),
      }),
    });

    const mockOnChange = vi.fn();

    render(
      <StickerSelectorGrouped
        selectedStickers={[]}
        onSelectionChange={mockOnChange}
        specificStickerId="1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument();
    });

    // Verificar que el sticker está preseleccionado
    expect(mockOnChange).toHaveBeenCalledWith(['1']);

    // Verificar que no hay botones de selección múltiple
    expect(screen.queryByText('Seleccionar todos')).not.toBeInTheDocument();
    expect(screen.queryByText('Seleccionar grupo')).not.toBeInTheDocument();
  });

  it('shows filtered state correctly', async () => {
    const filteredData = {
      ...mockGroupedData,
      groups: [mockGroupedData.groups[0]],
      filteredCount: 2,
      isFiltered: true,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => filteredData,
    });

    render(
      <StickerSelectorGrouped
        selectedStickers={[]}
        onSelectionChange={vi.fn()}
        filterSimilar={true}
        excludeStickerId="3"
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          /Mostrando solo stickers con información médica similar/
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(/filtrados por similitud médica/)
      ).toBeInTheDocument();
    });
  });

  it('handles empty state', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        groups: [],
        totalStickers: 0,
        filteredCount: 0,
        isFiltered: false,
      }),
    });

    render(
      <StickerSelectorGrouped
        selectedStickers={[]}
        onSelectionChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No tienes stickers aún.')).toBeInTheDocument();
    });
  });

  it('handles filtered empty state', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        groups: [],
        totalStickers: 5,
        filteredCount: 0,
        isFiltered: true,
      }),
    });

    render(
      <StickerSelectorGrouped
        selectedStickers={[]}
        onSelectionChange={vi.fn()}
        filterSimilar={true}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          'No se encontraron stickers con información médica similar.'
        )
      ).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(
      <StickerSelectorGrouped
        selectedStickers={[]}
        onSelectionChange={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Error: Network error/)).toBeInTheDocument();
    });
  });
});
