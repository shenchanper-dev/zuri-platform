/**
 * Email & SMS Notifications Service
 * Email delegation → src/lib/email.ts (Resend)
 * SMS → mock / future provider
 */

import { sendEmail as resendEmail, type EmailResult } from '@/lib/email';

export type { EmailResult };

// ──────────────────────────────────────────────────────────────────────────────
// Generic email wrapper (mantiene la firma legacy: to, subject, html)
// ──────────────────────────────────────────────────────────────────────────────

export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<EmailResult> {
  return resendEmail({ to, subject, html: htmlContent });
}

// ──────────────────────────────────────────────────────────────────────────────
// SMS (mock — integrar un proveedor real cuando esté disponible)
// ──────────────────────────────────────────────────────────────────────────────

export async function sendSMS(
  to: string,
  message: string
): Promise<EmailResult> {
  console.log(`📱 SMS [MOCK]: To: ${to}, Message: ${message}`);
  return { success: true, messageId: 'mock-sms-id' };
}

// ──────────────────────────────────────────────────────────────────────────────
// Verification code email (código numérico)
// ──────────────────────────────────────────────────────────────────────────────

export async function sendVerificationCodeEmail(
  email: string,
  nombre: string,
  codigo: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8" /><title>Código de Verificación – ZURI</title></head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background:#f4f4f5;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:600px;">
            <tr>
              <td style="background:#00C8AA;padding:32px 40px;text-align:center;">
                <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;">🚗 ZURI</h1>
                <p style="margin:8px 0 0;color:rgba(255,255,255,.85);font-size:14px;">Plataforma de Transporte Médico</p>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;">
                <h2 style="margin:0 0 16px;color:#111827;">Hola ${nombre},</h2>
                <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6;">
                  Gracias por registrarte como conductor en Zuri Transportation.<br/>
                  Para completar tu registro, ingresa el siguiente código de verificación en la app:
                </p>
                <div style="background:#fff;border:2px dashed #00C8AA;padding:24px;text-align:center;font-size:36px;font-weight:700;letter-spacing:10px;margin:24px 0;border-radius:8px;color:#00C8AA;">
                  ${codigo}
                </div>
                <div style="background:#f0fdf4;border-left:4px solid #00C8AA;border-radius:4px;padding:12px 16px;margin:0 0 24px;">
                  <p style="margin:0;font-size:13px;color:#065f46;">⏰ <strong>Este código expira en 48 horas.</strong> Si no solicitaste este código, ignora este mensaje.</p>
                </div>
                <p style="margin:0;font-size:15px;color:#374151;">Saludos,<br/><strong>El equipo de ZURI</strong></p>
              </td>
            </tr>
            <tr>
              <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;color:#9ca3af;">© 2026 ZURI Transportation · Lima, Perú</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  return sendEmail(email, 'Código de Verificación – ZURI', html);
}

// ──────────────────────────────────────────────────────────────────────────────
// Registration warning – Day 20
// ──────────────────────────────────────────────────────────────────────────────

export async function sendRegistrationWarningDay20(
  nombre: string,
  email: string,
  celular: string,
  fechaLimite: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html><html><body style="font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:20px;">
        <h2>⚠️ Advertencia de Registro - Zuri</h2>
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Han pasado <strong>20 días</strong> desde que iniciaste tu registro como conductor.</p>
        <p>📌 Te quedan <strong>10 días</strong> para completar tu documentación.</p>
        <p>⏰ <strong>Fecha límite:</strong> ${fechaLimite}</p>
        <h3>✅ Documentos pendientes:</h3>
        <ul>
          <li>Licencia de conducir</li><li>SOAT vigente</li>
          <li>Fotos del vehículo</li><li>Antecedentes penales</li>
        </ul>
        <p>👉 Ingresa a la app Zuri Driver para subir tus documentos.</p>
        <p>Si necesitas ayuda, contáctanos: <a href="mailto:soporte@zuri.pe">soporte@zuri.pe</a></p>
      </div>
    </body></html>
  `;

  await sendEmail(email, '⚠️ Advertencia: Completa tu registro en 10 días', html);
  await sendSMS(celular, `ZURI: Te quedan 10 días para completar tu registro. Fecha límite: ${fechaLimite}`);
  return { success: true };
}

// ──────────────────────────────────────────────────────────────────────────────
// Registration warning – Day 25
// ──────────────────────────────────────────────────────────────────────────────

export async function sendRegistrationWarningDay25(
  nombre: string,
  email: string,
  celular: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html><html>
    <body style="font-family:Arial,sans-serif;background:#fff3cd;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:white;padding:30px;border-left:5px solid #ff9800;">
        <h2 style="color:#ff9800;">⚠️⚠️ ADVERTENCIA IMPORTANTE</h2>
        <p>Hola <strong>${nombre}</strong>,</p>
        <p style="font-size:18px;color:#ff9800;">⏰ Quedan solo <strong>5 DÍAS</strong> para completar tu registro.</p>
        <p>Si no completas tu documentación antes del plazo, tu solicitud será <strong>RECHAZADA AUTOMÁTICAMENTE</strong>.</p>
        <h3>🚨 ACCIÓN REQUERIDA:</h3>
        <ol><li>Abre la app Zuri Driver</li><li>Ve a "Mi Perfil"</li><li>Completa todos los documentos faltantes</li></ol>
        <p>📞 ¿Necesitas ayuda? <a href="mailto:soporte@zuri.pe">Contáctanos</a></p>
      </div>
    </body></html>
  `;

  await sendEmail(email, '🚨 URGENTE: 5 días para completar registro', html);
  await sendSMS(celular, 'ZURI URGENTE: Solo 5 días para completar tu registro o será rechazado. Entra a la app ahora.');
  return { success: true };
}

