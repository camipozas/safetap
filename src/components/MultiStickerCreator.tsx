'use client';

import { useState } from 'react';

import { StickerCustomization } from '@/components/StickerCustomizerNew';

interface MultiStickerCreatorProps {
  baseCustomization: StickerCustomization;
  onCustomizationsChange: (customizations: StickerCustomization[]) => void;
}

export default function MultiStickerCreator({
  baseCustomization,
  onCustomizationsChange,
}: MultiStickerCreatorProps) {
  const [customizations, setCustomizations] = useState<StickerCustomization[]>([
    { ...baseCustomization },
  ]);
  const [showMultiMode, setShowMultiMode] = useState(false);

  const addSticker = () => {
    const newCustomizations = [
      ...customizations,
      {
        ...baseCustomization,
        name: '', // Start with empty name for new sticker
      },
    ];
    setCustomizations(newCustomizations);
    onCustomizationsChange(newCustomizations);
  };

  const removeSticker = (index: number) => {
    if (customizations.length <= 1) {
      return;
    }

    const newCustomizations = customizations.filter((_, i) => i !== index);
    setCustomizations(newCustomizations);
    onCustomizationsChange(newCustomizations);
  };

  const updateSticker = (
    index: number,
    updates: Partial<StickerCustomization>
  ) => {
    const newCustomizations = customizations.map((custom, i) =>
      i === index ? { ...custom, ...updates } : custom
    );
    setCustomizations(newCustomizations);
    onCustomizationsChange(newCustomizations);
  };

  const toggleMultiMode = () => {
    if (!showMultiMode) {
      // Switching to multi mode - keep current customization
      setShowMultiMode(true);
    } else {
      // Switching back to single mode - keep only first
      const singleCustomization = [customizations[0] || baseCustomization];
      setCustomizations(singleCustomization);
      onCustomizationsChange(singleCustomization);
      setShowMultiMode(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-200">
        <div>
          <h3 className="font-semibold text-indigo-900 mb-1">
            Modo de creación
          </h3>
          <p className="text-sm text-indigo-700">
            {showMultiMode
              ? 'Crear múltiples stickers con nombres diferentes. La información médica se compartirá entre todos.'
              : 'Crear stickers idénticos'}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleMultiMode}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showMultiMode
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-white text-indigo-600 border border-indigo-300 hover:bg-indigo-50'
          }`}
        >
          {showMultiMode ? 'Modo simple' : 'Modo múltiple'}
        </button>
      </div>

      {showMultiMode ? (
        /* Multiple stickers mode */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">
              Stickers personalizados ({customizations.length})
            </h4>
            <button
              type="button"
              onClick={addSticker}
              disabled={customizations.length >= 10}
              className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Agregar sticker
            </button>
          </div>

          <div className="space-y-3">
            {customizations.map((customization, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">
                    Sticker #{index + 1}
                  </h5>
                  {customizations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSticker(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor={`sticker-name-${index}`}
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Nombre para este sticker
                    </label>
                    <input
                      id={`sticker-name-${index}`}
                      type="text"
                      value={customization.name}
                      onChange={(e) =>
                        updateSticker(index, { name: e.target.value })
                      }
                      placeholder="Nombre completo"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      maxLength={25}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {customization.name.length}/25 caracteres
                    </p>
                  </div>

                  {/* Flag */}
                  <div>
                    <label
                      htmlFor={`sticker-flag-${index}`}
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      País
                    </label>
                    <select
                      id={`sticker-flag-${index}`}
                      value={customization.flagCode}
                      onChange={(e) =>
                        updateSticker(index, { flagCode: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="CL">🇨🇱 Chile</option>
                      <option value="AR">🇦🇷 Argentina</option>
                      <option value="PE">🇵🇪 Perú</option>
                      <option value="CO">🇨🇴 Colombia</option>
                      <option value="MX">🇲🇽 México</option>
                      <option value="US">🇺🇸 Estados Unidos</option>
                      <option value="ES">🇪🇸 España</option>
                      <option value="FR">🇫🇷 Francia</option>
                      <option value="DE">🇩🇪 Alemania</option>
                      <option value="IT">🇮🇹 Italia</option>
                      <option value="BR">🇧🇷 Brasil</option>
                      <option value="CA">🇨🇦 Canadá</option>
                    </select>
                  </div>

                  {/* Colors preview */}
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">
                      Colores (heredados)
                    </span>
                    <div className="flex items-center gap-2 p-3 bg-white border border-gray-300 rounded-lg">
                      <div
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: customization.stickerColor }}
                      />
                      <div
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: customization.textColor }}
                      />
                      <span className="text-sm text-gray-600">
                        Mismo diseño base
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {customizations.length < 10 && (
            <div className="text-center py-4">
              <button
                type="button"
                onClick={addSticker}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Agregar otro sticker (máx. 10)
              </button>
            </div>
          )}

          {/* Emergency Profile Info */}
          {customizations.length > 1 && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-green-600 mr-2 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-green-900">
                    Información médica optimizada
                  </h4>
                  <p className="text-sm text-green-800 mt-1">
                    Todos estos stickers compartirán la misma información médica
                    y contactos de emergencia. Solo necesitas configurar tu
                    perfil médico una vez y se aplicará a todos los stickers.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Single mode info */
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-gray-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">
                Modo simple activado
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Todos los stickers tendrán el mismo nombre y diseño. Usa el
                campo &quot;Cantidad&quot; para especificar cuántos quieres.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
