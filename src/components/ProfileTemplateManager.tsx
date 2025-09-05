'use client';

import { useEffect, useState } from 'react';

interface ProfileTemplate {
  id: string;
  bloodType?: string;
  allergies?: string[];
  conditions?: string[];
  medications?: string[];
  notes?: string;
  language?: string;
  organDonor?: boolean;
  insurance?: Record<string, unknown>;
  consentPublic?: boolean;
  contacts?: Array<{
    id: string;
    name: string;
    relation: string;
    phone: string;
    country?: string;
    preferred: boolean;
  }>;
}

interface ProfileTemplateManagerProps {
  onTemplateApply: (profileData: ProfileTemplate) => void;
  showTitle?: boolean;
}

export default function ProfileTemplateManager({
  onTemplateApply,
  showTitle = true,
}: ProfileTemplateManagerProps) {
  const [templates, setTemplates] = useState<ProfileTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    if (showTemplates) {
      loadTemplates();
    }
  }, [showTemplates]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/profile/templates');
      if (response.ok) {
        const data = await response.json();
        // Solo mostrar templates si existe un perfil de emergencia
        if (data.emergencyProfile) {
          setTemplates([data.emergencyProfile]);
        } else {
          setTemplates([]);
        }
      }
    } catch (error) {
      console.error('Error loading profile templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = (template: ProfileTemplate) => {
    onTemplateApply(template);
    setShowTemplates(false);
  };

  if (templates.length === 0 && !showTemplates) {
    return null;
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Copiar información de otro perfil
          </h3>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className="inline-flex items-center px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
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
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          {showTemplates ? 'Ocultar perfiles' : 'Copiar de perfil existente'}
        </button>
      </div>

      {/* Templates Panel */}
      {showTemplates && (
        <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
          <h4 className="font-semibold text-purple-900 mb-4">
            Perfiles guardados
          </h4>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
              <p className="text-sm text-purple-600 mt-2">
                Cargando perfiles...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      className="bg-white rounded-lg p-4 border border-purple-200 hover:border-purple-400 transition-colors text-left w-full"
                      onClick={() => handleApplyTemplate(template)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-sm text-gray-900 truncate">
                          Perfil médico actual
                        </h5>
                        <svg
                          className="w-4 h-4 text-purple-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        {template.bloodType && (
                          <p className="text-xs text-gray-600">
                            Tipo sangre: {template.bloodType}
                          </p>
                        )}
                        {template.contacts && template.contacts.length > 0 && (
                          <p className="text-xs text-gray-600">
                            {template.contacts.length} contacto(s) de emergencia
                          </p>
                        )}
                        {(template.allergies?.length ||
                          template.conditions?.length ||
                          template.medications?.length) && (
                          <p className="text-xs text-gray-600">
                            Información médica disponible
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-purple-600 text-sm">
                    No tienes perfiles guardados aún.
                  </p>
                  <p className="text-purple-500 text-xs mt-1">
                    Crea tu primer perfil y podrás copiarlo después.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 p-3 bg-purple-100 rounded-lg">
            <div className="flex items-start">
              <svg
                className="w-4 h-4 text-purple-600 mr-2 mt-0.5"
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
                <p className="text-xs text-purple-800 font-medium">
                  Copiar información
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  Al seleccionar un perfil, se copiará toda la información
                  médica y contactos de emergencia. Podrás editarlos después si
                  necesitas hacer cambios.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
