/**
 * Claude AI Parser — Extrae datos estructurados de mensajes WhatsApp
 * de reportes de toma de muestra usando Anthropic Claude
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export interface TomaMuestraParsed {
    conductor: string;
    placa: string;
    tecnico: string;       // flebotomista / técnico
    paciente: string;
    distrito: string;
    hora_llegada: string;  // formato HH:MM
    hora_salida: string;   // formato HH:MM
    observaciones: string;
    fecha: string;         // formato YYYY-MM-DD
    confianza: number;     // 0-1 qué tan seguro está el parser
}

const SYSTEM_PROMPT = `Eres un parser de datos médicos para ZURI, una empresa NEMT (Non-Emergency Medical Transportation) en Lima, Perú.

Tu trabajo es extraer información estructurada de mensajes de WhatsApp que reportan tomas de muestra a domicilio.

Los mensajes típicamente contienen:
- Nombre del conductor (chofer) que transportó al técnico
- Placa del vehículo (formato peruano: ABC-123 o ABC123)
- Nombre del técnico/flebotomista que tomó la muestra
- Nombre del paciente
- Distrito de Lima donde se realizó
- Hora de llegada y hora de salida
- Observaciones adicionales
- Fecha (a veces implícita como "hoy")

REGLAS:
1. Si un campo no está presente en el mensaje, devuelve string vacío ""
2. Los nombres deben conservar mayúsculas como están en el mensaje
3. Las horas en formato 24h HH:MM
4. Si dice "hoy", usa la fecha del campo current_date que te proveo
5. Placa en formato ABC-123 (con guión)
6. El campo "confianza" es tu estimación de 0 a 1 de cuán completa y confiable es la extracción

Responde SOLO con JSON válido, sin explicaciones ni markdown.`;

export async function parsearReporteTomaMuestra(
    textoMensaje: string,
    fechaActual?: string
): Promise<TomaMuestraParsed> {
    const currentDate = fechaActual || new Date().toISOString().split('T')[0];

    // Si no hay API key, intentar un parse básico con regex
    if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('⚠️ ANTHROPIC_API_KEY no configurada, usando parser regex básico');
        return parseBasicoRegex(textoMensaje, currentDate);
    }

    try {
        const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 500,
            system: SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: `Fecha actual (current_date): ${currentDate}\n\nMensaje a parsear:\n${textoMensaje}`,
                },
            ],
        });

        const textContent = response.content.find((c) => c.type === 'text');
        if (!textContent || textContent.type !== 'text') {
            throw new Error('Claude no devolvió texto');
        }

        const parsed: TomaMuestraParsed = JSON.parse(textContent.text);

        // Validar estructura mínima
        return {
            conductor: parsed.conductor || '',
            placa: parsed.placa || '',
            tecnico: parsed.tecnico || '',
            paciente: parsed.paciente || '',
            distrito: parsed.distrito || '',
            hora_llegada: parsed.hora_llegada || '',
            hora_salida: parsed.hora_salida || '',
            observaciones: parsed.observaciones || '',
            fecha: parsed.fecha || currentDate,
            confianza: parsed.confianza ?? 0.5,
        };
    } catch (error: any) {
        console.error('❌ [Claude Parser] Error:', error.message);
        // Fallback a regex
        return parseBasicoRegex(textoMensaje, currentDate);
    }
}

/**
 * Parser regex de fallback — funciona sin Claude
 * Extrae lo que puede con patrones comunes
 */
function parseBasicoRegex(texto: string, fecha: string): TomaMuestraParsed {
    const resultado: TomaMuestraParsed = {
        conductor: '',
        placa: '',
        tecnico: '',
        paciente: '',
        distrito: '',
        hora_llegada: '',
        hora_salida: '',
        observaciones: '',
        fecha,
        confianza: 0.2,
    };

    // Placa peruana: 3 letras + guión/espacio + 3 números
    const placaMatch = texto.match(/\b([A-Z]{3})[\s-]?(\d{3})\b/i);
    if (placaMatch) {
        resultado.placa = `${placaMatch[1].toUpperCase()}-${placaMatch[2]}`;
    }

    // Horas: HH:MM
    const horas = texto.match(/\b(\d{1,2}:\d{2})\b/g);
    if (horas && horas.length >= 1) resultado.hora_llegada = horas[0];
    if (horas && horas.length >= 2) resultado.hora_salida = horas[1];

    // Conductor: línea que contiene "conductor" o "chofer"
    const conductorMatch = texto.match(/(?:conductor|chofer)[:\s]+([^\n,]+)/i);
    if (conductorMatch) resultado.conductor = conductorMatch[1].trim();

    // Técnico: línea que contiene "técnico" o "flebotomista" o "tec"
    const tecnicoMatch = texto.match(/(?:t[eé]cnic[oa]|flebotomista|tec)[.:\s]+([^\n,]+)/i);
    if (tecnicoMatch) resultado.tecnico = tecnicoMatch[1].trim();

    // Paciente: línea que contiene "paciente" o "pte"
    const pacienteMatch = texto.match(/(?:paciente|pte)[.:\s]+([^\n,]+)/i);
    if (pacienteMatch) resultado.paciente = pacienteMatch[1].trim();

    // Distrito: distritos comunes de Lima
    const distritos = [
        'Miraflores', 'San Isidro', 'Surco', 'San Borja', 'La Molina',
        'Barranco', 'Jesús María', 'Magdalena', 'Lince', 'San Miguel',
        'Pueblo Libre', 'Breña', 'Lima', 'Rímac', 'SJL', 'San Juan de Lurigancho',
        'Ate', 'Santa Anita', 'El Agustino', 'La Victoria', 'SJM',
        'San Juan de Miraflores', 'Villa El Salvador', 'VMT', 'Chorrillos',
        'Callao', 'Los Olivos', 'SMP', 'San Martín de Porres', 'Comas',
        'Independencia', 'Carabayllo', 'Puente Piedra', 'Surquillo',
        'Villa María del Triunfo', 'Chaclacayo', 'Chosica', 'Lurigancho'
    ];

    for (const d of distritos) {
        if (texto.toLowerCase().includes(d.toLowerCase())) {
            resultado.distrito = d;
            break;
        }
    }

    // Observaciones: línea que contiene "obs" o "nota"
    const obsMatch = texto.match(/(?:obs(?:ervaci[oó]n(?:es)?)?|nota)[.:\s]+([^\n]+)/i);
    if (obsMatch) resultado.observaciones = obsMatch[1].trim();

    return resultado;
}
