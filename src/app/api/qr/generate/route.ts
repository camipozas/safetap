import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

// Mark this route as dynamic to prevent static rendering
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    const format = searchParams.get('format') || 'png';
    const size = parseInt(searchParams.get('size') || '512');
    const dpi = parseInt(searchParams.get('dpi') || '300');

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Validate format
    if (!['png', 'svg'].includes(format)) {
      return NextResponse.json(
        { error: 'Format must be png or svg' },
        { status: 400 }
      );
    }

    // Calculate high-resolution size for printing
    const printSize = Math.round((size / 96) * dpi);

    if (format === 'svg') {
      // Generate SVG
      const svgString = await QRCode.toString(url, {
        type: 'svg',
        width: printSize,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H', // High error correction for printing
      });

      return new NextResponse(svgString, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': `attachment; filename="SafeTap-qr-${Date.now()}.svg"`,
        },
      });
    } else {
      // Generate PNG
      const buffer = await QRCode.toBuffer(url, {
        width: printSize,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H', // High error correction for printing
      });

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="SafeTap-qr-${Date.now()}.png"`,
        },
      });
    }
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