// ──────────────────────────────────────────────────────────────────────────────
// Registration warning – Day 28 (CRITICAL)
// ──────────────────────────────────────────────────────────────────────────────

export async function sendRegistrationWarningDay28(
  nombre: string,
  email: string,
  celular: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html><html>
    <body style="font-family:Arial,sans-serif;background:#f44336;padding:20px;">
      <div style="max-width:600px;margin:0 auto;background:white;padding:30px;border:3px solid #f44336;">
        <h2 style="color:#f44336;">🚨🚨 ÚLTIMO AVISO</h2>
        <p><strong>${nombre}</strong>, esta es tu <strong>ÚLTIMA OPORTUNIDAD</strong>.</p>
        <p style="font-size:20px;color:#f44336;">⏰ Quedan <strong>SOLO 2 DÍAS</strong> para evitar el rechazo automático.</p>
        <p>❌ Si no completas tu registro en 48 horas, tu solicitud será rechazada y tendrás que volver a aplicar desde cero.</p>
        <div style="background:#ffebee;padding:20px;margin:20px 0;border-radius:8px;">
          <h3>✅ ACCIÓN INMEDIATA:</h3>
          <p>Sube TODOS tus documentos HOY en la app Zuri Driver.</p>
          <strong>Documentos obligatorios:</strong>
          <ul>
            <li>Licencia de conducir (foto clara)</li><li>SOAT vigente</li>
            <li>Revisión técnica</li><li>Fotos del vehículo (4 ángulos)</li>
            <li>Certificado de antecedentes</li>
          </ul>
        </div>
        <p style="font-size:18px;font-weight:bold;color:#f44336;">⚡ NO ESPERES MÁS - Hazlo ahora.</p>
        <p>Soporte: <a href="mailto:soporte@zuri.pe">soporte@zuri.pe</a></p>
      </div>
    </body></html>
  `;

  await sendEmail(email, '🚨 ÚLTIMO AVISO: 2 días para evitar rechazo automático', html);
  await sendSMS(celular, 'ZURI ÚLTIMO AVISO: SOLO 2 DÍAS. Completa tu registro AHORA o serás rechazado automáticamente.');
  return { success: true };
}

// ──────────────────────────────────────────────────────────────────────────────
// Rejection notification
// ──────────────────────────────────────────────────────────────────────────────

export async function sendRejectionNotification(
  nombre: string,
  email: string,
  celular: string,
  razon: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html><html><body style="font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:30px;">
        <h2 style="color:#f44336;">❌ Solicitud Rechazada</h2>
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Lamentamos informarte que tu solicitud para ser conductor de Zuri ha sido <strong>RECHAZADA</strong>.</p>
        <div style="background:#ffebee;padding:15px;border-left:4px solid #f44336;margin:20px 0;">
          <p><strong>Motivo:</strong> ${razon}</p>
        </div>
        <h3>🔄 ¿Quieres volver a aplicar?</h3>
        <p>Puedes registrarte nuevamente. Asegúrate de tener TODOS los documentos listos antes de empezar.</p>
        <p>📱 Descarga la app y comienza de nuevo cuando estés listo.</p>
        <p>Gracias por tu interés en Zuri.</p>
      </div>
    </body></html>
  `;

  await sendEmail(email, '❌ Zuri - Solicitud Rechazada', html);
  await sendSMS(celular, `ZURI: Tu solicitud fue rechazada. Motivo: ${razon}. Puedes volver a aplicar cuando quieras.`);
  return { success: true };
}

// ──────────────────────────────────────────────────────────────────────────────
// Approval notification
// ──────────────────────────────────────────────────────────────────────────────

