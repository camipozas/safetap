import {
  AlertTriangle,
  ChevronLeft,
  Edit3,
  FileText,
  Heart,
  Mail,
  MapPin,
  Phone,
  Pill,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PrismaClient } from '@prisma/client';

// Create a direct Accelerate client to avoid any local caching
const accelerateClient = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL, // This ensures we use the Accelerate URL
});

interface ProfileViewPageProps {
  params: Promise<{ id: string }>;
}

interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  preferred: boolean;
}

export default async function ProfileViewPage({
  params,
}: ProfileViewPageProps) {
  const { id } = await params;

  const user = await accelerateClient.user.findUnique({
    where: { id },
    include: {
      Sticker: true,
      EmergencyProfile: {
        include: {
          EmergencyContact: {
            orderBy: [{ preferred: 'desc' }, { createdAt: 'asc' }],
          },
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const profile = user.EmergencyProfile?.[0]; // Tomar el primer perfil
  const sticker = user.Sticker?.[0]; // Tomar el primer sticker

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/dashboard/orders"
            className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Volver a órdenes
          </Link>
          {profile && (
            <Link
              href={`/dashboard/users/${id}/edit-profile`}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Editar perfil
            </Link>
          )}
        </div>

        <article className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header with emergency indicator */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500 text-white rounded-full mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              🚨 INFORMACIÓN DE EMERGENCIA
            </h1>
            <div className="text-lg text-slate-700 mb-4">
              {user.name || user.email?.split('@')[0]}
              <span className="ml-2 text-sm bg-slate-200 text-slate-700 px-2 py-1 rounded">
                {user.country || 'No especificado'}
              </span>
            </div>
            {sticker && (
              <p className="text-sm text-slate-600">
                SafeTap ID: {sticker.slug}
              </p>
            )}
          </div>

          {profile ? (
            <div className="space-y-6">
              {/* Medical Information */}
              {profile.bloodType && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Heart className="w-5 h-5 text-red-600 mr-2" />
                    <h3 className="text-lg font-semibold text-red-900">
                      Tipo de sangre
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-red-700">
                    🩸 {profile.bloodType}
                  </p>
                </div>
              )}

              {/* Allergies */}
              {profile.allergies && profile.allergies.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
                    <h3 className="text-lg font-semibold text-orange-900">
                      Alergias
                    </h3>
                  </div>
                  <ul className="space-y-1">
                    {profile.allergies.map((allergy: string, index: number) => (
                      <li
                        key={index}
                        className="text-orange-800 flex items-center"
                      >
                        <span className="w-2 h-2 bg-orange-400 rounded-full mr-2"></span>
                        {allergy}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Medical Conditions */}
              {profile.conditions && profile.conditions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Heart className="w-5 h-5 text-blue-600 mr-2" />
                    <h3 className="text-lg font-semibold text-blue-900">
                      Condiciones médicas
                    </h3>
                  </div>
                  <ul className="space-y-1">
                    {profile.conditions.map(
                      (condition: string, index: number) => (
                        <li
                          key={index}
                          className="text-blue-800 flex items-center"
                        >
                          <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                          {condition}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {/* Medications */}
              {profile.medications && profile.medications.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Pill className="w-5 h-5 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold text-green-900">
                      Medicamentos
                    </h3>
                  </div>
                  <ul className="space-y-1">
                    {profile.medications.map(
                      (medication: string, index: number) => (
                        <li
                          key={index}
                          className="text-green-800 flex items-center"
                        >
                          <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                          {medication}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {/* Additional Notes */}
              {profile.notes && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <FileText className="w-5 h-5 text-purple-600 mr-2" />
                    <h3 className="text-lg font-semibold text-purple-900">
                      Notas adicionales
                    </h3>
                  </div>
                  <p className="text-purple-800 whitespace-pre-wrap">
                    {profile.notes}
                  </p>
                </div>
              )}

              {/* Emergency Contacts */}
              {profile.EmergencyContact &&
                profile.EmergencyContact.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <Phone className="w-5 h-5 text-slate-600 mr-2" />
                      <h3 className="text-lg font-semibold text-slate-900">
                        Contactos de emergencia
                      </h3>
                    </div>
                    <div className="grid gap-3">
                      {profile.EmergencyContact.map(
                        (contact: EmergencyContact) => (
                          <div
                            key={contact.id}
                            className={`p-3 rounded-lg border ${
                              contact.preferred
                                ? 'bg-yellow-50 border-yellow-200'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center">
                                  <h4 className="font-semibold text-slate-900">
                                    {contact.name}
                                  </h4>
                                  {contact.preferred && (
                                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                      Preferido
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-600 capitalize">
                                  {contact.relation}
                                </p>
                              </div>
                              <a
                                href={`tel:${contact.phone}`}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
                              >
                                <Phone className="w-4 h-4 mr-2" />
                                {contact.phone}
                              </a>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* User Information */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Información del usuario
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-gray-700">{user.email}</span>
                  </div>
                  {user.country && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="text-gray-700">{user.country}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <AlertTriangle className="w-16 h-16 mx-auto" />
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Perfil de emergencia no configurado
              </h2>
              <p className="text-gray-600 mb-4">
                Este usuario aún no ha completado su información de emergencia.
              </p>
              <Link
                href={`/dashboard/users/${id}/edit-profile`}
                className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Crear perfil de emergencia
              </Link>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
