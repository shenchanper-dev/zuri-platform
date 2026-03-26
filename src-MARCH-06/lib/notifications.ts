/**
 * Email Service - Resend.com HTTP API
 * Professional email delivery for zuri.pe domain
 * Uses HTTP API (faster and more reliable than SMTP)
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_JHm19598_HQGjDzCSpYDqyVaYcxsGidb6';
const RESEND_API_URL = 'https://api.resend.com/emails';

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email notification via Resend HTTP API
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string
): Promise<EmailResult> {
  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'ZURI <admin@zuri.pe>',
        to: [to],
        subject,
        html: htmlContent
      })
    });

    const data = await response.json();

    if (response.ok && data.id) {
      console.log(`✅ Email enviado a ${to}: ${data.id}`);
      return { success: true, messageId: data.id };
    } else {
      console.error(`❌ Error Resend:`, data);
      return { success: false, error: data.message || 'Error enviando email' };
    }
  } catch (error: any) {
    console.error(`❌ Error enviando email a ${to}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Send SMS via FREE Peruvian provider API (Nexmo, or local provider)
 * For now, just logs - you can integrate with any FREE SMS API
 */
export async function sendSMS(
  to: string,
  message: string
): Promise<EmailResult> {
  console.log(`📱 SMS [MOCK]: To: ${to}, Message: ${message}`);
  // TODO: Integrate with free SMS provider (e.g., local Peruvian provider)
  return { success: true, messageId: 'mock-sms-id' };
}

/**
 * Send verification code email
 */
export async function sendVerificationCodeEmail(
  email: string,
  nombre: string,
  codigo: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .code-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px; }
        .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚗 Bienvenido a Zuri</h1>
        </div>
        <div class="content">
          <h2>Hola ${nombre},</h2>
          <p>Gracias por registrarte como conductor en Zuri Transportation.</p>
          <p>Para completar tu registro, ingresa el siguiente código de verificación en la app:</p>
          
          <div class="code-box">${codigo}</div>
          
          <p><strong>Este código expira en 24 horas.</strong></p>
          
          <p>Si no solicitaste este código, ignora este mensaje.</p>
          
          <p>Saludos,<br><strong>El equipo de Zuri</strong></p>
        </div>
        <div class="footer">
          <p>© 2026 Zuri Transportation | Lima, Perú</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(email, 'Código de Verificación - Zuri', html);
}

/**
 * Send registration warning (Day 20)
 */
export async function sendRegistrationWarningDay20(
  nombre: string,
  email: string,
  celular: string,
  fechaLimite: string
): Promise<EmailResult> {
  // Send email
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>⚠️ Advertencia de Registro - Zuri</h2>
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Han pasado <strong>20 días</strong> desde que iniciaste tu registro como conductor.</p>
        <p>📌 Te quedan <strong>10 días</strong> para completar tu documentación.</p>
        <p>⏰ <strong>Fecha límite:</strong> ${fechaLimite}</p>
        
        <h3>✅ Documentos pendientes:</h3>
        <ul>
          <li>Licencia de conducir</li>
          <li>SOAT vigente</li>
          <li>Fotos del vehículo</li>
          <li>Antecedentes penales</li>
        </ul>
        
        <p>👉 Ingresa a la app Zuri Driver para subir tus documentos.</p>
        <p>Si necesitas ayuda, contáctanos: <a href="mailto:soporte@zuri.pe">soporte@zuri.pe</a></p>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, '⚠️ Advertencia: Completa tu registro en 10 días', html);

  // Send SMS notification
  await sendSMS(celular, `ZURI: Te quedan 10 días para completar tu registro. Fecha límite: ${fechaLimite}`);

  return { success: true };
}

/**
 * Send registration warning (Day 25)
 */
export async function sendRegistrationWarningDay25(
  nombre: string,
  email: string,
  celular: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background: #fff3cd; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-left: 5px solid #ff9800;">
        <h2 style="color: #ff9800;">⚠️⚠️ ADVERTENCIA IMPORTANTE</h2>
        <p>Hola <strong>${nombre}</strong>,</p>
        <p style="font-size: 18px; color: #ff9800;">⏰ Quedan solo <strong>5 DÍAS</strong> para completar tu registro.</p>
        <p>Si no completas tu documentación antes del plazo, tu solicitud será <strong>RECHAZADA AUTOMÁTICAMENTE</strong>.</p>
        
        <h3>🚨 ACCIÓN REQUERIDA:</h3>
        <ol>
          <li>Abre la app Zuri Driver</li>
          <li>Ve a "Mi Perfil"</li>
          <li>Completa todos los documentos faltantes</li>
        </ol>
        
        <p>📞 ¿Necesitas ayuda? <a href="mailto:soporte@zuri.pe">Contáctanos</a></p>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, '🚨 URGENTE: 5 días para completar registro', html);
  await sendSMS(celular, 'ZURI URGENTE: Solo 5 días para completar tu registro o será rechazado. Entra a la app ahora.');

  return { success: true };
}

