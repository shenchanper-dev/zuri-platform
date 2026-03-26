/**
 * WhatsApp Service - Twilio Integration
 * Sends WhatsApp messages for driver notifications
 */

import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

let client: ReturnType<typeof twilio> | null = null;

// Initialize Twilio client
function getClient() {
    if (!client && accountSid && authToken) {
        client = twilio(accountSid, authToken);
    }
    return client;
}

export interface WhatsAppMessageOptions {
    to: string;
    message: string;
    mediaUrl?: string;
}

export interface WhatsAppResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Send WhatsApp message using Twilio
 */
export async function sendWhatsAppMessage(
    to: string,
    message: string,
    mediaUrl?: string
): Promise<WhatsAppResult> {
    try {
        const twilioClient = getClient();

        if (!twilioClient) {
            console.warn('⚠️ Twilio not configured. Skipping WhatsApp message.');
            return { success: false, error: 'Twilio not configured' };
        }

        // Format Peruvian phone number: +51XXXXXXXXX
        const formattedTo = to.startsWith('+51') ? to : `+51${to.replace(/\D/g, '')}`;

        const messageOptions: any = {
            from: whatsappFrom,
            to: `whatsapp:${formattedTo}`,
            body: message,
        };

        if (mediaUrl) {
            messageOptions.mediaUrl = [mediaUrl];
        }

        const result = await twilioClient.messages.create(messageOptions);

        console.log(`✅ WhatsApp enviado a ${to}: ${result.sid}`);
        return { success: true, messageId: result.sid };
    } catch (error: any) {
        console.error(`❌ Error enviando WhatsApp a ${to}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Send driver registration warning (Day 20)
 */
export async function sendRegistrationWarningDay20(
    nombre: string,
    celular: string,
    fechaLimite: string
): Promise<WhatsAppResult> {
    const message = `
⚠️ *ZURI - Advertencia de Registro*

Hola ${nombre},

Han pasado *20 días* desde que iniciaste tu registro como conductor.

📌 Te quedan *10 días* para completar tu documentación.

⏰ Fecha límite: ${fechaLimite}

✅ *Documentos pendientes:*
- Licencia de conducir
- SOAT vigente  
- Fotos del vehículo
- Antecedentes penales

👉 Ingresa a la app Zuri Driver para subir tus documentos.

Si necesitas ayuda, contáctanos: soporte@zuri.pe
  `.trim();

    return sendWhatsAppMessage(celular, message);
}

/**
 * Send driver registration warning (Day 25)
 */
export async function sendRegistrationWarningDay25(
    nombre: string,
    celular: string
): Promise<WhatsAppResult> {
    const message = `
⚠️⚠️ *ZURI - ADVERTENCIA IMPORTANTE*

Hola ${nombre},

⏰ Quedan solo *5 DÍAS* para completar tu registro.

Si no completas tu documentación antes del plazo, tu solicitud será *RECHAZADA AUTOMÁTICAMENTE*.

🚨 *ACCIÓN REQUERIDA:*
1. Abre la app Zuri Driver
2. Ve a "Mi Perfil" 
3. Completa todos los documentos faltantes

📞 ¿Necesitas ayuda? Llámanos al +51 XXX XXX XXX
  `.trim();

    return sendWhatsAppMessage(celular, message);
}

/**
 * Send driver registration warning (Day 28 - URGENT)
 */
export async function sendRegistrationWarningDay28(
    nombre: string,
    celular: string
): Promise<WhatsAppResult> {
    const message = `
🚨🚨 *ZURI - ÚLTIMO AVISO*

${nombre}, esta es tu *ÚLTIMA OPORTUNIDAD*.

⏰ Quedan *SOLO 2 DÍAS* para evitar el rechazo automático.

❌ Si no completas tu registro en 48 horas, tu solicitud será rechazada y tendrás que volver a aplicar desde cero.

✅ *ACCIÓN INMEDIATA:*
Sube TODOS tus documentos HOY en la app Zuri Driver.

📌 Documentos obligatorios:
- Licencia de conducir (foto clara)
- SOAT vigente
- Revisión técnica
- Fotos del vehículo (4 ángulos)
- Certificado de antecedentes

⚡ NO ESPERES MÁS - Hazlo ahora.

Soporte: soporte@zuri.pe | +51 XXX XXX XXX
  `.trim();

    return sendWhatsAppMessage(celular, message);
}

/**
 * Send rejection notification
 */
export async function sendRejectionNotification(
    nombre: string,
    celular: string,
    razon: string
): Promise<WhatsAppResult> {
    const message = `
❌ *ZURI - Solicitud Rechazada*

Hola ${nombre},

Lamentamos informarte que tu solicitud para ser conductor de Zuri ha sido *RECHAZADA*.

*Motivo:* ${razon}

🔄 *¿Quieres volver a aplicar?*
Puedes registrarte nuevamente en cualquier momento. Esta vez asegúrate de:
- Tener TODOS los documentos listos antes de empezar
- Completar el proceso en máximo 7 días

📱 Descarga la app y comienza de nuevo cuando estés listo.

Gracias por tu interés en Zuri.
  `.trim();

    return sendWhatsAppMessage(celular, message);
}

/**
 * Send approval notification
 */
export async function sendApprovalNotification(
    nombre: string,
    celular: string
): Promise<WhatsAppResult> {
    const message = `
✅ *ZURI - ¡Felicitaciones!*

Hola ${nombre},

¡Excelentes noticias! Tu solicitud ha sido *APROBADA*.

🎉 Ya eres parte del equipo de conductores Zuri.

*Próximos pasos:*
1. Descarga la app Zuri Driver
2. Inicia sesión con tu DNI
3. Configura tu PIN de seguridad
4. Activa el GPS y comienza a recibir servicios

💰 *Recuerda:*
- Pago semanal vía transferencia
- 80% para ti, 20% comisión de plataforma
- 100% de tus propinas

Bienvenido a Zuri. ¡Éxito en tu primera semana!

Soporte: soporte@zuri.pe
  `.trim();

    return sendWhatsAppMessage(celular, message);
}
