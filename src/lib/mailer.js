import nodemailer from 'nodemailer';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createTransporter() {
  const user = process.env.GUSER?.trim();
  const pass = process.env.GPASS?.replace(/\s+/g, '');

  if (!user || !pass) {
    const error = new Error(
      'Faltan las variables de entorno GUSER y GPASS en .env.local para enviar correos por Gmail.'
    );
    error.code = 'MAIL_NOT_CONFIGURED';
    throw error;
  }

  return {
    user,
    transporter: nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    }),
  };
}

export async function sendContactEmail({ name, email, stack, message, createdAt }) {
  const { user, transporter } = createTransporter();
  const recipient = process.env.GMAIL_TO?.trim() || user;

  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeStack = escapeHtml(stack);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br />');
  const formattedDate = new Date(createdAt).toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const subject = `Nuevo contacto desde tu portafolio — ${name} (${stack})`;

  const text = [
    'Nuevo mensaje desde tu portafolio web',
    '-------------------------------------',
    `Nombre / Empresa: ${name}`,
    `Correo: ${email}`,
    `Área principal: ${stack}`,
    `Fecha: ${formattedDate}`,
    '',
    'Mensaje:',
    message,
  ].join('\n');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f1a; color: #e6ecf8; padding: 28px; border-radius: 12px; max-width: 620px; margin: 0 auto;">
      <p style="margin: 0 0 8px; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #ff6b3d; font-weight: 600;">
        Portafolio · Nuevo mensaje de contacto
      </p>
      <h2 style="margin: 0 0 20px; font-size: 20px; color: #ffffff;">
        ${safeName} quiere iniciar un proyecto
      </h2>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
        <tr>
          <td style="padding: 8px 0; color: #94a3b8; width: 140px;">Nombre / Empresa</td>
          <td style="padding: 8px 0; color: #f8fafc; font-weight: 600;">${safeName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Correo</td>
          <td style="padding: 8px 0;">
            <a href="mailto:${safeEmail}" style="color: #ff8b66; text-decoration: none;">${safeEmail}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Área principal</td>
          <td style="padding: 8px 0; color: #f8fafc;">${safeStack}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #94a3b8;">Fecha</td>
          <td style="padding: 8px 0; color: #cbd5e1;">${escapeHtml(formattedDate)}</td>
        </tr>
      </table>

      <div style="background: #131a2c; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 16px;">
        <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8;">
          Objetivo del proyecto
        </p>
        <p style="margin: 0; font-size: 14px; line-height: 1.65; color: #e2e8f0;">
          ${safeMessage}
        </p>
      </div>

      <p style="margin: 18px 0 0; font-size: 12px; color: #94a3b8;">
        Puedes responder directamente a este correo para escribirle a ${safeName}.
      </p>
    </div>
  `;

  return transporter.sendMail({
    from: `"Portafolio Web" <${user}>`,
    to: recipient,
    replyTo: email,
    subject,
    text,
    html,
  });
}
