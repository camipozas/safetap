import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// ⚠️ SOLO PARA TESTING - REMOVER EN PRODUCCIÓN
export async function POST(req: Request) {
  // Endpoint only available in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Test endpoint not available in production' }, { status: 403 });
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Configuración del transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: 'camila@safetap.cl',
        pass: process.env.EMAIL_PASSWORD || 'uamyrbelnpmjkyjn',
      },
      secure: false,
      tls: {
        rejectUnauthorized: false
      },
    });

    // Test de conexión
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    // Envío de email de prueba
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Safetap <no-reply@safetap.cl>',
      to: email,
      subject: '🧪 Test de email - SafeTap',
      text: 'Este es un email de prueba desde SafeTap. Si recibes este mensaje, la configuración de email está funcionando correctamente.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #3b82f6;">🧪 Test de Email - SafeTap</h1>
          <p>¡Excelente! Este es un email de prueba desde SafeTap.</p>
          <p>Si recibes este mensaje, significa que:</p>
          <ul>
            <li>✅ La configuración SMTP está correcta</li>
            <li>✅ Las credenciales funcionan</li>
            <li>✅ Los emails pueden enviarse desde la aplicación</li>
          </ul>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Enviado el: ${new Date().toLocaleString('es-CL')}
          </p>
        </div>
      `,
    });

    console.log('✅ Test email sent:', result.messageId);

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: `Email de prueba enviado a ${email}`,
    });

  } catch (error: any) {
    console.error('❌ Email test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.code || 'Unknown error',
    }, { status: 500 });
  }
}
