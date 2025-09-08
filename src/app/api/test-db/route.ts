import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Test endpoint to verify database operations
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🧪 Testing database operations for user:', session.user.id);

    // Test 1: Verify StickerDesign table exists and can be queried
    console.log('🔍 Testing StickerDesign table...');
    const stickerDesigns = await prisma.stickerDesign.findMany({
      where: { userId: session.user.id },
      take: 5,
    });
    console.log(`✅ Found ${stickerDesigns.length} sticker designs`);

    // Test 2: Verify EmergencyProfile table can be queried with relationships
    console.log('🔍 Testing EmergencyProfile table...');
    const profiles = await prisma.emergencyProfile.findMany({
      where: { userId: session.user.id },
      include: {
        EmergencyContact: true,
        Sticker: {
          select: {
            nameOnSticker: true,
            flagCode: true,
            colorPresetId: true,
            stickerColor: true,
            textColor: true,
          },
        },
      },
      take: 5,
    });
    console.log(`✅ Found ${profiles.length} emergency profiles`);

    // Test 3: Create a test StickerDesign to verify write operations
    console.log('🧪 Testing StickerDesign creation...');
    const testDesign = await prisma.stickerDesign.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        name: 'Test Template - DB Verification',
        nameOnSticker: 'Test User',
        flagCode: 'CL',
        colorPresetId: 'light-gray',
        stickerColor: '#f1f5f9',
        textColor: '#000000',
        isTemplate: true,
        updatedAt: new Date(),
      },
    });
    console.log('✅ Test StickerDesign created:', testDesign.id);

    // Test 4: Read back the created design
    const verifyDesign = await prisma.stickerDesign.findUnique({
      where: { id: testDesign.id },
    });
    console.log('✅ Test StickerDesign verified:', verifyDesign?.name);

    // Clean up: Delete the test design
    await prisma.stickerDesign.delete({
      where: { id: testDesign.id },
    });
    console.log('🧹 Test StickerDesign cleaned up');

    return NextResponse.json({
      success: true,
      message: 'Database operations verified successfully',
      results: {
        stickerDesignsCount: stickerDesigns.length,
        profilesCount: profiles.length,
        testOperationSuccess: true,
      },
      stickerDesigns: stickerDesigns.map((design) => ({
        id: design.id,
        name: design.name,
        isTemplate: design.isTemplate,
        createdAt: design.createdAt,
      })),
      profiles: profiles.map((profile) => ({
        id: profile.id,
        hasSticker: !!profile.Sticker,
        contactsCount: profile.EmergencyContact.length,
        createdAt: profile.createdAt,
      })),
    });
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return NextResponse.json(
      {
        error: 'Database test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
