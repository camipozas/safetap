'use client';

import { memo, useCallback, useState } from 'react';

import { CountrySelect } from '@/components/CountrySelect';
import StickerPreview from '@/components/StickerPreview';
import {
  COLOR_PRESETS,
  DEFAULT_COLOR_PRESET,
  getColorPresetById,
} from '@/lib/color-presets';

interface StickerCustomizerProps {
  onCustomizationChange?: (data: StickerCustomization) => void;
}

export interface StickerCustomization {
  name: string;
  flagCode: string;
  colorPresetId: string;
  stickerColor: string;
  textColor: string;
}

const StickerCustomizerComponent = ({
  onCustomizationChange,
}: StickerCustomizerProps) => {
  const [customization, setCustomization] = useState<StickerCustomization>({
    name: '',
    flagCode: 'CL',
    colorPresetId: DEFAULT_COLOR_PRESET.id,
    stickerColor: DEFAULT_COLOR_PRESET.stickerColor,
    textColor: DEFAULT_COLOR_PRESET.textColor,
  });

  const updateCustomization = useCallback(
    (updates: Partial<StickerCustomization>) => {
      const newCustomization = { ...customization, ...updates };
      setCustomization(newCustomization);
      onCustomizationChange?.(newCustomization);
    },
    [customization, onCustomizationChange]
  );

  const selectColorPreset = useCallback(
    (presetId: string) => {
      const preset = getColorPresetById(presetId);
      if (preset) {
        updateCustomization({
          colorPresetId: preset.id,
          stickerColor: preset.stickerColor,
          textColor: preset.textColor,
        });
      }
    },
    [updateCustomization]
  );

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 lg:gap-8">
      {/* Vista previa móvil - mostrar primero en móvil */}
      <div className="flex flex-col items-center justify-center order-1 lg:order-2">
        <h3 className="text-lg font-semibold mb-4">Vista previa</h3>
        <div className="w-full max-w-xs sm:max-w-sm lg:max-w-none">
          <StickerPreview
            key={`${customization.name}-${customization.flagCode}-${customization.colorPresetId}`}
            name={customization.name}
            flagCode={customization.flagCode}
            stickerColor={customization.stickerColor}
            textColor={customization.textColor}
            showRealQR={false}
            className="mb-4 mx-auto"
          />
        </div>
        <p className="text-sm text-gray-600 text-center max-w-sm px-4">
          Esta es una vista previa de cómo se verá tu sticker. El QR real se
          activará cuando recibas el producto físico.
        </p>
      </div>

      {/* Panel de personalización */}
      <div className="space-y-6 order-2 lg:order-1">
        <div>
          <h2 className="text-2xl font-bold mb-6">Personaliza tu sticker</h2>

          {/* Nombre */}
          <div className="mb-6">
            <label
              htmlFor="name-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Nombre completo *
            </label>
            <input
              id="name-input"
              type="text"
              value={customization.name}
              onChange={(e) => updateCustomization({ name: e.target.value })}
              placeholder="Francisco Pérez"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={25}
            />
            <p className="text-xs text-gray-500 mt-1">
              Máximo 25 caracteres ({customization.name.length}/25)
            </p>
          </div>

          {/* País */}
          <div className="mb-6">
            <label
              htmlFor="country-select"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              País *
            </label>
            <CountrySelect
              name="flagCode"
              value={customization.flagCode}
              onChange={(flagCode: string) => updateCustomization({ flagCode })}
            />
          </div>

          {/* Esquemas de colores predefinidos */}
          <div className="mb-6">
            <div className="block text-sm font-medium text-gray-700 mb-4">
              Esquema de colores *
            </div>

            {/* Neutral colors */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                Neutros
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COLOR_PRESETS.filter(
                  (preset) => preset.category === 'neutral'
                ).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => selectColorPreset(preset.id)}
                    className={`p-2 sm:p-3 rounded-lg border-2 flex flex-col items-center justify-center text-xs font-medium transition-all hover:scale-105 active:scale-95 touch-manipulation ${
                      customization.colorPresetId === preset.id
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{
                      backgroundColor: preset.stickerColor,
                      color: preset.textColor,
                    }}
                    title={preset.name}
                  >
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold mb-1"
                      style={{
                        backgroundColor: preset.textColor,
                        color: preset.stickerColor,
                      }}
                    >
                      Aa
                    </div>
                    <span className="text-xs">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-600 mb-2">
                Con color
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {COLOR_PRESETS.filter(
                  (preset) => preset.category === 'colors'
                ).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => selectColorPreset(preset.id)}
                    className={`p-2 sm:p-3 rounded-lg border-2 flex flex-col items-center justify-center text-xs font-medium transition-all hover:scale-105 active:scale-95 touch-manipulation ${
                      customization.colorPresetId === preset.id
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{
                      backgroundColor: preset.stickerColor,
                      color: preset.textColor,
                    }}
                    title={preset.name}
                  >
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold mb-1"
                      style={{
                        backgroundColor: preset.textColor,
                        color: preset.stickerColor,
                      }}
                    >
                      Aa
                    </div>
                    <span className="text-xs">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Nota importante */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-yellow-600 mt-0.5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Importante sobre el QR
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  El QR que ves en la vista previa no es funcional. Solo
                  recibirás el QR real cuando te llegue el sticker físicamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StickerCustomizer = memo(StickerCustomizerComponent);
export default StickerCustomizer;
