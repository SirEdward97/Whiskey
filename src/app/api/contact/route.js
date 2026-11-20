import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';
import { sendContactEmail } from '@/lib/mailer';

export const runtime = 'nodejs';

const STORAGE_DIR = path.resolve(process.cwd(), 'data');
const STORAGE_FILE = path.join(STORAGE_DIR, 'inquiries.json');
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function readInquiries() {
  try {
    const raw = await fs.readFile(STORAGE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveInquiry(inquiry) {
  try {
    const existing = await readInquiries();
    existing.unshift(inquiry);
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    await fs.writeFile(STORAGE_FILE, JSON.stringify(existing, null, 2), 'utf-8');
  } catch (err) {
    console.warn('No se pudo guardar el respaldo local del encargo:', err?.message || err);
  }
}

export async function GET() {
  const inquiries = await readInquiries();
  return NextResponse.json({
    total: inquiries.length,
    inquiries,
  });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo JSON inválido.' }, { status: 400 });
  }

  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const stack = typeof body?.stack === 'string' ? body.stack.trim() : '';
  const message = typeof body?.message === 'string' ? body.message.trim() : '';

  if (name.length < 2 || name.length > 120) {
    return NextResponse.json(
      { error: 'Ingresa un nombre válido (entre 2 y 120 caracteres).' },
      { status: 400 }
    );
  }

  if (!email || email.length > 180 || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: 'Ingresa un correo electrónico válido para poder responderte.' },
      { status: 400 }
    );
  }

  if (!stack || stack.length > 160) {
    return NextResponse.json(
      { error: 'Selecciona el área principal del proyecto.' },
      { status: 400 }
    );
  }

  if (message.length < 5 || message.length > 2000) {
    return NextResponse.json(
      { error: 'Cuéntame un poco más sobre tu proyecto (mín. 5 caracteres).' },
      { status: 400 }
    );
  }

  const createdAt = new Date().toISOString();
  const summary = `Hola Edwar (@SirEdward97), soy ${name} (${email}). Área: ${stack}. Objetivo: ${message}`;
  const inquiry = {
    id: randomUUID(),
    name,
    email,
    stack,
    message,
    summary,
    createdAt,
  };

  let mailInfo;
  try {
    mailInfo = await sendContactEmail({
      name,
      email,
      stack,
      message,
      createdAt,
    });
  } catch (err) {
    console.error('Error al enviar correo por Gmail:', err);

    if (err?.code === 'MAIL_NOT_CONFIGURED') {
      return NextResponse.json(
        {
          error:
            'El envío por Gmail no está configurado aún (agrega GUSER y GPASS en .env.local).',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error:
          'No se pudo enviar el correo por Gmail. Verifica GUSER y la contraseña de aplicación GPASS.',
      },
      { status: 502 }
    );
  }

  await saveInquiry(inquiry);

  return NextResponse.json(
    {
      ok: true,
      message: 'Mensaje enviado correctamente a mi correo.',
      messageId: mailInfo?.messageId || null,
      summary,
      inquiry,
    },
    { status: 201 }
  );
}
