'use client';

import { useEffect, useState } from 'react';

interface ProfileSummary {
  bloodType: string | null;
  hasAllergies: boolean;
  hasConditions: boolean;
  hasMedications: boolean;
  hasInsurance: boolean;
  organDonor: boolean | null;
}

interface ProcessedSticker {
  id: string;
  name: string;
  flagCode: string;
  colorPresetId: string;
  stickerColor: string;
  textColor: string;
  createdAt: string;
  hasProfile: boolean;
  profileSummary: ProfileSummary | null;
}

interface StickerGroup {
  key: string;
  name: string;
  count: number;
  stickers: ProcessedSticker[];
  hasAnyProfile: boolean;
  allHaveProfile: boolean;
  groupSummary: ProfileSummary | null;
}

interface StickerSelectorGroupedProps {
  selectedStickers: string[];
  onSelectionChange: (stickerIds: string[]) => void;
  className?: string;
  showTitle?: boolean;
  specificStickerId?: string; // Si se proporciona, solo muestra este sticker y lo deshabilita
  filterSimilar?: boolean; // Si true, filtra por perfiles médicos similares
  excludeStickerId?: string; // ID del sticker a excluir (para comparación)
}

export default function StickerSelectorGrouped({
  selectedStickers,
  onSelectionChange,
  className = '',
  showTitle = false,
  specificStickerId,
  filterSimilar = false,
  excludeStickerId,
}: StickerSelectorGroupedProps) {
  const [groups, setGroups] = useState<StickerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFiltered, setIsFiltered] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadStickers = async () => {
      try {
        if (!isMounted) {
          return;
        }
        setLoading(true);

        // Si hay un sticker específico, usar el endpoint simple
        if (specificStickerId) {
          const response = await fetch('/api/user/stickers');

          if (response.ok) {
            const data = await response.json();

            // Definir tipo para el sticker de la API (mismo que abajo)
            interface StickerFromAPI {
              id: string;
              nameOnSticker: string;
              flagCode: string;
              colorPresetId: string;
              stickerColor: string;
              textColor: string;
              createdAt: string;
              EmergencyProfile?: {
                bloodType: string | null;
                allergies: string[];
                conditions: string[];
                medications: string[];
                insurance: unknown;
                organDonor: boolean | null;
              } | null;
            }

            const filteredStickers = data.stickers.filter(
              (s: StickerFromAPI) => s.id === specificStickerId
            );

            if (filteredStickers.length === 0) {
              throw new Error('Sticker no encontrado');
            }

            const processedSticker = {
              id: filteredStickers[0].id,
              name: filteredStickers[0].nameOnSticker,
              flagCode: filteredStickers[0].flagCode,
              colorPresetId: filteredStickers[0].colorPresetId,
              stickerColor: filteredStickers[0].stickerColor,
              textColor: filteredStickers[0].textColor,
              createdAt: filteredStickers[0].createdAt,
              hasProfile: !!filteredStickers[0].EmergencyProfile,
              profileSummary: filteredStickers[0].EmergencyProfile
                ? {
                    bloodType: filteredStickers[0].EmergencyProfile.bloodType,
                    hasAllergies:
                      filteredStickers[0].EmergencyProfile.allergies?.length >
                      0,
                    hasConditions:
                      filteredStickers[0].EmergencyProfile.conditions?.length >
                      0,
                    hasMedications:
                      filteredStickers[0].EmergencyProfile.medications?.length >
                      0,
                    hasInsurance:
                      !!filteredStickers[0].EmergencyProfile.insurance,
                    organDonor: filteredStickers[0].EmergencyProfile.organDonor,
                  }
                : null,
            };

            // Crear un grupo único para el sticker específico
            const group: StickerGroup = {
              key: processedSticker.name,
              name: processedSticker.name,
              count: 1,
              stickers: [processedSticker],
              hasAnyProfile: processedSticker.hasProfile,
              allHaveProfile: processedSticker.hasProfile,
              groupSummary: processedSticker.profileSummary,
            };

            if (!isMounted) {
              return;
            }
            setGroups([group]);

            // Asegurar que esté seleccionado - solo si no está ya seleccionado
            if (!selectedStickers.includes(specificStickerId)) {
              onSelectionChange([specificStickerId]);
            }
          } else {
            throw new Error('Error al cargar stickers');
          }
        } else {
          // Usar el endpoint simple y agrupar por nombre del sticker
          const response = await fetch('/api/user/stickers');
          if (response.ok) {
            const data = await response.json();

            // Definir tipo para el sticker de la API
            interface StickerFromAPI {
              id: string;
              nameOnSticker: string;
              flagCode: string;
              colorPresetId: string;
              stickerColor: string;
              textColor: string;
              createdAt: string;
              EmergencyProfile?: {
                bloodType: string | null;
                allergies: string[];
                conditions: string[];
                medications: string[];
                insurance: unknown;
                organDonor: boolean | null;
              } | null;
            }

            // Agrupar por nombre del sticker para mostrar cantidades
            const stickerMap = new Map<string, ProcessedSticker[]>();

            data.stickers.forEach((s: StickerFromAPI) => {
              const processedSticker = {
                id: s.id,
                name: s.nameOnSticker,
                flagCode: s.flagCode,
                colorPresetId: s.colorPresetId,
                stickerColor: s.stickerColor,
                textColor: s.textColor,
                createdAt: s.createdAt,
                hasProfile: !!s.EmergencyProfile,
                profileSummary: s.EmergencyProfile
                  ? {
                      bloodType: s.EmergencyProfile.bloodType,
                      hasAllergies: s.EmergencyProfile.allergies?.length > 0,
                      hasConditions: s.EmergencyProfile.conditions?.length > 0,
                      hasMedications:
                        s.EmergencyProfile.medications?.length > 0,
                      hasInsurance: !!s.EmergencyProfile.insurance,
                      organDonor: s.EmergencyProfile.organDonor,
                    }
                  : null,
              };

              if (!stickerMap.has(s.nameOnSticker)) {
                stickerMap.set(s.nameOnSticker, []);
              }
              stickerMap.get(s.nameOnSticker)!.push(processedSticker);
            });

            // Crear grupos basados en el agrupamiento por nombre
            const groups = Array.from(stickerMap.entries()).map(
              ([name, stickers]) => {
                // Usar el perfil del sticker más reciente como resumen del grupo
                const mostRecentSticker = stickers.sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )[0];

                return {
                  key: name,
                  name,
                  count: stickers.length,
                  stickers,
                  hasAnyProfile: stickers.some((s) => s.hasProfile),
                  allHaveProfile: stickers.every((s) => s.hasProfile),
                  groupSummary: mostRecentSticker.profileSummary,
                };
              }
            );

            if (!isMounted) {
              return;
            }
            setGroups(groups);
            setIsFiltered(false);

            // No seleccionar automáticamente ningún sticker - el usuario debe elegir conscientemente
          } else {
            throw new Error('Error al cargar stickers');
          }
        }
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStickers();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specificStickerId, filterSimilar, excludeStickerId]);

  const handleStickerToggle = (stickerId: string) => {
    const newSelection = selectedStickers.includes(stickerId)
      ? selectedStickers.filter((id) => id !== stickerId)
      : [...selectedStickers, stickerId];

    onSelectionChange(newSelection);
  };

  const handleGroupToggle = (group: StickerGroup) => {
    const groupStickerIds = group.stickers.map((s) => s.id);
    const allGroupSelected = groupStickerIds.every((id) =>
      selectedStickers.includes(id)
    );

    if (allGroupSelected) {
      // Deseleccionar todo el grupo
      const newSelection = selectedStickers.filter(
        (id) => !groupStickerIds.includes(id)
      );
      onSelectionChange(newSelection);
    } else {
      // Seleccionar todo el grupo
      const newSelection = [
        ...new Set([...selectedStickers, ...groupStickerIds]),
      ];
      onSelectionChange(newSelection);
    }
  };

  const handleSelectAll = () => {
    const allStickerIds = groups.flatMap((group) =>
      group.stickers.map((s) => s.id)
    );
    onSelectionChange(allStickerIds);
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  const formatProfileSummary = (summary: ProfileSummary | null) => {
    if (!summary) {
      return 'Perfil vacío';
    }

    const items = [];
    if (summary.bloodType) {
      items.push(`🩸 ${summary.bloodType}`);
    }
    if (summary.hasAllergies) {
      items.push('🚫 Alergias');
    }
    if (summary.hasConditions) {
      items.push('⚕️ Condiciones');
    }
    if (summary.hasMedications) {
      items.push('💊 Medicamentos');
    }
    if (summary.hasInsurance) {
      items.push('🏥 Seguro');
    }
    if (summary.organDonor === true) {
      items.push('❤️ Donante');
    }
    if (summary.organDonor === false) {
      items.push('🚫 No donante');
    }

    return items.length > 0 ? items.join(' • ') : 'Perfil básico';
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-48 mb-4" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-48 mb-3" />
                <div className="space-y-2">
                  {[1, 2].map((j) => (
                    <div key={j} className="h-12 bg-gray-50 rounded" />
                  ))}
                </div>
              </div>
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

  if (groups.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-gray-500 text-sm">
          {isFiltered
            ? 'No se encontraron stickers con información médica similar.'
            : 'No tienes stickers aún.'}
        </div>
      </div>
    );
  }

  const totalStickers = groups.reduce((sum, group) => sum + group.count, 0);
  const selectedCount = selectedStickers.length;

  return (
    <div className={className}>
      {showTitle && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Selecciona los stickers que quieres actualizar
          </h3>
          {isFiltered && (
            <p className="text-xs text-blue-600 mb-2">
              ✓ Mostrando solo stickers con información médica similar
            </p>
          )}
        </div>
      )}

      {!specificStickerId && (
        <div className="flex gap-2 text-xs mb-4">
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

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.key} className="border rounded-lg p-4 bg-white">
            {/* Header del grupo */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">{group.name}</h4>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {group.count} sticker{group.count !== 1 ? 's' : ''}
                  </span>
                </div>
                {group.groupSummary && (
                  <p className="text-xs text-gray-600 mt-1">
                    📋 {formatProfileSummary(group.groupSummary)}
                  </p>
                )}
                {!group.hasAnyProfile && (
                  <p className="text-xs text-gray-400 mt-1">
                    ⚠️ Sin perfil médico configurado
                  </p>
                )}
                {group.hasAnyProfile && !group.allHaveProfile && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Solo algunos tienen perfil médico
                  </p>
                )}
              </div>

              {!specificStickerId && group.count > 1 && (
                <button
                  type="button"
                  onClick={() => handleGroupToggle(group)}
                  className="text-xs text-blue-600 hover:text-blue-800 flex-shrink-0"
                >
                  {group.stickers.every((s) => selectedStickers.includes(s.id))
                    ? 'Deseleccionar grupo'
                    : 'Seleccionar grupo'}
                </button>
              )}
            </div>

            {/* Stickers del grupo */}
            <div className="space-y-2">
              {group.stickers.map((sticker) => (
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
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {sticker.name}
                          </p>
                          <p className="text-xs text-gray-500 mb-1">
                            🏳️ {sticker.flagCode} • 📅{' '}
                            {new Date(sticker.createdAt).toLocaleDateString(
                              'es-ES',
                              {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              }
                            )}
                          </p>
                          {sticker.hasProfile ? (
                            <div className="text-xs text-green-600">
                              ✅ {formatProfileSummary(sticker.profileSummary)}
                            </div>
                          ) : (
                            <div className="text-xs text-amber-600">
                              ⚠️ Sin información médica
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-gray-600">
        {selectedCount} de {totalStickers} stickers seleccionados
        {isFiltered && (
          <span className="text-blue-600 ml-2">
            (filtrados por similitud médica)
          </span>
        )}
      </div>
    </div>
  );
}
