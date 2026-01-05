#!/bin/bash
echo "Creando exportador con formato EXACTO del Excel..."

cat > src/app/api/programaciones/exportar/route.ts << 'EOFAPI'
import { NextResponse } from 'next/server';
import { Client } from 'pg';
import * as XLSX from 'xlsx';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

// Convertir hora "HH:MM" a decimal de Excel
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
        c."marcaAuto" as conductor_marca,
        c.placa as conductor_placa,
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
    
    // Crear workbook
    const wb = XLSX.utils.book_new();
    
    // ENCABEZADOS (Fila 1) - EXACTO como el Excel
    const encabezados = [
      'FECHA', 'CLIENTE', 'CLASIFICACION', 'AREA', 'TIPO', 'ESPECIALIDAD/otro',
      'TURNO', 'USUARIO', 'CELULAR', 'BOTIQUIN/ otro dato', 
      'H.INICIO programada', 'H. TERMINO programada', 'CANT. Pacientes',
      'Dirección RECOJO/TERMINO', 'DISTRITO', 'CONDUCTOR',
      'H. UBICACIÓN EN BASE - LLEGADA', 'H. UBICACIÓN EN BASE - TERMINO',
      'CALIFICACION', 'OBS', 'A'
    ];
    
    const datos: any[][] = [encabezados];
    
    // DATOS
    detallesResult.rows.forEach((detalle, idx) => {
      const fecha = new Date(detalle.fecha);
      const fechaExcel = (fecha.getTime() / 86400000) + 25569;
      
      datos.push([
        fechaExcel, // FECHA (número de Excel)
        detalle.cliente_especial || 'SANNA', // CLIENTE
        'POR HORAS', // CLASIFICACION
        detalle.area || 'MEDICINA', // AREA
        detalle.tipo_servicio || 'MAD', // TIPO
        '', // ESPECIALIDAD/otro
        detalle.turno || 'M', // TURNO
        detalle.doctor_nombre, // USUARIO
        '', // CELULAR
        '', // BOTIQUIN
        horaADecimal(detalle.hora_inicio), // H.INICIO (decimal)
        horaADecimal(detalle.hora_fin), // H.TERMINO (decimal)
        '', // CANT. Pacientes
        detalle.ubicacion || '', // Dirección
        '', // DISTRITO
        detalle.conductor_nombre || '', // CONDUCTOR
        '', // H. UBICACIÓN LLEGADA
        '', // H. UBICACIÓN TERMINO
        detalle.calificacion || '', // CALIFICACION
        detalle.observaciones || '', // OBS
        idx + 1 // Contador
      ]);
    });
    
    // Crear hoja
    const ws = XLSX.utils.aoa_to_sheet(datos);
    
    // ANCHOS DE COLUMNA (todos iguales como el original)
    ws['!cols'] = Array(21).fill({ wch: 10.71 });
    
    // ESTILOS - Fila 1 (encabezados)
    const headerStyle = {
      fill: {
        patternType: 'solid',
        fgColor: { theme: 0, tint: -0.35 }
      },
      font: { bold: true }
    };
    
    // Aplicar estilo a encabezados (fila 1)
    for (let C = 0; C < 21; C++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[addr]) ws[addr] = { t: 's', v: '' };
      ws[addr].s = headerStyle;
    }
    
    // ESTILO VERDE para columna CLIENTE (B) con SANNA
    const sannaStyle = {
      fill: {
        patternType: 'solid',
        fgColor: { rgb: '70AD47' }
      }
    };
    
    for (let R = 1; R < datos.length; R++) {
      const cellB = XLSX.utils.encode_cell({ r: R, c: 1 });
      if (ws[cellB] && ws[cellB].v === 'SANNA') {
        ws[cellB].s = sannaStyle;
      }
    }
    
    // Formato de fechas y horas
    for (let R = 1; R < datos.length; R++) {
      // Fecha (columna A)
      const cellA = XLSX.utils.encode_cell({ r: R, c: 0 });
      if (ws[cellA]) {
        ws[cellA].z = 'm/d/yyyy';
        ws[cellA].t = 'n';
      }
      
      // Hora inicio (columna K)
      const cellK = XLSX.utils.encode_cell({ r: R, c: 10 });
      if (ws[cellK]) {
        ws[cellK].z = 'h:mm';
        ws[cellK].t = 'n';
      }
      
      // Hora fin (columna L)
      const cellL = XLSX.utils.encode_cell({ r: R, c: 11 });
      if (ws[cellL]) {
        ws[cellL].z = 'h:mm';
        ws[cellL].t = 'n';
      }
    }
    
    XLSX.utils.book_append_sheet(wb, ws, programacion.codigo_programacion);
    
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', cellStyles: true });
    
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
echo "✅ EXPORTADOR CON FORMATO EXACTO CREADO"
echo ""
echo "Características:"
echo "  ✓ Mismos encabezados que tu Excel"
echo "  ✓ Mismo orden de columnas (A-U)"
echo "  ✓ Fechas en formato Excel"
echo "  ✓ Horas en formato decimal"
echo "  ✓ Color verde para SANNA"
echo "  ✓ Fondo gris en encabezados"
echo "  ✓ Anchos de columna: 10.71 caracteres"
echo ""
echo "Prueba descargando el Excel desde:"
echo "https://admin.zuri.pe/dashboard/programacion"
