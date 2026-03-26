/**
 * UTILIDAD GLOBAL: Enviar por Email
 */

export interface EmailOptions {
  to?: string;
  subject: string;
  body: string;
  attachments?: File[];
}

/**
 * Abrir cliente de email (mailto)
 */
export const sendEmail = ({ to, subject, body }: EmailOptions) => {
  try {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    
    let mailto = `mailto:${to || ''}?subject=${encodedSubject}&body=${encodedBody}`;
    
    window.location.href = mailto;
    return { success: true };
  } catch (error: any) {
    console.error('Error abriendo email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Copiar al portapapeles para pegar en email
 */
export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return { success: true };
  } catch (error: any) {
    console.error('Error copiando:', error);
    return { success: false, error: error.message };
  }
};
