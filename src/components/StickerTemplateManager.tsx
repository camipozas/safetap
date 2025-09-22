'use client';

import { useEffect, useState } from 'react';

import { StickerCustomization } from '@/components/StickerCustomizerNew';

interface Template {
  id: string;
  name: string;
  nameOnSticker: string;
  flagCode: string;
  colorPresetId: string;
  stickerColor: string;
  textColor: string;
  isTemplate: boolean;
}

interface StickerTemplateManagerProps {
  onTemplateApply: (customization: StickerCustomization) => void;
  onSaveAsTemplate?: (
    customization: StickerCustomization,
    name: string
  ) => void;
  currentCustomization?: StickerCustomization;
  showSaveOption?: boolean;
}

export default function StickerTemplateManager({
  onTemplateApply,
  onSaveAsTemplate,
  currentCustomization,
  showSaveOption = false,
}: StickerTemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasTemplates, setHasTemplates] = useState<boolean | null>(null);

  // Verify if there are templates available when the component is mounted
  useEffect(() => {
    checkTemplatesAvailability();
  }, []);

  useEffect(() => {
    if (showTemplates) {
      loadTemplates();
    }
  }, [showTemplates]);

  const checkTemplatesAvailability = async () => {
    try {
      const response = await fetch('/api/profile/templates');
      if (response.ok) {
        const data = await response.json();
        const allTemplates = [
          ...(data.stickerTemplates || []),
          ...(data.stickerDesigns || []),
        ];
        setHasTemplates(allTemplates.length > 0);
      } else {
        setHasTemplates(false);
      }
    } catch (error) {
      console.error('Error checking templates availability:', error);
      setHasTemplates(false);
    }
  };

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/profile/templates');
      if (response.ok) {
        const data = await response.json();
        // Combine existing sticker templates and saved designs
        const allTemplates = [
          ...(data.stickerTemplates || []),
          ...(data.stickerDesigns || []),
        ];
        setTemplates(allTemplates);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = (template: Template) => {
    const customization: StickerCustomization = {
      name: template.nameOnSticker,
      flagCode: template.flagCode,
      colorPresetId: template.colorPresetId,
      stickerColor: template.stickerColor,
      textColor: template.textColor,
    };
    onTemplateApply(customization);
    setShowTemplates(false);
  };

  const handleSaveTemplate = async () => {
    if (!currentCustomization || !templateName.trim()) {
      setSaveError('Por favor ingresa un nombre para la plantilla');
      return;
    }

    try {
      setSaveError(null);
      const response = await fetch('/api/profile/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName.trim(),
          nameOnSticker: currentCustomization.name,
          flagCode: currentCustomization.flagCode,
          colorPresetId: currentCustomization.colorPresetId,
          stickerColor: currentCustomization.stickerColor,
          textColor: currentCustomization.textColor,
          isTemplate: true,
        }),
      });

      if (response.ok) {
        setShowSaveDialog(false);
        setTemplateName('');
        onSaveAsTemplate?.(currentCustomization, templateName.trim());
        await checkTemplatesAvailability();
        loadTemplates();
      } else {
        setSaveError('Error al guardar la plantilla');
      }
    } catch {
      setSaveError('Error al guardar la plantilla');
    }
  };

  // No show anything if there are no templates available and the save option is not shown
  if (hasTemplates === false && !showSaveOption) {
    return null;
  }

  // Show loading indicator while checking the availability of templates
  if (hasTemplates === null) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {hasTemplates && (
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            {showTemplates ? 'Ocultar plantillas' : 'Usar plantilla existente'}
          </button>
        )}

        {showSaveOption && currentCustomization && (
          <button
            type="button"
            onClick={() => setShowSaveDialog(true)}
            className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
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
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
            Guardar como plantilla
          </button>
        )}
      </div>

      {/* Templates Panel */}
      {showTemplates && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">
            Plantillas y perfiles guardados
          </h3>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              <p className="text-sm text-gray-600 mt-2">
                Cargando plantillas...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Saved Templates */}
              {templates.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Plantillas guardadas
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors text-left w-full"
                        onClick={() => handleApplyTemplate(template)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-sm text-gray-900 truncate">
                            {template.name}
                          </h5>
                          <div className="flex items-center gap-1">
                            <div
                              className="w-3 h-3 rounded border border-gray-300"
                              style={{ backgroundColor: template.stickerColor }}
                            />
                            <div
                              className="w-3 h-3 rounded border border-gray-300"
                              style={{ backgroundColor: template.textColor }}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          {template.nameOnSticker} • {template.flagCode}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {templates.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600 text-sm">
                    No tienes plantillas o perfiles guardados aún.
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    Crea tu primer sticker y guárdalo como plantilla para usarlo
                    después.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Save Template Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Guardar como plantilla
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="template-name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nombre de la plantilla
                </label>
                <input
                  id="template-name"
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Ej: Mi diseño favorito"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {saveError && <p className="text-red-600 text-sm">{saveError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSaveDialog(false);
                    setTemplateName('');
                    setSaveError(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
