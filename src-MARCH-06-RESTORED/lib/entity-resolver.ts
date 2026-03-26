/**
 * Entity Resolver — Resolución fuzzy de conductores, técnicos y pacientes
 * Usa pg_trgm similarity() para match por nombre parcial o placa
 */

import pool from '@/lib/pg-pool';

// ─── Resolver Conductor ──────────────────────────────────────────────
export async function resolverConductor(
    nombreRaw: string,
    placaRaw?: string
): Promise<{ id: number; nombre: string; score: number } | null> {
    const client = await pool.connect();
    try {
        // 1. Si hay placa, buscar por placa exacta primero (más confiable)
        if (placaRaw) {
            const placaClean = placaRaw.replace(/[\s-]/g, '').toUpperCase();
            const placaResult = await client.query(
                `SELECT id, "nombreCompleto" as nombre 
         FROM conductores 
         WHERE UPPER(REPLACE(REPLACE(placa, '-', ''), ' ', '')) = $1 
           AND estado = 'ACTIVO'
         LIMIT 1`,
                [placaClean]
            );
            if (placaResult.rows.length > 0) {
                return { id: placaResult.rows[0].id, nombre: placaResult.rows[0].nombre, score: 1.0 };
            }
        }

        // 2. Buscar por nombre con similarity (pg_trgm)
        if (!nombreRaw || nombreRaw.trim().length < 2) return null;

        const result = await client.query(
            `SELECT id, "nombreCompleto" as nombre,
              similarity(normalizar_nombre("nombreCompleto"), normalizar_nombre($1)) as score
       FROM conductores
       WHERE similarity(normalizar_nombre("nombreCompleto"), normalizar_nombre($1)) > 0.3
         AND estado = 'ACTIVO'
       ORDER BY score DESC
       LIMIT 1`,
            [nombreRaw.trim()]
        );

        if (result.rows.length > 0) {
            return {
                id: result.rows[0].id,
                nombre: result.rows[0].nombre,
                score: parseFloat(result.rows[0].score),
            };
        }

        // 3. Fallback: buscar por apellido parcial (ILIKE)
        const apellido = nombreRaw.trim().split(' ').pop() || '';
        if (apellido.length >= 3) {
            const fallback = await client.query(
                `SELECT id, "nombreCompleto" as nombre
         FROM conductores
         WHERE "nombreCompleto" ILIKE $1 AND estado = 'ACTIVO'
         ORDER BY id DESC LIMIT 1`,
                [`%${apellido}%`]
            );
            if (fallback.rows.length > 0) {
                return { id: fallback.rows[0].id, nombre: fallback.rows[0].nombre, score: 0.3 };
            }
        }

        return null;
    } finally {
        client.release();
    }
}

