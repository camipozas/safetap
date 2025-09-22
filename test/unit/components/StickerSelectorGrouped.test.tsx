import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import StickerSelectorGrouped from '@/components/StickerSelectorGrouped';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockStickerData = {
  stickers: [
    {
      id: '1',
      nameOnSticker: 'Juan',
      flagCode: 'CL',
      colorPresetId: 'blue',
      stickerColor: '#3B82F6',
      textColor: '#FFFFFF',
      createdAt: '2023-01-01T00:00:00.000Z',
      EmergencyProfile: {
        id: 'profile-1',
        bloodType: 'A+',
        allergies: ['penicilina'],
        conditions: [],
        medications: [],
        insurance: { type: 'isapre' },
        organDonor: true,
      },
    },
    {
      id: '2',
      nameOnSticker: 'Juan',
      flagCode: 'CL',
      colorPresetId: 'blue',
      stickerColor: '#3B82F6',
      textColor: '#FFFFFF',
      createdAt: '2023-01-02T00:00:00.000Z',
      EmergencyProfile: {
        id: 'profile-2',
        bloodType: 'A+',
        allergies: ['penicilina'],
        conditions: [],
        medications: [],
        insurance: { type: 'isapre' },
        organDonor: true,
      },
    },
    {
      id: '3',
      nameOnSticker: 'María',
      flagCode: 'US',
      colorPresetId: 'pink',
      stickerColor: '#EC4899',
      textColor: '#FFFFFF',
      createdAt: '2023-01-03T00:00:00.000Z',
      EmergencyProfile: null,
    },
  ],
};

describe('StickerSelectorGrouped', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    // Mock a delayed response
    vi.mocked(global.fetch).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <StickerSelectorGrouped
        selectedStickers={[]}
        onSelectionChange={() => {}}
        showTitle={true}
      />
    );

    // Look for loading state indicators (skeleton animation)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders grouped stickers correctly', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStickerData,
    } as Response);

    render(
      <StickerSelectorGrouped
        selectedStickers={[]}
        onSelectionChange={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('Juan')).toHaveLength(3); // One in header, two in sticker items
    });
  });

  it('handles specific sticker mode', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stickers: [mockStickerData.stickers[0]],
      }),
    } as Response);

    render(
      <StickerSelectorGrouped
        selectedStickers={['1']}
        onSelectionChange={() => {}}
        specificStickerId="1"
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('Juan')).toHaveLength(2); // One in header, one in sticker item
    });
  });

  it('handles empty state', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stickers: [] }),
    } as Response);

    render(
      <StickerSelectorGrouped
        selectedStickers={[]}
        onSelectionChange={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No tienes stickers aún.')).toBeInTheDocument();
    });
  });

  it('handles network error', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

    render(
      <StickerSelectorGrouped
        selectedStickers={[]}
        onSelectionChange={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });
});
