/**
 * Email Service - Resend
 * Servicio centralizado de envío de emails usando Resend.
 * Configura RESEND_API_KEY y EMAIL_FROM en .env
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = process.env.EMAIL_FROM || 'ZURI <noreply@zuri.pe>';

export interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Función genérica de envío de email
 */
export async function sendEmail({
    to,
    subject,
    html,
}: {
    to: string;
    subject: string;
    html: string;
}): Promise<EmailResult> {
    const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to,
        subject,
        html,
    });

    if (error) {
        const msg = error.message ?? JSON.stringify(error);
        console.error(`❌ [Resend] Error enviando email a ${to}:`, msg);
        throw new Error(`Resend error: ${msg}`);
    }

    console.log(`✅ [Resend] Email enviado a ${to}: ${data?.id}`);
    return { success: true, messageId: data?.id };
}

/**
 * Email de verificación de cuenta para conductores
 */
export async function sendVerificationEmail({
    to,
    nombre,
    verificationUrl,
}: {
    to: string;
    nombre: string;
    verificationUrl: string;
}): Promise<EmailResult> {
    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Verifica tu cuenta – ZURI</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">

              <!-- Header -->
              <tr>
                <td style="background-color:#00C8AA;padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">🚗 ZURI</h1>
                  <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Plataforma de Transporte Médico</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:40px 40px 32px;">
                  <p style="margin:0 0 16px;font-size:16px;color:#111827;">Hola, <strong>${nombre}</strong> 👋</p>
                  <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
                    Gracias por registrarte como conductor en <strong>ZURI Transportation</strong>.
                    Para activar tu cuenta y comenzar a recibir servicios, confirma tu dirección de correo haciendo clic en el botón a continuación:
                  </p>

                  <!-- CTA Button -->
                  <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
                    <tr>
                      <td style="border-radius:8px;background-color:#00C8AA;">
                        <a href="${verificationUrl}"
                           target="_blank"
                           style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;border-radius:8px;letter-spacing:0.3px;">
                          ✅ Verificar mi cuenta
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
                    Si el botón no funciona, copia y pega este enlace en tu navegador:
                  </p>
                  <p style="margin:0 0 24px;font-size:12px;color:#9ca3af;word-break:break-all;">
                    <a href="${verificationUrl}" style="color:#00C8AA;">${verificationUrl}</a>
                  </p>

                  <!-- Expiry note -->
                  <div style="background:#f0fdf4;border-left:4px solid #00C8AA;border-radius:4px;padding:12px 16px;margin:0 0 24px;">
                    <p style="margin:0;font-size:13px;color:#065f46;">
                      ⏰ <strong>Este enlace expira en 48 horas.</strong>
                      Si no solicitaste esta verificación, puedes ignorar este mensaje.
                    </p>
                  </div>

                  <p style="margin:0;font-size:15px;color:#374151;">
                    Saludos,<br/>
                    <strong>El equipo de ZURI</strong>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;">© 2026 ZURI Transportation · Lima, Perú</p>
                  <p style="margin:4px 0 0;font-size:12px;color:#9ca3af;">
                    <a href="mailto:soporte@zuri.pe" style="color:#9ca3af;">soporte@zuri.pe</a>
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

    return sendEmail({
        to,
        subject: '✅ Verifica tu cuenta – ZURI Transportación',
        html,
    });
}
