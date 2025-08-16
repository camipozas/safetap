import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET() {
  try {
    // Create transporter with same config as NextAuth
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

    // Only test connection, don't send emails
    await transporter.verify();
    
    return NextResponse.json({
      success: true,
      message: 'SMTP connection verified successfully',
      config: {
        host: 'smtp.gmail.com',
        port: 587,
        user: 'camila@safetap.cl',
        hasPassword: !!process.env.EMAIL_PASSWORD,
      }
    });

  } catch (error: any) {
    console.error('❌ SMTP connection failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      code: error.code,
      config: {
        host: 'smtp.gmail.com',
        port: 587,
        user: 'camila@safetap.cl',
        hasPassword: !!process.env.EMAIL_PASSWORD,
      }
    }, { status: 500 });
  }
}
