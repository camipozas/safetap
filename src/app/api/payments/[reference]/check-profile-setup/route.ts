import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const reference = resolvedParams.reference;

    // Find the payment with the given reference
    const payment = await prisma.payment.findFirst({
      where: {
        reference,
        User: {
          email: session.user.email,
        },
      },
      include: {
        Sticker: {
          include: {
            EmergencyProfile: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check if we should redirect to edit profile
    const shouldRedirectToEdit =
      payment.status === 'PENDING' && // Payment is still pending
      payment.Sticker && // Has a sticker
      !payment.Sticker.EmergencyProfile; // No emergency profile exists yet

    return NextResponse.json({
      shouldRedirectToEdit,
      stickerId: payment.Sticker?.id || null,
      paymentStatus: payment.status,
      hasEmergencyProfile: !!payment.Sticker?.EmergencyProfile,
    });
  } catch (error) {
    console.error('Error checking profile setup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