// ─── Resolver Técnico (doctores / flebotomistas) ─────────────────────
export async function resolverTecnico(
    nombreRaw: string
): Promise<{ id: number; nombre: string; score: number } | null> {
    if (!nombreRaw || nombreRaw.trim().length < 2) return null;

    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT id, nombre_completo as nombre,
              similarity(normalizar_nombre(nombre_completo), normalizar_nombre($1)) as score
       FROM doctores
       WHERE similarity(normalizar_nombre(nombre_completo), normalizar_nombre($1)) > 0.3
       ORDER BY score DESC
       LIMIT 1`,
            [nombreRaw.trim()]
        );

        if (result.rows.length > 0) {
            return {
                id: result.rows[0].id,
                nombre: result.rows[0].nombre,
                score: parseFloat(result.rows[0].score),
            };
        }

        // Fallback por apellido
        const apellido = nombreRaw.trim().split(' ').pop() || '';
        if (apellido.length >= 3) {
            const fallback = await client.query(
                `SELECT id, nombre_completo as nombre
         FROM doctores
         WHERE nombre_completo ILIKE $1
         ORDER BY id DESC LIMIT 1`,
                [`%${apellido}%`]
            );
            if (fallback.rows.length > 0) {
                return { id: fallback.rows[0].id, nombre: fallback.rows[0].nombre, score: 0.3 };
            }
        }

        return null;
    } finally {
        client.release();
    }
}

// ─── Resolver o Crear Paciente ───────────────────────────────────────
export async function resolverOCrearPaciente(
    nombreRaw: string,
    distrito?: string,
    observaciones?: string,
    fecha?: string
): Promise<{ id: number; nombre: string; esNuevo: boolean }> {
    if (!nombreRaw || nombreRaw.trim().length < 2) {
        throw new Error('Nombre de paciente requerido');
    }

    const client = await pool.connect();
    try {
        const nombreNorm = nombreRaw.trim();

        // 1. Buscar con similarity
        const result = await client.query(
            `SELECT id, nombre_completo AS nombre,
              similarity(normalizar_nombre(nombre_completo), normalizar_nombre($1)) AS score
       FROM pacientes
       WHERE similarity(normalizar_nombre(nombre_completo), normalizar_nombre($1)) > 0.4
       ORDER BY score DESC
       LIMIT 1`,
            [nombreNorm]
        );

        if (result.rows.length > 0) {
            // Paciente encontrado → actualizar stats
            await client.query(
                `UPDATE pacientes
         SET numero_servicios_realizados = COALESCE(numero_servicios_realizados, 0) + 1,
             ultima_visita_medica = COALESCE($2::date, CURRENT_DATE),
             updated_at = NOW()
         WHERE id = $1`,
                [result.rows[0].id, fecha || null]
            );
            return { id: result.rows[0].id, nombre: result.rows[0].nombre, esNuevo: false };
        }

        // 2. No encontrado → separar nombre en partes
        // Formato esperado del reporte: "Nombres ApellidoP ApellidoM"
        // Ej: "Maria Elena Rios Lopez" → nombres="Maria Elena", ap="Rios", am="Lopez"
        const partes = nombreNorm.split(/\s+/);

        let nombres: string;
        let apellidoPaterno: string;
        let apellidoMaterno: string;

        if (partes.length >= 3) {
            apellidoMaterno = partes[partes.length - 1];
            apellidoPaterno = partes[partes.length - 2];
            nombres = partes.slice(0, -2).join(' ');
        } else if (partes.length === 2) {
            nombres = partes[0];
            apellidoPaterno = partes[1];
            apellidoMaterno = '';
        } else {
            nombres = nombreNorm;
            apellidoPaterno = 'POR_VERIFICAR';
            apellidoMaterno = '';
        }

        // Dirección mapeada desde distrito del reporte
        const direccion = distrito
            ? `${distrito} — registrado por WhatsApp`
            : 'Por definir — registrado por WhatsApp';

        // Fecha de última visita = fecha del servicio o hoy
        const ultimaVisita = fecha || null;

        // Pre-calcular nombre_normalizado con una query simple para evitar
        // el error "inconsistent types deduced for parameter $N" de PostgreSQL
        // (que ocurre cuando el mismo $N aparece en dos contextos de tipo distintos)
        const normRow = await client.query(
            `SELECT normalizar_nombre($1::text) AS n`,
            [nombreNorm]
        );
        const nombreNormalizado: string = normRow.rows[0]?.n ?? nombreNorm.toLowerCase();

        const insertResult = await client.query(
            `INSERT INTO pacientes (
        dni,
        nombres, apellido_paterno, apellido_materno,
        nombre_completo, nombre_normalizado,
        fecha_nacimiento,
        direccion,
        emergencia_nombre, emergencia_telefono,
        movilidad_tipo, estado,
        observaciones_medicas,
        numero_servicios_realizados, ultima_visita_medica,
        created_by
      ) VALUES (
        $1,
        $2, $3, $4,
        $5, $6,
        '1900-01-01',
        $7,
        'POR_VERIFICAR', '000000000',
        'AMBULATORIO', 'ACTIVO',
        $8,
        1, COALESCE($9::date, CURRENT_DATE),
        'whatsapp-parser'
      ) RETURNING id, nombre_completo AS nombre`,
            [
                `WA-${Date.now()}`,    // $1 — DNI temporal único
                nombres,                // $2
                apellidoPaterno,        // $3
                apellidoMaterno,        // $4 — puede ser ''
                nombreNorm,             // $5 — nombre_completo
                nombreNormalizado,      // $6 — nombre_normalizado (pre-calculado)
                direccion,              // $7
                observaciones || null,  // $8
                ultimaVisita,           // $9
            ]
        );

        return { id: insertResult.rows[0].id, nombre: insertResult.rows[0].nombre, esNuevo: true };

    } finally {
        client.release();
    }
}


// ─── Resolver Conductor por teléfono/WhatsApp ────────────────────────
export async function resolverConductorPorTelefono(
    telefono: string
): Promise<{ id: number; nombre: string } | null> {
    if (!telefono) return null;
    const numLimpio = telefono.replace(/^\+/, '').replace(/^51/, '');
    const result = await pool.query(
        `SELECT id, "nombreCompleto" AS nombre
         FROM conductores
         WHERE whatsapp_number = $1
            OR whatsapp_number = $2
            OR REPLACE(COALESCE(celular1,''), ' ', '') = $1
            OR REPLACE(COALESCE(celular1,''), ' ', '') = $2
            OR REPLACE(COALESCE(celular2,''), ' ', '') = $1
         LIMIT 1`,
        [telefono, numLimpio]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
}

// ─── Crear Conductor Provisional ─────────────────────────────────────
export async function crearConductorProvisional(
    whatsappPhone: string
): Promise<{ id: number }> {
    const dniTemp = `WA${Date.now().toString().slice(-6)}`;
    const result = await pool.query(
        `INSERT INTO conductores (
            dni, nombres, apellidos, "nombreCompleto",
            celular1, whatsapp_number,
            estado, created_by_wa, "createdAt", "updatedAt"
        ) VALUES (
            $1, 'Por', 'Verificar', 'Por Verificar',
            $2, $2,
            'PENDIENTE_VERIFICACION'::"EstadoConductor", 'whatsapp-auto',
            NOW(), NOW()
        ) RETURNING id`,
        [dniTemp, whatsappPhone]
    );
    console.log(`🆕 [Conductor Provisional] id=${result.rows[0].id} phone=${whatsappPhone}`);
    return { id: result.rows[0].id };
}
