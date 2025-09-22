import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { USER_ROLES } from '@/types/shared';
import { PaymentStatus, PrismaClient, StickerStatus } from '@prisma/client';

// Create a direct Accelerate client to avoid any local caching
const accelerateClient = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL, // This ensures we use the Accelerate URL
});

import {
  Calendar,
  CreditCard,
  Globe,
  Shield,
  Sticker,
  User,
  Users,
} from 'lucide-react';
import Link from 'next/link';

async function getUserDetails(userId: string) {
  return await accelerateClient.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          Sticker: true,
          Payment: true,
        },
      },
      Payment: {
        where: {
          status: PaymentStatus.VERIFIED,
        },
        select: {
          amount: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      },
      Sticker: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          slug: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      },
      EmergencyProfile: {
        include: {
          EmergencyContact: {
            select: {
              id: true,
              name: true,
              relation: true,
              phone: true,
              preferred: true,
            },
          },
        },
        take: 1,
      },
    },
  });
}

export default async function UserDetailsPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const user = await getUserDetails(params.id);

  if (!user) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Usuario no encontrado
          </h1>
          <p className="text-gray-600 mt-2">
            El usuario que buscas no existe o ha sido eliminado.
          </p>
        </div>
        <Link href="/dashboard/users">
          <Button variant="outline">← Volver a usuarios</Button>
        </Link>
      </div>
    );
  }

  const profile = user.EmergencyProfile?.[0]; // Get the first profile since it's an array
  const totalSpent = user.Payment.reduce(
    (sum: number, payment: { amount: number }) => sum + payment.amount,
    0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Detalles del Usuario
          </h1>
          <p className="text-gray-600 mt-2">
            Información completa de {user.name || user.email}
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href={`/dashboard/users/${user.id}/contacts`}>
            <Button variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Gestionar Contactos
            </Button>
          </Link>
          <Link href="/dashboard/users">
            <Button variant="outline">← Volver a usuarios</Button>
          </Link>
        </div>
      </div>

      {/* User Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Nombre
              </label>
              <div className="mt-1 text-sm text-gray-900">
                {user.name || 'Sin nombre'}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 text-sm text-gray-900">{user.email}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Globe className="w-4 h-4 mr-1" />
                País
              </label>
              <div className="mt-1 text-sm text-gray-900">
                {user.country || 'No especificado'}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Shield className="w-4 h-4 mr-1" />
                Rol
              </label>
              <div className="mt-1">
                <span
                  className={`inline-block px-2 py-1 text-xs rounded-full ${
                    user.role === USER_ROLES.ADMIN
                      ? 'bg-blue-100 text-blue-800'
                      : user.role === USER_ROLES.SUPER_ADMIN
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {user.role}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Registro
              </label>
              <div className="mt-1 text-sm text-gray-900">
                {formatDateTime(user.createdAt)}
              </div>
            </div>
            {profile?.bloodType && (
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Grupo Sanguíneo
                </label>
                <div className="mt-1 text-sm font-medium text-red-600">
                  🩸 {profile.bloodType}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center text-center">
              <div className="text-center">
                <Sticker className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">Stickers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {user._count.Sticker}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center text-center">
              <div className="text-center">
                <CreditCard className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">Pagos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {user._count.Payment}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center text-center">
              <div className="text-center">
                <CreditCard className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">
                  Total Gastado
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalSpent)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center text-center">
              <div className="text-center">
                <Users className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">Contactos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {profile?.EmergencyContact?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Stickers */}
        <Card>
          <CardHeader>
            <CardTitle>Stickers Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {user.Sticker.length > 0 ? (
              <div className="space-y-3">
                {user.Sticker.map(
                  (sticker: {
                    id: string;
                    slug: string;
                    createdAt: Date;
                    status: string;
                  }) => (
                    <div
                      key={sticker.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-sm">
                          #{sticker.slug}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDateTime(sticker.createdAt)}
                        </div>
                      </div>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          sticker.status === StickerStatus.ACTIVE
                            ? 'bg-green-100 text-green-800'
                            : sticker.status === StickerStatus.PAID
                              ? 'bg-blue-100 text-blue-800'
                              : sticker.status === StickerStatus.SHIPPED
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {sticker.status}
                      </span>
                    </div>
                  )
                )}
                {user._count.Sticker > 5 && (
                  <div className="text-center">
                    <Link
                      href="/dashboard/orders"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Ver todos los stickers ({user._count.Sticker})
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Sticker className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No hay stickers registrados</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Pagos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {user.Payment.length > 0 ? (
              <div className="space-y-3">
                {user.Payment.map(
                  (
                    payment: { amount: number; createdAt: Date },
                    index: number
                  ) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-sm text-green-600">
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDateTime(payment.createdAt)}
                        </div>
                      </div>
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        {PaymentStatus.VERIFIED}
                      </span>
                    </div>
                  )
                )}
                {user._count.Payment > 5 && (
                  <div className="text-center">
                    <Link
                      href="/dashboard/orders"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Ver todos los pagos ({user._count.Payment})
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No hay pagos registrados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Emergency Contacts Summary */}
      {profile?.EmergencyContact && profile.EmergencyContact.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Contactos de Emergencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.EmergencyContact.slice(0, 3).map(
                (contact: {
                  id: string;
                  name: string;
                  relation: string;
                  phone: string;
                  preferred: boolean;
                }) => (
                  <div key={contact.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{contact.name}</div>
                      {contact.preferred && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Preferido
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {contact.relation}
                    </div>
                    <div className="text-sm text-gray-600">{contact.phone}</div>
                  </div>
                )
              )}
            </div>
            {profile.EmergencyContact.length > 3 && (
              <div className="mt-4 text-center">
                <Link href={`/dashboard/users/${user.id}/contacts`}>
                  <Button variant="outline" size="sm">
                    Ver todos los contactos ({profile.EmergencyContact.length})
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
