import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // For now, redirect to our favicon which is reliable
  // Later we can implement actual image generation
  const faviconUrl = `${request.nextUrl.origin}/favicon.svg`;

  return NextResponse.redirect(faviconUrl);
}

export const dynamic = 'force-dynamic';
