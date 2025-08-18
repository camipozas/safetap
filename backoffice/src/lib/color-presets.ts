// Predefined color schemes for stickers
// These are the only colors users can choose from

export interface ColorPreset {
  id: string;
  name: string;
  stickerColor: string; // Background color
  textColor: string; // Text color
  category: 'neutral' | 'colors';
}

export const COLOR_PRESETS: ColorPreset[] = [
  // Neutral colors (blacks, whites, grays)
  {
    id: 'white',
    name: 'Blanco',
    stickerColor: '#ffffff',
    textColor: '#000000',
    category: 'neutral',
  },
  {
    id: 'light-gray',
    name: 'Gris claro',
    stickerColor: '#f1f5f9',
    textColor: '#000000',
    category: 'neutral',
  },
  {
    id: 'black',
    name: 'Negro',
    stickerColor: '#000000',
    textColor: '#ffffff',
    category: 'neutral',
  },

  // Color options
  {
    id: 'light-blue',
    name: 'Azul claro',
    stickerColor: '#dbeafe',
    textColor: '#1e40af',
    category: 'colors',
  },
  {
    id: 'dark-blue',
    name: 'Azul oscuro',
    stickerColor: '#1e40af',
    textColor: '#ffffff',
    category: 'colors',
  },
  {
    id: 'light-green',
    name: 'Verde claro',
    stickerColor: '#dcfce7',
    textColor: '#166534',
    category: 'colors',
  },
  {
    id: 'dark-green',
    name: 'Verde oscuro',
    stickerColor: '#166534',
    textColor: '#ffffff',
    category: 'colors',
  },
  {
    id: 'light-yellow',
    name: 'Amarillo',
    stickerColor: '#fef3c7',
    textColor: '#92400e',
    category: 'colors',
  },
  {
    id: 'light-pink',
    name: 'Rosa',
    stickerColor: '#fce7f3',
    textColor: '#be185d',
    category: 'colors',
  },
  {
    id: 'red',
    name: 'Rojo',
    stickerColor: '#dc2626',
    textColor: '#ffffff',
    category: 'colors',
  },
];

// Default color preset
export const DEFAULT_COLOR_PRESET = COLOR_PRESETS[1]; // 'light-gray'

// Helper functions
export function getColorPresetById(id: string): ColorPreset | undefined {
  return COLOR_PRESETS.find((preset) => preset.id === id);
}

export function getColorPresetByColors(
  stickerColor: string,
  textColor: string
): ColorPreset | undefined {
  return COLOR_PRESETS.find(
    (preset) =>
      preset.stickerColor === stickerColor && preset.textColor === textColor
  );
}

export function isValidColorPreset(id: string): boolean {
  return COLOR_PRESETS.some((preset) => preset.id === id);
}
