#!/bin/bash
echo "Creando exportador con formato EXACTO Sábado..."

cat > src/app/api/programaciones/exportar/route.ts << 'EOFAPI'
import { NextResponse } from 'next/server';
import { Client } from 'pg';
import * as XLSX from 'xlsx';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

function horaADecimal(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return (h + m / 60) / 24;
}

export async function POST(request: Request) {
  const client = new Client(DB_CONFIG);
  
  try {
    const { programacionId } = await request.json();
    
    await client.connect();
    
    const progResult = await client.query('SELECT * FROM programaciones WHERE id = $1', [programacionId]);
    if (progResult.rows.length === 0) {
      await client.end();
      return NextResponse.json({ error: 'Programación no encontrada' }, { status: 404 });
    }
    
    const programacion = progResult.rows[0];
    
    const detallesResult = await client.query(`
      SELECT 
        pd.*,
        ts.nombre as tipo_servicio,
        ce.nombre as cliente_especial,
        ar.nombre as area,
        c."nombreCompleto" as conductor_nombre,
        cal.descripcion as calificacion
      FROM programacion_detalles pd
      LEFT JOIN tipos_servicio ts ON pd.tipo_servicio_id = ts.id
      LEFT JOIN clientes_especiales ce ON pd.cliente_especial_id = ce.id
      LEFT JOIN areas_servicio ar ON pd.area_servicio_id = ar.id
      LEFT JOIN conductores c ON pd.conductor_id = c.id
      LEFT JOIN calificaciones cal ON pd.calificacion_id = cal.id
      WHERE pd.programacion_id = $1
      ORDER BY pd.area_servicio_id, pd.fecha, pd.hora_inicio
    `, [programacionId]);
    
    await client.end();
    
    const wb = XLSX.utils.book_new();
    
    // ENCABEZADOS EXACTOS del formato Sábado
    const encabezados = [
      'FECHA', 'CLIENTE', 'CLASIFICACION', 'AREA', 'TIPO', 'ESPECIALIDAD/otro',
      'TURNO', 'USUARIO', 'CELULAR', 'BOTIQUIN/ otro dato', 
      'H.INICIO programada', 'H. TERMINO programada', 'CANT. Pacientes',
      'CONDUCTOR',
      'H. UBICACIÓN EN BASE - LLEGADA',
      'H. UBICACIÓN RECOJO USUARIO',
      'H. UBICACIÓN  DEJANDO USUARIO',
      'H. UBICACIÓN EN BASE - TERMINO',
      'CALIFICACION', 'OBS', 'A'
    ];
    
    const datos: any[][] = [encabezados];
    
    // DATOS
    detallesResult.rows.forEach((detalle, idx) => {
      const fecha = new Date(detalle.fecha);
      const fechaExcel = Math.floor((fecha.getTime() / 86400000) + 25569);
      
      datos.push([
        fechaExcel,
        detalle.cliente_especial || 'SANNA',
        'POR HORAS',
        detalle.area || 'MEDICINA',
        detalle.tipo_servicio || 'MAD',
        'AGUDO',
        detalle.turno || 'M',
        detalle.doctor_nombre,
        '',
        '',
        horaADecimal(detalle.hora_inicio),
        horaADecimal(detalle.hora_fin),
        '',
        detalle.conductor_nombre || '',
        '', // H. UBICACIÓN EN BASE - LLEGADA
        '', // H. UBICACIÓN RECOJO USUARIO
        '', // H. UBICACIÓN DEJANDO USUARIO
        '', // H. UBICACIÓN EN BASE - TERMINO
        detalle.calificacion || '',
        detalle.observaciones || '',
        idx + 1
      ]);
    });
    
    const ws = XLSX.utils.aoa_to_sheet(datos);
    
    // ANCHOS EXACTOS del formato Sábado
    ws['!cols'] = [
      { wch: 8.57 },   // A: FECHA
      { wch: 5.43 },   // B: CLIENTE
      { wch: 4.00 },   // C: CLASIFICACION
      { wch: 4.00 },   // D: AREA
      { wch: 4.00 },   // E: TIPO
      { wch: 5.29 },   // F: ESPECIALIDAD
      { wch: 2.14 },   // G: TURNO
      { wch: 16.71 },  // H: USUARIO
      { wch: 8.86 },   // I: CELULAR
      { wch: 4.86 },   // J: BOTIQUIN
      { wch: 5.43 },   // K: H.INICIO
      { wch: 5.29 },   // L: H.TERMINO
      { wch: 3.86 },   // M: CANT
      { wch: 29.86 },  // N: CONDUCTOR
      { wch: 4.29 },   // O: H.UBI LLEGADA
      { wch: 4.29 },   // P: H.UBI RECOJO
      { wch: 4.29 },   // Q: H.UBI DEJANDO
      { wch: 4.29 },   // R: H.UBI TERMINO
      { wch: 45.29 },  // S: CALIFICACION
      { wch: 2.43 },   // T: OBS
      { wch: 2.00 }    // U: A
    ];
    
    // Formato de fechas
    for (let R = 1; R < datos.length; R++) {
      const cellA = XLSX.utils.encode_cell({ r: R, c: 0 });
      if (ws[cellA]) {
        ws[cellA].z = 'm/d/yyyy';
        ws[cellA].t = 'n';
      }
      
      const cellK = XLSX.utils.encode_cell({ r: R, c: 10 });
      if (ws[cellK] && ws[cellK].v) {
        ws[cellK].z = 'h:mm';
        ws[cellK].t = 'n';
      }
      
      const cellL = XLSX.utils.encode_cell({ r: R, c: 11 });
      if (ws[cellL] && ws[cellL].v) {
        ws[cellL].z = 'h:mm';
        ws[cellL].t = 'n';
      }
    }
    
    XLSX.utils.book_append_sheet(wb, ws, programacion.codigo_programacion);
    
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${programacion.codigo_programacion}.xlsx"`
      }
    });
    
  } catch (error: any) {
    await client.end();
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFAPI

npm run build && pm2 restart zuri-dev

echo ""
echo "✅ EXPORTADOR FORMATO SÁBADO CREADO"
echo ""
echo "Características:"
echo "  ✓ Anchos exactos: CONDUCTOR 29.86, CALIFICACION 45.29"
echo "  ✓ Columnas ubicación separadas (4 columnas)"
echo "  ✓ Sin Dirección ni Distrito"
echo "  ✓ Formato fechas y horas Excel"
echo ""
echo "Descarga desde: https://admin.zuri.pe/dashboard/programacion"