export async function sendApprovalNotification(
  nombre: string,
  email: string,
  celular: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html><html><body style="font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:30px;background:linear-gradient(135deg,#00C8AA 0%,#00a08a 100%);color:white;border-radius:10px;">
        <h1 style="text-align:center;">✅ ¡Felicitaciones!</h1>
        <h2>Hola <strong>${nombre}</strong>,</h2>
        <p style="font-size:18px;">¡Excelentes noticias! Tu solicitud ha sido <strong>APROBADA</strong>.</p>
        <p style="font-size:16px;">🎉 Ya eres parte del equipo de conductores Zuri.</p>
        <div style="background:rgba(255,255,255,.2);padding:20px;border-radius:8px;margin:20px 0;">
          <h3>Próximos pasos:</h3>
          <ol>
            <li>Descarga la app Zuri Driver</li>
            <li>Inicia sesión con tu DNI</li>
            <li>Configura tu PIN de seguridad</li>
            <li>Activa el GPS y comienza a recibir servicios</li>
          </ol>
        </div>
        <div style="background:rgba(255,255,255,.2);padding:15px;border-radius:8px;">
          <h3>💰 Recuerda:</h3>
          <ul>
            <li>Pago semanal vía transferencia</li>
            <li>80% para ti, 20% comisión de plataforma</li>
            <li>100% de tus propinas</li>
          </ul>
        </div>
        <p style="text-align:center;font-size:18px;margin-top:30px;">Bienvenido a Zuri. ¡Éxito en tu primera semana!</p>
        <p style="text-align:center;">Soporte: soporte@zuri.pe</p>
      </div>
    </body></html>
  `;

  await sendEmail(email, '✅ ¡Bienvenido a Zuri! - Solicitud Aprobada', html);
  await sendSMS(celular, '¡FELICIDADES! Tu solicitud en Zuri fue APROBADA. Descarga la app y comienza a trabajar.');
  return { success: true };
}

// ──────────────────────────────────────────────────────────────────────────────
// NEW DRIVER ALERT → Admin team notification
// Email: admin@zuri.pe
// WhatsApp/SMS: +51 941946619, +51 981195370
// ──────────────────────────────────────────────────────────────────────────────

export async function sendNewDriverAdminAlert(data: {
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  celular?: string;
  conductorId: number;
}): Promise<EmailResult> {
  const nombre = `${data.nombres} ${data.apellidos}`;
  const adminUrl = 'https://admin.zuri.pe/dashboard/conductores';
  const whatsappNums = ['+51941946619', '+51981195370'];

  // ── Email al administrador ──
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"/><title>Nuevo Conductor – ZURI</title></head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;background:#f4f4f5;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;max-width:600px;box-shadow:0 4px 20px rgba(0,0,0,.08);">
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#00B5D8,#0891B2);padding:28px 40px;text-align:center;">
                <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">🚗 ZURI Admin</h1>
                <p style="margin:6px 0 0;color:rgba(255,255,255,.85);font-size:13px;">Sistema de Gestión de Flota</p>
              </td>
            </tr>
            <!-- Alert badge -->
            <tr>
              <td style="padding:28px 40px 0;">
                <div style="background:#FFF3CD;border:1px solid #FFECB5;border-radius:8px;padding:12px 16px;display:flex;align-items:center;gap:10px;">
                  <span style="font-size:20px;">🔔</span>
                  <strong style="color:#856404;font-size:15px;">Nuevo conductor pendiente de aprobación</strong>
                </div>
              </td>
            </tr>
            <!-- Conductor data -->
            <tr>
              <td style="padding:24px 40px;">
                <h2 style="margin:0 0 20px;color:#111827;font-size:20px;">Datos del conductor</h2>
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;width:140px;">Nombre completo</td>
                      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:700;font-size:15px;color:#111827;">${nombre}</td></tr>
                  <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">DNI</td>
                      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-weight:700;color:#111827;font-family:monospace;font-size:16px;">${data.dni}</td></tr>
                  <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Email</td>
                      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;">${data.email}</td></tr>
                  <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:14px;">Celular</td>
                      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;color:#111827;">${data.celular || '—'}</td></tr>
                  <tr><td style="padding:10px 0;color:#6b7280;font-size:14px;">ID Sistema</td>
                      <td style="padding:10px 0;color:#111827;font-family:monospace;">#${data.conductorId}</td></tr>
                </table>
                <!-- CTA button -->
                <div style="text-align:center;margin-top:28px;">
                  <a href="${adminUrl}" style="display:inline-block;background:linear-gradient(135deg,#00B5D8,#0891B2);color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:16px;">
                    👉 Revisar y Aprobar en Admin
                  </a>
                </div>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background:#f9fafb;padding:16px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;color:#9ca3af;">© 2026 ZURI Transportation · Lima, Perú · admin@zuri.pe</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  const emailResult = await sendEmail(
    'admin@zuri.pe',
    `🔔 Nuevo conductor pendiente: ${nombre} (DNI: ${data.dni})`,
    html
  );

  // ── SMS/WhatsApp a los números de admin ──
  const msg = `🚗 ZURI ADMIN\n🔔 Nuevo conductor registrado:\n👤 ${nombre}\n🪪 DNI: ${data.dni}\n📞 ${data.celular || 'sin celular'}\n📧 ${data.email}\n\nRevisar en: ${adminUrl}`;

  for (const num of whatsappNums) {
    await sendSMS(num, msg).catch(e => console.error(`❌ SMS to ${num}:`, e.message));
  }

  console.log(`🔔 [Admin Alert] Notificación enviada por nuevo conductor: ${nombre} (ID: ${data.conductorId})`);
  return emailResult;
}

