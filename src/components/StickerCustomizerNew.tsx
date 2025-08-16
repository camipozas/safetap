'use client';

import { useState } from 'react';

import { CountrySelect } from './CountrySelect';
import StickerPreview from './StickerPreview';

interface StickerCustomizerProps {
  onCustomizationChange?: (data: StickerCustomization) => void;
}

export interface StickerCustomization {
  name: string;
  flagCode: string;
  stickerColor: string;
  textColor: string;
}

const PRESET_COLORS = [
  { name: 'Blanco', value: '#ffffff', text: '#000000' },
  { name: 'Gris claro', value: '#f1f5f9', text: '#000000' },
  { name: 'Azul claro', value: '#dbeafe', text: '#1e40af' },
  { name: 'Verde claro', value: '#dcfce7', text: '#166534' },
  { name: 'Amarillo claro', value: '#fef3c7', text: '#92400e' },
  { name: 'Rosa claro', value: '#fce7f3', text: '#be185d' },
  { name: 'Negro', value: '#000000', text: '#ffffff' },
  { name: 'Azul oscuro', value: '#1e40af', text: '#ffffff' },
  { name: 'Verde oscuro', value: '#166534', text: '#ffffff' },
  { name: 'Rojo', value: '#dc2626', text: '#ffffff' },
];

export default function StickerCustomizer({
  onCustomizationChange,
}: StickerCustomizerProps) {
  const [customization, setCustomization] = useState<StickerCustomization>({
    name: '',
    flagCode: 'CL',
    stickerColor: '#f1f5f9',
    textColor: '#000000',
  });

  const updateCustomization = (updates: Partial<StickerCustomization>) => {
    const newCustomization = { ...customization, ...updates };
    setCustomization(newCustomization);
    onCustomizationChange?.(newCustomization);
  };

  const selectPresetColor = (preset: (typeof PRESET_COLORS)[0]) => {
    updateCustomization({
      stickerColor: preset.value,
      textColor: preset.text,
    });
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Panel de personalización */}
      <div className="space-y-6">
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

          {/* Colores predefinidos */}
          <div className="mb-6">
            <label
              htmlFor="preset-colors"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Colores predefinidos
            </label>
            <div id="preset-colors" className="grid grid-cols-5 gap-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => selectPresetColor(preset)}
                  className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-xs font-medium transition-all ${
                    customization.stickerColor === preset.value
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{
                    backgroundColor: preset.value,
                    color: preset.text,
                  }}
                  title={preset.name}
                >
                  Aa
                </button>
              ))}
            </div>
          </div>

          {/* Color personalizado del sticker */}
          <div className="mb-4">
            <label
              htmlFor="custom-sticker-color"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Color del sticker personalizado
            </label>
            <div className="flex items-center gap-3">
              <input
                id="custom-sticker-color"
                type="color"
                value={customization.stickerColor}
                onChange={(e) =>
                  updateCustomization({ stickerColor: e.target.value })
                }
                className="w-12 h-12 rounded border border-gray-300"
              />
              <input
                type="text"
                value={customization.stickerColor}
                onChange={(e) =>
                  updateCustomization({ stickerColor: e.target.value })
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="#f1f5f9"
              />
            </div>
          </div>

          {/* Color del texto */}
          <div className="mb-6">
            <label
              htmlFor="custom-text-color"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Color del texto
            </label>
            <div className="flex items-center gap-3">
              <input
                id="custom-text-color"
                type="color"
                value={customization.textColor}
                onChange={(e) =>
                  updateCustomization({ textColor: e.target.value })
                }
                className="w-12 h-12 rounded border border-gray-300"
              />
              <input
                type="text"
                value={customization.textColor}
                onChange={(e) =>
                  updateCustomization({ textColor: e.target.value })
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="#000000"
              />
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

      {/* Vista previa */}
      <div className="flex flex-col items-center justify-center">
        <h3 className="text-lg font-semibold mb-4">Vista previa</h3>
        <StickerPreview
          key={`${customization.name}-${customization.flagCode}-${customization.stickerColor}-${customization.textColor}`}
          name={customization.name}
          flagCode={customization.flagCode}
          stickerColor={customization.stickerColor}
          textColor={customization.textColor}
          showRealQR={false}
          className="mb-4"
        />
        <p className="text-sm text-gray-600 text-center max-w-sm">
          Esta es una vista previa de cómo se verá tu sticker. El QR real se
          activará cuando recibas el producto físico.
        </p>
      </div>
    </div>
  );
}
