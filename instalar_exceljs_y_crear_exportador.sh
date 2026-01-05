#!/bin/bash
echo "Instalando ExcelJS y creando exportador profesional..."

# 1. Instalar ExcelJS
npm install exceljs@latest --save

# 2. Crear API con formato exacto
cat > src/app/api/programaciones/exportar/route.ts << 'EOFAPI'
import { NextResponse } from 'next/server';
import { Client } from 'pg';
import ExcelJS from 'exceljs';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

function horaATexto(hora: string): string {
  return hora; // "06:00" formato texto
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
    
    // Crear workbook con ExcelJS
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Programación SANNA');
    
    // ENCABEZADOS EXACTOS según imagen
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
      key: `col${i}`,
      width: i === 9 ? 30 : i === 12 ? 45 : i === 16 ? 25 : 12
    }));
    
    // ESTILOS DE ENCABEZADO
    const headerRow = worksheet.getRow(1);
    
    const colores = {
      gris: 'FFA5A5A5',
      verde: 'FF92D050',
      azul: 'FF0070C0',
      naranja: 'FFDE6800',
      rojo: 'FFEE0000',
      amarillo: 'FFFFFF00'
    };
    
    // Asignar colores según columna
    const coloresColumnas = [
      null,              // FECHA
      colores.gris,      // CLIENTE
      colores.gris,      // ÁREA
      colores.gris,      // TIPO
      colores.gris,      // TURNO
      colores.gris,      // USUARIO
      colores.verde,     // BOTIQUÍN
      colores.azul,      // H.INICIO
      colores.naranja,   // H.TERMINO
      colores.azul,      // CONDUCTOR
      colores.amarillo,  // H.UBI RECOJO
      colores.rojo,      // H.UBI DEJANDO
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
    
    // Altura de fila de encabezado
    headerRow.height = 30;
    
    // AGREGAR DATOS
    detallesResult.rows.forEach((detalle, idx) => {
      const row = worksheet.addRow({
        col0: new Date(detalle.fecha),
        col1: detalle.cliente_especial || 'SANNA',
        col2: detalle.area || 'MEDICINA',
        col3: detalle.tipo_servicio || 'MAD',
        col4: detalle.turno || 'M',
        col5: detalle.doctor_nombre,
        col6: '',
        col7: horaATexto(detalle.hora_inicio),
        col8: horaATexto(detalle.hora_fin),
        col9: detalle.conductor_nombre || '',
        col10: '',
        col11: '',
        col12: detalle.calificacion || '',
        col13: detalle.observaciones || '',
        col14: idx + 1,
        col15: 'MAD-SANNA',
        col16: ''
      });
      
      // Formato fecha
      row.getCell(1).numFmt = 'm/d/yyyy';
      
      // Bordes en todas las celdas de datos
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
      });
    });
    
    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();
    
    return new NextResponse(buffer, {
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
echo "✅ EXPORTADOR PROFESIONAL CON ESTILOS CREADO"
echo ""
echo "Características:"
echo "  ✓ Colores exactos según imagen (gris, verde, azul, naranja, rojo, amarillo)"
echo "  ✓ Fuente: Calibri 11pt negrita"
echo "  ✓ Centrado y bordes negros"
echo "  ✓ Anchos ajustados (Conductor: 30, Calificación: 45)"
echo ""
echo "Descarga desde: https://admin.zuri.pe/dashboard/programacion"
