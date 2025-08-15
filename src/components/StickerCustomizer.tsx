'use client';

import { useState } from 'react';
import StickerPreview from './StickerPreview';
import { CountrySelect } from './CountrySelect';

interface StickerCustomizerProps {
  onUpdate: (config: StickerConfig) => void;
  initialConfig?: Partial<StickerConfig>;
}

export interface StickerConfig {
  nameOnSticker: string;
  flagCode: string;
  stickerColor: string;
  textColor: string;
  quantity: number;
}

const PRESET_COLORS = [
  { name: 'Blanco', value: '#ffffff' },
  { name: 'Gris Claro', value: '#f1f5f9' },
  { name: 'Azul Claro', value: '#dbeafe' },
  { name: 'Verde Claro', value: '#d1fae5' },
  { name: 'Amarillo Claro', value: '#fef3c7' },
  { name: 'Rosa Claro', value: '#fce7f3' },
  { name: 'Morado Claro', value: '#e9d5ff' },
  { name: 'Rojo Claro', value: '#fee2e2' },
];

const TEXT_COLORS = [
  { name: 'Negro', value: '#000000' },
  { name: 'Gris Oscuro', value: '#374151' },
  { name: 'Azul Oscuro', value: '#1e40af' },
  { name: 'Verde Oscuro', value: '#166534' },
  { name: 'Rojo Oscuro', value: '#dc2626' },
  { name: 'Morado Oscuro', value: '#7c3aed' },
];

export default function StickerCustomizer({ onUpdate, initialConfig }: StickerCustomizerProps) {
  const [config, setConfig] = useState<StickerConfig>({
    nameOnSticker: initialConfig?.nameOnSticker || '',
    flagCode: initialConfig?.flagCode || 'CL',
    stickerColor: initialConfig?.stickerColor || '#f1f5f9',
    textColor: initialConfig?.textColor || '#000000',
    quantity: initialConfig?.quantity || 1,
  });

  const updateConfig = (updates: Partial<StickerConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onUpdate(newConfig);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
      {/* Panel de personalización */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Personaliza tu sticker</h3>
          
          {/* Nombre */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre en el sticker
            </label>
            <input
              type="text"
              value={config.nameOnSticker}
              onChange={(e) => updateConfig({ nameOnSticker: e.target.value })}
              placeholder="Ej: Francisco Pérez"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              maxLength={30}
            />
            <p className="text-xs text-gray-500 mt-1">
              Máximo 30 caracteres. Aparecerá en tu sticker.
            </p>
          </div>

          {/* País */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              País
            </label>
            <CountrySelect
              name="flagCode"
              value={config.flagCode}
              onChange={(flagCode: string) => updateConfig({ flagCode })}
            />
          </div>

          {/* Color del sticker */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color del sticker
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => updateConfig({ stickerColor: color.value })}
                  className={`w-full h-10 rounded-md border-2 transition-all ${
                    config.stickerColor === color.value 
                      ? 'border-brand ring-2 ring-brand ring-opacity-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
            <input
              type="color"
              value={config.stickerColor}
              onChange={(e) => updateConfig({ stickerColor: e.target.value })}
              className="w-full h-10 rounded-md border border-gray-300"
            />
          </div>

          {/* Color del texto */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color del texto
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => updateConfig({ textColor: color.value })}
                  className={`w-full h-8 rounded-md border-2 transition-all ${
                    config.textColor === color.value 
                      ? 'border-brand ring-2 ring-brand ring-opacity-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
            <input
              type="color"
              value={config.textColor}
              onChange={(e) => updateConfig({ textColor: e.target.value })}
              className="w-full h-8 rounded-md border border-gray-300"
            />
          </div>

          {/* Cantidad */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad
            </label>
            <select
              value={config.quantity}
              onChange={(e) => updateConfig({ quantity: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            >
              {[1, 2, 3, 4, 5, 10, 15, 20].map(num => (
                <option key={num} value={num}>
                  {num} sticker{num > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Información importante */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-amber-800">Importante</h4>
              <p className="text-sm text-amber-700 mt-1">
                Esta es solo una vista previa. El QR real será generado cuando recibas tu sticker físico y será único para ti.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Vista previa */}
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-semibold mb-4">Vista previa</h3>
        <StickerPreview
          name={config.nameOnSticker}
          flagCode={config.flagCode}
          stickerColor={config.stickerColor}
          textColor={config.textColor}
          showRealQR={false}
          className="mb-4"
        />
        
        {/* Información del precio */}
        <div className="bg-gray-50 rounded-lg p-4 w-full max-w-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Stickers ({config.quantity})</span>
            <span className="font-medium">€{(config.quantity * 15).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Envío</span>
            <span className="text-sm text-gray-600">€3.00</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between items-center font-semibold">
            <span>Total</span>
            <span>€{(config.quantity * 15 + 3).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
