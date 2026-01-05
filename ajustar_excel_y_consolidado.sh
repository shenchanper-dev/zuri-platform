#!/bin/bash
echo "Aplicando ajustes finales al exportador..."

# 1. AJUSTAR EXPORTADOR INDIVIDUAL
cat > src/app/api/programaciones/exportar/route.ts << 'EOFAPI'
import { NextResponse } from 'next/server';
import { Client } from 'pg';
import ExcelJS from 'exceljs';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

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
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Programación SANNA');
    
    const headers = [
      'FECHA', 'CLIENTE', 'ÁREA', 'TIPO', 'TURNO', 'USUARIO',
      'BOTIQUÍN/OTRO', 'H.INICIO PROGRAMADA', 'H. TERMINO PROGRAMADA',
      'CONDUCTOR', 
      'H. UBICACIÓN RECOJO',
      'H. UBICACIÓN DEJANDO',
      'CALIFICACIÓN', 'OBS', 'A', 'MAD-SANNA', 'DETALLAR MOTIVO XQ NOS SALE'
    ];
    
    worksheet.columns = headers.map((h, i) => ({
      header: h,
      key: \`col\${i}\`,
      width: i === 5 ? 25 : i === 9 ? 30 : i === 12 ? 45 : i === 16 ? 25 : 12
    }));
    
    const headerRow = worksheet.getRow(1);
    
    const colores = {
      gris: 'FFA5A5A5',
      verde: 'FF92D050',
      azul: 'FF0070C0',
      naranja: 'FFDE6800',
      rojo: 'FFEE0000',
      amarillo: 'FFFFFF00'
    };
    
    const coloresColumnas = [
      null,              // FECHA
      colores.gris,      // CLIENTE
      colores.gris,      // ÁREA
      colores.gris,      // TIPO
      colores.gris,      // TURNO
      colores.gris,      // USUARIO
      colores.gris,      // BOTIQUÍN
      colores.naranja,   // H.INICIO
      colores.naranja,   // H.TERMINO
      colores.azul,      // CONDUCTOR
      colores.amarillo,  // H.UBI RECOJO
      colores.naranja,   // H.UBI DEJANDO
      colores.rojo,      // CALIFICACIÓN
      null,              // OBS
      colores.gris,      // A
      colores.verde,     // MAD-SANNA
      colores.amarillo   // DETALLAR MOTIVO
    ];
    
    headers.forEach((header, idx) => {
      const cell = headerRow.getCell(idx + 1);
      
      cell.font = {
        name: 'Calibri',
        size: 11,
        bold: true,
        color: { argb: 'FF000000' }
      };
      
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
      };
      
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
      
      if (coloresColumnas[idx]) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: coloresColumnas[idx] }
        };
      }
    });
    
    headerRow.height = 30;
    
    detallesResult.rows.forEach((detalle, idx) => {
      const row = worksheet.addRow({
        col0: new Date(detalle.fecha),
        col1: detalle.cliente_especial || 'SANNA',
        col2: detalle.area || 'MEDICINA',
        col3: detalle.tipo_servicio || 'MAD',
        col4: detalle.turno || 'M',
        col5: detalle.doctor_nombre,
        col6: '',
        col7: detalle.hora_inicio,
        col8: detalle.hora_fin,
        col9: detalle.conductor_nombre || '',
        col10: '',
        col11: '',
        col12: detalle.calificacion || '',
        col13: detalle.observaciones || '',
        col14: idx + 1,
        col15: 'MAD-SANNA',
        col16: ''
      });
      
      row.getCell(1).numFmt = 'm/d/yyyy';
      
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    const hoy = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const nombreArchivo = \`\${programacion.codigo_programacion}_\${hoy}.xlsx\`;
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': \`attachment; filename="\${nombreArchivo}"\`
      }
    });
    
  } catch (error: any) {
    await client.end();
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFAPI

echo "✓ Exportador individual actualizado"

npm run build && pm2 restart zuri-dev

echo ""
echo "✅ AJUSTES COMPLETADOS"
