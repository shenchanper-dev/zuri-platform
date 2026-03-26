/**
 * UTILIDAD GLOBAL: Compartir por WhatsApp
 */

export interface WhatsAppShareOptions {
  text: string;
  phone?: string; // Opcional: número específico
}

/**
 * Compartir texto por WhatsApp
 */
export const shareViaWhatsApp = ({ text, phone }: WhatsAppShareOptions) => {
  try {
    const encodedText = encodeURIComponent(text);
    
    let url = 'https://wa.me/';
    
    if (phone) {
      // Enviar a número específico
      const cleanPhone = phone.replace(/\D/g, '');
      url += `${cleanPhone}?text=${encodedText}`;
    } else {
      // Abrir WhatsApp para elegir contacto
      url = `https://api.whatsapp.com/send?text=${encodedText}`;
    }
    
    window.open(url, '_blank');
    return { success: true };
  } catch (error: any) {
    console.error('Error compartiendo por WhatsApp:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generar texto formateado para compartir datos
 */
export const generateShareText = (
  title: string,
  data: { label: string; value: string }[]
): string => {
  let text = `*${title}*\n\n`;
  
  data.forEach(item => {
    text += `*${item.label}:* ${item.value || 'N/A'}\n`;
  });
  
  text += `\n_Compartido desde ZURI - ${new Date().toLocaleDateString('es-PE')}_`;
  
  return text;
};
