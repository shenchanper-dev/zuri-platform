import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import * as XLSX from 'xlsx';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

// ============================================================================
// MAPEO INTELIGENTE DE COLUMNAS (41 sinónimos)
// ============================================================================
const ALIASES: Record<string, string[]> = {
  fecha: ['fecha', 'dia', 'date', 'day', 'periodo', 'plazo'],
  doctor: ['usuario', 'doctor', 'medico', 'licenciado', 'especialista', 'doctora',
    'apellidos y nombres del medico', 'apellidos y nombre del medico',
    'nombre completo', 'profesional', 'apellidos y nombres'],
  paciente: ['paciente', 'nombre paciente', 'paciente nombre'],
  dni: ['dni', 'documento de identidad', 'carnet de extranjeria', 'identidad', 'documento'],
  tipo: ['tipo', 'clasificacion', 'servicio', 'med procedencia'],
  area: ['area', 'especialidad', 'esp'],
  cliente: ['cliente', 'clinica', 'hospital', 'empresa', 'clinicas y hospitales'],
  horaInicio: ['h.inicio', 'hora inicio', 'h inicio programada', 'h.i programado',
    'h.inicio programada', 'horini', 'hora de inicio', 'h.i.', 'hora salida'],
  horaFin: ['h.termino', 'h. termino', 'hora final', 'hora fin', 'horfin',
    'h.f. programado', 'h.termino programado', 'h termino programada',
    'hora llegada', 'llegada', 'h.f.'],
  conductor: ['conductor', 'chofer', 'driver', 'conductor asignado', 'conductor asignado sm', 'zuris'],
  turno: ['turno', 'shift', 'cobertura de turno', 'cobertura turno'],
  ubicacion: ['descripcion', 'ubicacion', 'lugar', 'destino'],
  dirRecojo: ['direccion inicial', 'd.i', 'd. inicial', 'direccion de recojo', 'direccion recojo',
    'dir recojo', 'direccion_recojo'],
  dirDestino: ['direccion final', 'd.f', 'd. final', 'direccion termino', 'direccion_destino',
    'dir destino', 'dir final'],
  distrito: ['distrito'],
  botiquin: ['botiquin', 'botiquin/otro', 'botiquin / otro dato'],
  procedencia: ['procedencia'],
  celCi: ['cel c.i.', 'celular c.i', 'cel ci', 'celular ci'],
  celPersonal: ['cel personal', 'celular personal'],
  observaciones: ['obs', 'observaciones', 'observacion'],
  placa: ['placa', 'numero de placa', 'placa vehiculo', 'placa auto', 'placa del vehiculo',
    'vehiculo placa', 'n° placa', 'nro placa', 'placa del conductor'],
  conductorDni: ['dni conductor', 'conductor dni', 'documento conductor', 'dni del conductor',
    'dni chofer', 'chofer dni', 'dni del chofer', 'dni zuris', 'doc conductor',
    'dni transporte', 'documento chofer'],
  coolerTipo: ['tipo de cooler', 'cooler'],
  coolerCantidad: ['#cooler', 'cooler cantidad', 'num cooler'],
  especialidadOtro: ['especialidad/ otro', 'especialidad otro', 'esp otro'],
  calificacion: ['calificacion'],
  motivoNoSale: ['detallar motivo xq nos sale', 'detallar motivo xq no sale',
    'detallar motivo porque no sale']
};

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================
function normalizar(texto: string): string {
  if (!texto) return '';
  return texto.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function similitud(str1: string, str2: string): number {
  const s1 = normalizar(str1);
  const s2 = normalizar(str2);
  if (s1 === s2) return 100;
  if (s1.includes(s2) || s2.includes(s1)) return 90;
  const p1 = s1.split(' ');
  const p2Set = new Set(s2.split(' '));
  const comunes = p1.filter(p => p2Set.has(p)).length;
  return comunes > 0 ? Math.round((comunes / Math.max(p1.length, p2Set.size)) * 80) : 0;
}

function encontrarCol(headers: string[], campo: string, despuesDe: number = -1): number {
  const aliases = ALIASES[campo];
  if (!aliases) return -1;
  let mejor = -1, mejorScore = 0;
  const inicio = despuesDe >= 0 ? despuesDe + 1 : 0;
  for (let i = inicio; i < headers.length; i++) {
    if (!headers[i]) continue;
    for (const alias of aliases) {
      const score = similitud(headers[i], alias);
      if (score > mejorScore && score >= 65) {
        mejorScore = score;
        mejor = i;
      }
    }
  }
  return mejor;
}

function detectarEncabezados(ws: XLSX.WorkSheet): number {
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  let mejor = 0, maxCols = 0;
  for (let i = 0; i < Math.min(30, data.length); i++) {
    const row = data[i] as any[];
    const filled = row.filter(c => c !== '' && c != null).length;
    if (filled > maxCols && filled >= 5) {
      maxCols = filled;
      mejor = i;
    }
  }
  return mejor;
}

function extraerHeaders(ws: XLSX.WorkSheet, fila: number): string[] {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  const headers: string[] = [];
  for (let C = 0; C <= range.e.c; C++) {
    const addr = XLSX.utils.encode_cell({ r: fila, c: C });
    const cell = ws[addr];
    headers.push(cell?.v ? String(cell.v).trim() : '');
  }
  return headers;
}

function convertirHora(val: any): string | null {
  if (!val && val !== 0) return null;
  if (typeof val === 'number' && val < 1) {
    const mins = Math.round(val * 24 * 60);
    return String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0');
  }
  if (typeof val === 'number' && val >= 1) {
    // Excel serial time > 1 day
    const totalMins = Math.round((val % 1) * 24 * 60);
    return String(Math.floor(totalMins / 60)).padStart(2, '0') + ':' + String(totalMins % 60).padStart(2, '0');
  }
  if (typeof val === 'string') {
    const m = val.match(/(\d{1,2}):?(\d{2})?/);
    if (m) return m[1].padStart(2, '0') + ':' + (m[2] || '00').padStart(2, '0');
  }
  return null;
}

function convertirFecha(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'number') {
    const d = new Date((val - 25569) * 86400 * 1000);
    return d.toISOString().split('T')[0];
  }
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  if (typeof val === 'string') {
    // DD-MM-YYYY o DD/MM/YYYY
    const m = val.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
    if (m) return m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
    // YYYY-MM-DD
    const m2 = val.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if (m2) return m2[1] + '-' + m2[2].padStart(2, '0') + '-' + m2[3].padStart(2, '0');
  }
  return null;
}