/**
 * Send registration warning (Day 28 - CRITICAL)
 */
export async function sendRegistrationWarningDay28(
  nombre: string,
  email: string,
  celular: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; background: #f44336; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border: 3px solid #f44336;">
        <h2 style="color: #f44336;">🚨🚨 ÚLTIMO AVISO</h2>
        <p><strong>${nombre}</strong>, esta es tu <strong>ÚLTIMA OPORTUNIDAD</strong>.</p>
        <p style="font-size: 20px; color: #f44336;">⏰ Quedan <strong>SOLO 2 DÍAS</strong> para evitar el rechazo automático.</p>
        <p>❌ Si no completas tu registro en 48 horas, tu solicitud será rechazada y tendrás que volver a aplicar desde cero.</p>
        
        <div style="background: #ffebee; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3>✅ ACCIÓN INMEDIATA:</h3>
          <p>Sube TODOS tus documentos HOY en la app Zuri Driver.</p>
          
          <p><strong>Documentos obligatorios:</strong></p>
          <ul>
            <li>Licencia de conducir (foto clara)</li>
            <li>SOAT vigente</li>
            <li>Revisión técnica</li>
            <li>Fotos del vehículo (4 ángulos)</li>
            <li>Certificado de antecedentes</li>
          </ul>
        </div>
        
        <p style="font-size: 18px; font-weight: bold; color: #f44336;">⚡ NO ESPERES MÁS - Hazlo ahora.</p>
        <p>Soporte: <a href="mailto:soporte@zuri.pe">soporte@zuri.pe</a></p>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, '🚨 ÚLTIMO AVISO: 2 días para evitar rechazo automático', html);
  await sendSMS(celular, 'ZURI ÚLTIMO AVISO: SOLO 2 DÍAS. Completa tu registro AHORA o serás rechazado automáticamente.');

  return { success: true };
}

/**
 * Send rejection notification
 */
export async function sendRejectionNotification(
  nombre: string,
  email: string,
  celular: string,
  razon: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 30px;">
        <h2 style="color: #f44336;">❌ Solicitud Rechazada</h2>
        <p>Hola <strong>${nombre}</strong>,</p>
        <p>Lamentamos informarte que tu solicitud para ser conductor de Zuri ha sido <strong>RECHAZADA</strong>.</p>
        
        <div style="background: #ffebee; padding: 15px; border-left: 4px solid #f44336; margin: 20px 0;">
          <p><strong>Motivo:</strong> ${razon}</p>
        </div>
        
        <h3>🔄 ¿Quieres volver a aplicar?</h3>
        <p>Puedes registrarte nuevamente en cualquier momento. Esta vez asegúrate de:</p>
        <ul>
          <li>Tener TODOS los documentos listos antes de empezar</li>
          <li>Completar el proceso en máximo 7 días</li>
        </ul>
        
        <p>📱 Descarga la app y comienza de nuevo cuando estés listo.</p>
        <p>Gracias por tu interés en Zuri.</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, '❌ Zuri - Solicitud Rechazada', html);
  await sendSMS(celular, `ZURI: Tu solicitud fue rechazada. Motivo: ${razon}. Puedes volver a aplicar cuando quieras.`);

  return { success: true };
}

/**
 * Send approval notification
 */
export async function sendApprovalNotification(
  nombre: string,
  email: string,
  celular: string
): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px;">
        <h1 style="text-align: center;">✅ ¡Felicitaciones!</h1>
        <h2>Hola <strong>${nombre}</strong>,</h2>
        <p style="font-size: 18px;">¡Excelentes noticias! Tu solicitud ha sido <strong>APROBADA</strong>.</p>
        <p style="font-size: 16px;">🎉 Ya eres parte del equipo de conductores Zuri.</p>
        
        <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Próximos pasos:</h3>
          <ol>
            <li>Descarga la app Zuri Driver</li>
            <li>Inicia sesión con tu DNI</li>
            <li>Configura tu PIN de seguridad</li>
            <li>Activa el GPS y comienza a recibir servicios</li>
          </ol>
        </div>
        
        <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px;">
          <h3>💰 Recuerda:</h3>
          <ul>
            <li>Pago semanal vía transferencia</li>
            <li>80% para ti, 20% comisión de plataforma</li>
            <li>100% de tus propinas</li>
          </ul>
        </div>
        
        <p style="text-align: center; font-size: 18px; margin-top: 30px;">Bienvenido a Zuri. ¡Éxito en tu primera semana!</p>
        <p style="text-align: center;">Soporte: soporte@zuri.pe</p>
      </div>
    </body>
    </html>
  `;

  await sendEmail(email, '✅ ¡Bienvenido a Zuri! - Solicitud Aprobada', html);
  await sendSMS(celular, '¡FELICIDADES! Tu solicitud en Zuri fue APROBADA. Descarga la app y comienza a trabajar.');

  return { success: true };
}
