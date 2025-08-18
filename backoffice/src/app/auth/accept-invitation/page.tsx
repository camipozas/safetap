'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2, Shield, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

interface InvitationData {
  email: string;
  role: string;
  expiresAt: string;
  isValid: boolean;
}

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    console.log(
      '🔍 Accept invitation page loaded with token:',
      token ? 'present' : 'missing'
    );
    if (!token) {
      console.log('❌ No token provided in URL');
      setError('Token de invitación no válido');
      setLoading(false);
      return;
    }

    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    console.log(
      '🔍 Validating invitation token:',
      token?.substring(0, 8) + '...'
    );
    try {
      const response = await fetch(
        `/api/admin/invitations/validate?token=${token}`
      );
      const data = await response.json();
      console.log('📥 Validation response:', {
        status: response.status,
        isValid: data.isValid,
        hasInvitation: !!data.invitation,
      });

      if (response.ok && data.isValid) {
        console.log('✅ Invitation is valid:', data.invitation.email);
        setInvitation(data.invitation);
      } else {
        console.log('❌ Invitation validation failed:', data.error);
        setError(data.error || 'Invitación no válida o expirada');
      }
    } catch (error) {
      console.error('❌ Error validating invitation:', error);
      setError('Error al validar la invitación');
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async () => {
    console.log('📝 Starting invitation acceptance process');
    setAccepting(true);
    try {
      const response = await fetch('/api/admin/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      console.log('📥 Accept invitation response:', {
        status: response.status,
        success: response.ok,
      });

      if (response.ok) {
        console.log(
          '✅ Invitation accepted successfully, redirecting to signin'
        );
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/signin?message=invitation_accepted');
        }, 2000);
      } else {
        console.log('❌ Failed to accept invitation:', data.error);
        setError(data.error || 'Error al aceptar la invitación');
      }
    } catch (error) {
      console.error('❌ Error accepting invitation:', error);
      setError('Error al aceptar la invitación');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Validando invitación...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Invitación No Válida</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={() => router.push('/auth/signin')}
              variant="outline"
            >
              Ir a Iniciar Sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle>¡Invitación Aceptada!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Tu cuenta de administrador ha sido creada exitosamente.
            </p>
            <p className="text-sm text-gray-500">
              Serás redirigido al inicio de sesión...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="h-12 w-12 text-safetap-600 mx-auto mb-4" />
          <CardTitle>Invitación de Administrador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              Has sido invitado a ser administrador de SafeTap:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">{invitation?.email}</p>
              <p className="text-sm text-gray-600">
                Rol:{' '}
                {invitation?.role === 'SUPER_ADMIN'
                  ? 'Super Administrador'
                  : 'Administrador'}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Expira:{' '}
                {invitation?.expiresAt
                  ? new Date(invitation.expiresAt).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={acceptInvitation}
              disabled={accepting}
              className="w-full"
            >
              {accepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aceptando...
                </>
              ) : (
                'Aceptar Invitación'
              )}
            </Button>

            <Button
              onClick={() => router.push('/auth/signin')}
              variant="outline"
              className="w-full"
            >
              Cancelar
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>
              Al aceptar, se creará tu cuenta de administrador y podrás acceder
              al panel de administración.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Cargando...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