function parsearUbicacion(ubicacion: string): { origen: string; destino: string } {
  if (!ubicacion) return { origen: '', destino: '' };
  const partes = ubicacion.split('/');
  if (partes.length >= 2) {
    return { origen: partes[0].trim(), destino: partes.slice(1).join('/').trim() };
  }
  return { origen: ubicacion.trim(), destino: '' };
}

// ============================================================================
// HANDLER POST - Upload Excel
// ============================================================================
export async function POST(req: NextRequest) {
  const client = new Client(DB_CONFIG);
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer);
    const ws = wb.Sheets[wb.SheetNames[0]];

    // Detectar fila de encabezados automáticamente
    const filaH = detectarEncabezados(ws);
    const headers = extraerHeaders(ws, filaH);

    // Mapear columnas usando sinónimos
    const mapeo: Record<string, number> = {};
    for (const campo of Object.keys(ALIASES)) {
      mapeo[campo] = encontrarCol(headers, campo);
    }

    // ── Detección posicional inteligente ──
    // Cuando hay DOS columnas "DNI" (una para doctor, otra para conductor),
    // el mapeo genérico solo captura la primera. Detectamos la segunda
    // buscando columnas "DNI" y "PLACA" que estén DESPUÉS de la columna "conductor".
    if (mapeo.conductor >= 0) {
      const posCondCol = mapeo.conductor;

      // Si conductorDni no encontró match específico o apunta ANTES del conductor,
      // buscar una columna "DNI" después de la columna conductor
      if (mapeo.conductorDni < 0 || mapeo.conductorDni <= posCondCol) {
        const dniDespuesCond = encontrarCol(headers, 'dni', posCondCol);
        if (dniDespuesCond >= 0 && dniDespuesCond !== mapeo.dni) {
          mapeo.conductorDni = dniDespuesCond;
        }
      }

      // Si la placa apunta ANTES del conductor, buscar una después
      if (mapeo.placa < 0 || mapeo.placa < posCondCol) {
        const placaDespuesCond = encontrarCol(headers, 'placa', posCondCol);
        if (placaDespuesCond >= 0) {
          mapeo.placa = placaDespuesCond;
        }
      }
    }

    console.log('[Import] Mapeo detectado:', Object.entries(mapeo)
      .filter(([, v]) => v >= 0)
      .map(([k, v]) => `${k}→col${v}:"${headers[v]}"`).join(', '));

    // Validar que al menos hay doctor o paciente
    if (mapeo.doctor < 0 && mapeo.paciente < 0) {
      return NextResponse.json({
        error: 'No se detectó columna de doctor/médico ni paciente',
        headers: headers.filter(h => h),
        mapeoDetectado: Object.entries(mapeo)
          .filter(([, v]) => v >= 0)
          .map(([k, v]) => ({ campo: k, columna: headers[v] }))
      }, { status: 400 });
    }

    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    const filas = data.slice(filaH + 1);

    await client.connect();

    // ── PREVENIR DUPLICADOS DE ARCHIVO ──────────────────────────────
    // Si ya existe una importación con el mismo nombre de archivo, rechazar
    const dupCheck = await client.query(
      `SELECT id, codigo_zuri, estado, created_at FROM importaciones_excel
       WHERE nombre_archivo = $1 ORDER BY id DESC LIMIT 1`,
      [file.name]
    );
    if (dupCheck.rows.length > 0) {
      const dup = dupCheck.rows[0];
      await client.end();
      return NextResponse.json({
        error: `Este archivo ya fue importado (${dup.codigo_zuri}, estado: ${dup.estado}). Elimina la importación anterior para volver a importar.`,
        duplicado: true,
        importacionExistente: { id: dup.id, codigo: dup.codigo_zuri, estado: dup.estado }
      }, { status: 400 });
    }

    // Crear registro de importación
    const codigoZuri = `ZURI-IMP-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(Date.now()).slice(-4)}`;
    const impRes = await client.query(
      `INSERT INTO importaciones_excel (codigo_zuri, nombre_archivo, total_registros, estado)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [codigoZuri, file.name, filas.length, 'PROCESANDO']
    );
    const impId = impRes.rows[0].id;

    let procesados = 0, errores = 0;
    const doctoresNuevos: string[] = [];
    const conductoresNuevos: string[] = [];
    const erroresDetalle: any[] = [];

    for (let idx = 0; idx < filas.length; idx++) {
      const fila = filas[idx] as any[];
      if (!fila || fila.every(c => !c && c !== 0)) continue;

      const doctorRaw = mapeo.doctor >= 0 ? fila[mapeo.doctor] : null;
      const pacienteRaw = mapeo.paciente >= 0 ? fila[mapeo.paciente] : null;

      // Saltar filas sin doctor ni paciente
      if (!doctorRaw && !pacienteRaw) continue;

      try {
        // ─── DOCTOR ────────────────────────────────────────────────────────────
        let docId: number | null = null;
        let doctorEsNuevo = false;
        const doctorNombre = doctorRaw ? String(doctorRaw).trim() : 'Sin asignar';

        // DNI del doctor: usar mapeo.dni (primera columna DNI, antes del conductor)
        const docDniRaw = mapeo.dni >= 0
          ? String(fila[mapeo.dni] || '').trim().replace(/[^a-zA-Z0-9]/g, '')
          : '';

        if (doctorRaw) {
          let docRes: any = null;

          // 1️⃣ Buscar por DNI real si existe
          if (docDniRaw && docDniRaw.length >= 6) {
            docRes = await client.query(
              `SELECT id, estado FROM doctores WHERE dni = $1 LIMIT 1`,
              [docDniRaw]
            );
          }

          // 2️⃣ Buscar por nombre_completo si DNI no encontró
          if (!docRes || docRes.rows.length === 0) {
            docRes = await client.query(
              `SELECT id, estado FROM doctores
               WHERE UPPER(nombre_completo) = $1
               ORDER BY CASE WHEN estado = 'ACTIVO'   THEN 0
                              WHEN estado = 'ELIMINADO' THEN 2
                              ELSE 1 END
               LIMIT 1`,
              [doctorNombre.toUpperCase()]
            );
          }

          if (docRes.rows.length > 0 && docRes.rows[0].estado !== 'ELIMINADO') {
            docId = docRes.rows[0].id;
            // Actualizar DNI real si lo teníamos vacío
            if (docDniRaw) {
              await client.query(
                `UPDATE doctores SET dni = $1, updated_at = NOW()
                 WHERE id = $2 AND (dni IS NULL OR dni LIKE 'TEMP%' OR dni = '')`,
                [docDniRaw, docId]
              );
            }
          } else {
            // No existe → crear nuevo con nombre parseado
            let apellido = 'ImportadoExcel';
            let apellidoMat: string | null = null;
            let nombres = 'Temporal';

            if (doctorNombre.includes(',')) {
              const [aps, noms] = doctorNombre.split(',').map((s: string) => s.trim());
              const apParts = aps.split(/\s+/);
              apellido = apParts[0] || 'ImportadoExcel';
              apellidoMat = apParts.slice(1).join(' ') || null;
              nombres = noms || 'Temporal';
            } else {
              const partes = doctorNombre.trim().split(/\s+/);
              if (partes.length >= 3) {
                apellido = partes[0];
                apellidoMat = partes[1];
                nombres = partes.slice(2).join(' ');
              } else if (partes.length === 2) {
                apellido = partes[0];
                nombres = partes[1];
              } else {
                apellido = partes[0] || 'ImportadoExcel';
              }
            }

            // CMP temporal único — prefijo 99 + 5 dígitos del timestamp + random
            const cmpTemp = '99' + Date.now().toString().slice(-5) + Math.floor(Math.random() * 9);
            // DNI: usar el real del Excel si existe, sino generar hash determinístico
            let dniDocFinal = docDniRaw || '';
            if (!dniDocFinal) {
              let h = 0;
              for (let ci = 0; ci < doctorNombre.length; ci++) {
                h = ((h << 5) - h + doctorNombre.charCodeAt(ci)) | 0;
              }
              dniDocFinal = 'D' + Math.abs(h).toString().padStart(7, '0').substring(0, 7);
            }

            // Verificar si ya existe por DNI antes de insertar
            const dniCheck = await client.query(
              `SELECT id FROM doctores WHERE dni = $1 LIMIT 1`,
              [dniDocFinal]
            );
            let newDoc: any;
            if (dniCheck.rows.length > 0) {
              newDoc = { rows: [{ id: dniCheck.rows[0].id }] };
            } else {
              newDoc = await client.query(
                `INSERT INTO doctores (dni, cmp, nombres, apellido_paterno, apellido_materno, estado)
                 VALUES ($1, $2, $3, $4, $5, 'ACTIVO')
                 ON CONFLICT (cmp) DO UPDATE
                   SET nombres = EXCLUDED.nombres, updated_at = NOW()
                 RETURNING id`,
                [dniDocFinal, cmpTemp, nombres, apellido, apellidoMat]
              );
            }
            docId = newDoc.rows[0].id;
            doctorEsNuevo = true;
            doctoresNuevos.push(doctorNombre);
          }
        }

        // ====================================================================
        // AUTO-SYNC CONDUCTORES: Buscar o crear conductor desde el Excel
        // Prioridad: DNI > Nombre completo > Crear nuevo con estado PENDIENTE
        // ====================================================================
        let conductorId: number | null = null;
        let conductorNombre: string | null = null;
        let conductorDniReal: string | null = null; // DNI real del Excel para guardar en la solicitud
        let conductorEsNuevo = false;

        const condNombreRaw = mapeo.conductor >= 0 ? fila[mapeo.conductor] : null;
        // conductorDni EXCLUSIVO para el conductor (NO usar mapeo.dni que es del doctor)
        const condDniRaw = mapeo.conductorDni >= 0 ? fila[mapeo.conductorDni] : null;
        const condPlacaRaw = mapeo.placa >= 0 ? String(fila[mapeo.placa] || '').trim() : null;

        if (condNombreRaw || condDniRaw) {
          const condNombre = condNombreRaw ? String(condNombreRaw).trim() : '';
          // BUG FIX 2: preservar DNI alfanumérico completo (ej: E12345678) — solo limpiar
          // espacios y caracteres raros, NO truncar solo dígitos
          const condDniClean = condDniRaw
            ? String(condDniRaw).trim().replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)
            : '';

          let condRes: any = null;

          // 1️⃣ Buscar por DNI exacto (más preciso)
          if (condDniClean && condDniClean.length >= 6) {
            condRes = await client.query(
              `SELECT id, "nombreCompleto", placa FROM conductores WHERE dni = $1 LIMIT 1`,
              [condDniClean]
            );
          }

          // 2️⃣ Buscar por nombre completo si DNI no encontró nada
          if ((!condRes || condRes.rows.length === 0) && condNombre) {
            condRes = await client.query(
              `SELECT id, "nombreCompleto", placa FROM conductores
               WHERE UPPER(TRIM("nombreCompleto")) = $1
                  OR UPPER(TRIM("nombreCompleto")) LIKE $2
               ORDER BY id ASC LIMIT 1`,
              [condNombre.toUpperCase(), '%' + condNombre.toUpperCase() + '%']
            );
          }

          if (condRes && condRes.rows.length > 0) {
            // ✅ Conductor ya existe: reusar
            conductorId = condRes.rows[0].id;
            conductorNombre = condRes.rows[0].nombreCompleto;

            // Si el conductor tiene DNI hash temporal y ahora tenemos el real → actualizar
            const dniActual = condRes.rows[0].dni || '';
            const tieneHashDni = /^[TXD]\d+$/.test(dniActual);
            if (condDniClean && condDniClean.length >= 6 && tieneHashDni) {
              // Verificar que no exista otro conductor con ese DNI real antes de actualizar
              const dniConflict = await client.query(
                `SELECT id FROM conductores WHERE dni = $1 AND id != $2 LIMIT 1`,
                [condDniClean, conductorId]
              );
              if (dniConflict.rows.length === 0) {
                await client.query(
                  `UPDATE conductores SET dni = $1, "updatedAt" = NOW() WHERE id = $2`,
                  [condDniClean, conductorId]
                );
              }
            }
            conductorDniReal = (condDniClean && condDniClean.length >= 6) ? condDniClean : null;

            // Actualizar placa si viene del Excel y el conductor no tenía
            if (condPlacaRaw && !condRes.rows[0].placa) {
              await client.query(
                `UPDATE conductores SET placa = $1, vehiculo_placa = $1, "updatedAt" = NOW() WHERE id = $2`,
                [condPlacaRaw, conductorId]
              );
            }
          } else if (condNombre) {
            // ❌ No existe → Crear conductor nuevo con datos del Excel
            // Parsear nombre en formato peruano: APELLIDO1 APELLIDO2 NOMBRE1 NOMBRE2
            let nombres = 'Importado';
            let apellidos = condNombre;

            const partes = condNombre.trim().split(/\s+/);
            if (partes.length >= 4) {
              apellidos = partes.slice(0, 2).join(' ');
              nombres = partes.slice(2).join(' ');
            } else if (partes.length === 3) {
              apellidos = partes.slice(0, 2).join(' ');
              nombres = partes[2];
            } else if (partes.length === 2) {
              apellidos = partes[0];
              nombres = partes[1];
            }

            // BUG FIX 3: DNI provisional con máximo 8 chars (varchar(8) constraint)
            // Usamos hash del nombre para que el mismo conductor en distintas filas
            // genere el mismo temp-DNI y no se duplique
            let dniParaConductor = condDniClean;
            if (!dniParaConductor) {
              // Hash determinístico basado en nombre → máx 8 chars
              let h = 0;
              for (let ci = 0; ci < condNombre.length; ci++) {
                h = ((h << 5) - h + condNombre.charCodeAt(ci)) | 0;
              }
              dniParaConductor = 'X' + Math.abs(h).toString().padStart(7, '0').substring(0, 7);
            }

            const newCond = await client.query(
              `INSERT INTO conductores (
                 dni, "nombreCompleto", nombres, apellidos,
                 placa, vehiculo_placa,
                 estado, "createdAt", "updatedAt"
               ) VALUES (
                 $1, $2, $3, $4,
                 $5, $5,
                 'ACTIVO', NOW(), NOW()
               )
               ON CONFLICT (dni) DO UPDATE
                 SET "nombreCompleto" = EXCLUDED."nombreCompleto",
                     placa            = COALESCE(NULLIF(EXCLUDED.placa, ''), conductores.placa),
                     vehiculo_placa   = COALESCE(NULLIF(EXCLUDED.vehiculo_placa, ''), conductores.vehiculo_placa),
                     "updatedAt"      = NOW()
               RETURNING id, "nombreCompleto"`,
              [
                dniParaConductor,
                condNombre,
                nombres,
                apellidos,
                condPlacaRaw || null
              ]
            );
            conductorId = newCond.rows[0].id;
            conductorNombre = newCond.rows[0].nombreCompleto;
            conductorDniReal = (condDniClean && condDniClean.length >= 6) ? condDniClean : null;
            conductorEsNuevo = true;
            conductoresNuevos.push(condNombre);
          } else {
            conductorNombre = condDniClean || null;
          }
        }

        // Parsear ubicación (ORIGEN/DESTINO)
        const ubicacionRaw = mapeo.ubicacion >= 0 ? String(fila[mapeo.ubicacion] || '') : '';
        const { origen, destino } = parsearUbicacion(ubicacionRaw);

        // Insertar solicitud
        await client.query(`
          INSERT INTO solicitudes_servicios (
            importacion_id, fecha, hora_inicio, hora_fin, turno,
            doctor_id, doctor_nombre, doctor_es_nuevo,
            paciente_nombre, paciente_dni, paciente_telefono,
            cliente_nombre, tipo_servicio, area, descripcion,
            ubicacion, distrito,
            direccion_recojo, distrito_recojo,
            direccion_destino, distrito_destino,
            conductor_id, conductor_nombre, conductor_dni,
            botiquin, celular_ci, celular_personal, placa,
            procedencia, especialidad_otro,
            cooler_tipo, cooler_cantidad,
            estado, observaciones
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8,
            $9, $10, $11,
            $12, $13, $14, $15,
            $16, $17,
            $18, $19,
            $20, $21,
            $22, $23, $24,
            $25, $26, $27, $28,
            $29, $30,
            $31, $32,
            $33, $34
          )
        `, [
          impId,
          mapeo.fecha >= 0 ? convertirFecha(fila[mapeo.fecha]) : null,
          mapeo.horaInicio >= 0 ? convertirHora(fila[mapeo.horaInicio]) : null,
          mapeo.horaFin >= 0 ? convertirHora(fila[mapeo.horaFin]) : null,
          mapeo.turno >= 0 ? String(fila[mapeo.turno] || '').trim() : null,
          docId,
          doctorNombre,
          doctorEsNuevo,
          mapeo.paciente >= 0 ? String(fila[mapeo.paciente] || '').trim() : null,
          mapeo.dni >= 0 ? String(fila[mapeo.dni] || '').trim() : null,
          null, // paciente_telefono
          mapeo.cliente >= 0 ? String(fila[mapeo.cliente] || '').trim() : 'SANNA',
          mapeo.tipo >= 0 ? String(fila[mapeo.tipo] || '').trim() : 'MAD',
          mapeo.area >= 0 ? String(fila[mapeo.area] || '').trim() : null,
          ubicacionRaw || null,
          ubicacionRaw || null,
          mapeo.distrito >= 0 ? String(fila[mapeo.distrito] || '').trim() : null,
          mapeo.dirRecojo >= 0 ? String(fila[mapeo.dirRecojo] || '').trim() : (origen || null),
          origen || null,
          mapeo.dirDestino >= 0 ? String(fila[mapeo.dirDestino] || '').trim() : (destino || null),
          destino || null,
          conductorId,
          conductorNombre,
          conductorDniReal,
          mapeo.botiquin >= 0 ? String(fila[mapeo.botiquin] || '').trim() : null,
          mapeo.celCi >= 0 ? String(fila[mapeo.celCi] || '').trim() : null,
          mapeo.celPersonal >= 0 ? String(fila[mapeo.celPersonal] || '').trim() : null,
          mapeo.placa >= 0 ? String(fila[mapeo.placa] || '').trim() : null,
          mapeo.procedencia >= 0 ? String(fila[mapeo.procedencia] || '').trim() : null,
          mapeo.especialidadOtro >= 0 ? String(fila[mapeo.especialidadOtro] || '').trim() : null,
          mapeo.coolerTipo >= 0 ? String(fila[mapeo.coolerTipo] || '').trim() : null,
          mapeo.coolerCantidad >= 0 ? (parseInt(String(fila[mapeo.coolerCantidad])) || null) : null,
          conductorId ? 'PROGRAMADO' : 'PENDIENTE',
          mapeo.observaciones >= 0 ? String(fila[mapeo.observaciones] || '').trim() : null
        ]);

        procesados++;
      } catch (err: any) {
        errores++;
        erroresDetalle.push({ fila: idx + filaH + 2, error: err.message });
        console.error(`Error fila ${idx + filaH + 2}:`, err.message);
      }
    }

    // Actualizar importación con resultados
    await client.query(
      `UPDATE importaciones_excel SET
        estado = $1, registros_procesados = $2, registros_error = $3,
        doctores_nuevos = $4, errores_json = $5, updated_at = NOW()
       WHERE id = $6`,
      [
        procesados > 0 ? 'COMPLETADO' : 'ERROR',
        procesados, errores, doctoresNuevos.length,
        JSON.stringify({ errores: erroresDetalle, conductores_nuevos: conductoresNuevos }), impId
      ]
    );

    await client.end();

    return NextResponse.json({
      success: true,
      codigoZuri,
      importacionId: impId,
      procesados,
      errores,
      doctoresNuevos: doctoresNuevos.length,
      conductoresNuevos: conductoresNuevos.length,
      conductoresNuevosLista: conductoresNuevos,
      mapeoDetectado: Object.entries(mapeo)
        .filter(([, v]) => v >= 0)
        .map(([k, v]) => ({ campo: k, columna: headers[v] }))
    });
  } catch (error: any) {
    try { await client.end(); } catch { }
    console.error('Error upload:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
