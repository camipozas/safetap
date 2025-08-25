'use client';

import { AlertTriangle, Heart, Phone, Shield, User } from 'lucide-react';

interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  country: string | null;
  preferred: boolean;
}

interface EmergencyProfileData {
  id: string;
  bloodType?: string | null;
  allergies: string[];
  conditions: string[];
  medications: string[];
  notes?: string | null;
  language?: string | null;
  organDonor?: boolean | null;
  contacts: EmergencyContact[];
  user: {
    name?: string | null;
    email?: string | null;
    country?: string | null;
  };
  sticker?: {
    slug: string;
    status: string;
    payments?: {
      id: string;
      status: string;
      amountCents: number;
      createdAt: Date;
    }[];
  } | null;
}

interface EmergencyProfileDisplayProps {
  profile: EmergencyProfileData;
  showSafeTapId?: boolean;
  isDemoMode?: boolean;
}

export function EmergencyProfileDisplay({
  profile,
  showSafeTapId = false,
  isDemoMode = false,
}: EmergencyProfileDisplayProps) {
  const userName =
    profile.user.name ?? profile.user.email?.split('@')[0] ?? 'Usuario';

  return (
    <div className="max-w-2xl mx-auto bg-gray-50 min-h-screen">
      {/* Demo banner for demo mode */}
      {isDemoMode && (
        <div className="bg-blue-100 border-b-2 border-blue-300 p-4 text-center">
          <p className="text-blue-800 text-sm font-semibold">
            🔵 <strong>Ejemplo de perfil SafeTap</strong>
          </p>
          <p className="text-blue-700 text-sm mb-3">
            Este es un ejemplo de cómo se ve la información de emergencia cuando
            alguien escanea tu código QR.
          </p>
          <a
            href="/buy"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Conseguir mi SafeTap
          </a>
        </div>
      )}

      {/* Emergency Header */}
      <div className="bg-red-100 border-b-2 border-red-300 p-6">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="h-6 w-6 text-red-700" />
          <div>
            <h1 className="text-xl font-bold text-red-900">
              Información de Emergencia
            </h1>
            <p className="text-red-700 text-sm">
              Perfil médico de emergencia - SafeTap
            </p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="bg-white p-6 border-b border-gray-300 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">{userName}</h2>
          {profile.user.country && (
            <span className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded">
              {profile.user.country}
            </span>
          )}
          {profile.language && (
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
              {profile.language.toUpperCase()}
            </span>
          )}
        </div>
        {showSafeTapId && profile.sticker?.slug && (
          <p className="text-xs text-gray-500">
            SafeTap ID: {profile.sticker.slug}
          </p>
        )}
      </div>

      {/* Medical Information */}
      <div className="bg-white p-6 border-b border-gray-300 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Información Médica
          </h3>
        </div>

        <div className="space-y-4">
          {/* Blood Type and Organ Donor in a row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.bloodType && (
              <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 shadow-sm">
                <h4 className="font-bold text-red-900 mb-1">Tipo de Sangre</h4>
                <p className="text-red-800 text-xl font-bold">
                  {profile.bloodType}
                </p>
              </div>
            )}

            {profile.organDonor && (
              <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 shadow-sm">
                <h4 className="font-bold text-green-900 mb-1">
                  Donante de Órganos
                </h4>
                <p className="text-green-800 font-bold text-lg">✓ Sí</p>
              </div>
            )}
          </div>

          {/* Allergies */}
          {profile.allergies.length > 0 && (
            <div className="bg-yellow-100 border-2 border-yellow-300 rounded-lg p-4 shadow-sm">
              <h4 className="font-bold text-yellow-900 mb-2">⚠️ Alergias</h4>
              <ul className="text-yellow-800 space-y-1">
                {profile.allergies.map((allergy, index) => (
                  <li key={index} className="font-medium">
                    • {allergy}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Medical Conditions */}
          {profile.conditions.length > 0 && (
            <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4 shadow-sm">
              <h4 className="font-bold text-blue-900 mb-2">
                🏥 Condiciones Médicas
              </h4>
              <ul className="text-blue-800 space-y-1">
                {profile.conditions.map((condition, index) => (
                  <li key={index} className="font-medium">
                    • {condition}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Medications */}
          {profile.medications.length > 0 && (
            <div className="bg-purple-100 border-2 border-purple-300 rounded-lg p-4 shadow-sm">
              <h4 className="font-bold text-purple-900 mb-2">
                💊 Medicamentos
              </h4>
              <ul className="text-purple-800 space-y-1">
                {profile.medications.map((medication, index) => (
                  <li key={index} className="font-medium">
                    • {medication}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          {profile.notes && (
            <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-2">
                📝 Notas Importantes
              </h4>
              <p className="text-gray-800 font-medium">{profile.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Contacts */}
      <div className="bg-white p-6 border-b border-gray-300 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            Contactos de Emergencia
          </h3>
        </div>

        {profile.contacts.length > 0 ? (
          <div className="space-y-3">
            {profile.contacts.map((contact) => (
              <div
                key={contact.id}
                className={`rounded-lg border-2 p-4 shadow-sm ${
                  contact.preferred
                    ? 'bg-blue-100 border-blue-300'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900">{contact.name}</p>
                      {contact.preferred && (
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-medium">
                          Preferido
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 font-medium mb-1">
                      {contact.relation}
                    </p>
                    <p className="text-sm font-mono text-gray-900 font-bold bg-white px-2 py-1 rounded border">
                      {contact.phone}
                    </p>
                    {contact.country && (
                      <p className="text-xs text-gray-600 mt-1">
                        {contact.country}
                      </p>
                    )}
                  </div>

                  <a
                    href={`tel:${contact.phone}`}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-bold transition-colors flex items-center gap-2 shadow-md"
                    aria-label={`Llamar a ${contact.name}`}
                  >
                    <Phone className="h-4 w-4" />
                    Llamar
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-100 border-2 border-dashed border-gray-400 rounded-lg p-4">
            <p className="text-gray-700 text-center font-medium">
              No hay contactos de emergencia configurados
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t-2 border-gray-300 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-gray-500" />
          <p className="text-sm font-bold text-gray-700">SafeTap</p>
        </div>

        <div className="text-xs text-gray-700 space-y-1 font-medium">
          <p>
            <strong>Información importante:</strong>
          </p>
          <p>• Esta información es proporcionada por el usuario</p>
          <p>• No sustituye atención médica profesional</p>
          <p>
            • En caso de emergencia, contacte inmediatamente al{' '}
            <strong className="text-red-600">131 (Ambulancia)</strong>
          </p>
          <p>• Acceso registrado para seguridad del usuario</p>
        </div>
      </div>
    </div>
  );
}
