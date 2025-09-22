'use client';

import { useEffect, useState } from 'react';

interface Sticker {
  id: string;
  name: string;
  flagCode: string;
  colorPresetId: string;
  stickerColor: string;
  textColor: string;
  createdAt: string;
}

interface StickerSelectorProps {
  selectedStickers: string[];
  onSelectionChange: (stickerIds: string[]) => void;
  className?: string;
  showTitle?: boolean;
  specificStickerId?: string;
}

export default function StickerSelector({
  selectedStickers,
  onSelectionChange,
  className = '',
  showTitle = false,
  specificStickerId,
}: StickerSelectorProps) {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStickers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/stickers');
        if (response.ok) {
          const data = await response.json();

          const filteredStickers = specificStickerId
            ? data.stickers.filter((s: Sticker) => s.id === specificStickerId)
            : data.stickers;

          setStickers(filteredStickers);

          // If there is a specific sticker, ensure it is selected
          if (specificStickerId) {
            if (!selectedStickers.includes(specificStickerId)) {
              onSelectionChange([specificStickerId]);
            }
          }
          // NO select automatically in multiple mode - the user must choose consciously
        } else {
          throw new Error('Error al cargar stickers');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    loadStickers();
  }, [selectedStickers, onSelectionChange, specificStickerId]);

  const handleStickerToggle = (stickerId: string) => {
    const newSelection = selectedStickers.includes(stickerId)
      ? selectedStickers.filter((id) => id !== stickerId)
      : [...selectedStickers, stickerId];

    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    onSelectionChange(stickers.map((s) => s.id));
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-48 mb-4" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="text-red-600 text-sm">Error: {error}</div>
      </div>
    );
  }

  if (stickers.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-gray-500 text-sm">No tienes stickers aún.</div>
      </div>
    );
  }

  return (
    <div className={className}>
      {showTitle && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Selecciona los stickers que quieres actualizar
          </h3>
        </div>
      )}
      {!specificStickerId && (
        <div className="flex gap-2 text-xs mb-3">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-blue-600 hover:text-blue-800"
          >
            Seleccionar todos
          </button>
          <span className="text-gray-400">|</span>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="text-blue-600 hover:text-blue-800"
          >
            Deseleccionar todos
          </button>
        </div>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {stickers.map((sticker) => (
          <div
            key={sticker.id}
            className={`border rounded-lg p-3 transition-colors ${
              selectedStickers.includes(sticker.id)
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200'
            } ${
              specificStickerId
                ? 'opacity-75'
                : 'cursor-pointer hover:border-gray-300'
            }`}
            onClick={
              specificStickerId
                ? undefined
                : () => handleStickerToggle(sticker.id)
            }
            onKeyDown={
              specificStickerId
                ? undefined
                : (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStickerToggle(sticker.id);
                    }
                  }
            }
            role={specificStickerId ? undefined : 'button'}
            tabIndex={specificStickerId ? undefined : 0}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedStickers.includes(sticker.id)}
                    onChange={
                      specificStickerId
                        ? undefined
                        : () => handleStickerToggle(sticker.id)
                    }
                    disabled={!!specificStickerId}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border-2 flex items-center justify-center text-xs font-medium"
                    style={{
                      backgroundColor: sticker.stickerColor,
                      borderColor: sticker.stickerColor,
                      color: sticker.textColor,
                    }}
                  >
                    QR
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {sticker.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {sticker.flagCode} • Creado{' '}
                      {new Date(sticker.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-gray-600">
        {selectedStickers.length} de {stickers.length} stickers seleccionados
      </div>
    </div>
  );
}
