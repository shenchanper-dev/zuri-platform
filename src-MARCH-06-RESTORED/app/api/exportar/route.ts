import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

function horaATexto(hora: string): string {
  return hora; // "06:00" formato texto
}

// ============================================================================
// GET: Generic Export (Excel/PDF) with filters
// ============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const formato = searchParams.get('formato') || 'excel';
  const fecha = searchParams.get('fecha');
  const estado = searchParams.get('estado');
  const clienteEspecialId = searchParams.get('cliente_especial_id');
  const programacionId = searchParams.get('programacion_id');

  const client = new Client(DB_CONFIG);

  try {
    await client.connect();

    // Build query
    let query = `
      SELECT 
        p.id, p.codigo_programacion, 
        TO_CHAR(p.fecha_programacion, 'DD/MM/YYYY') as fecha,
        p.cliente_especial_id, p.estado, p.notas,
        ce.nombre as cliente_nombre,
        COUNT(pd.id) as total_servicios,
        COUNT(CASE WHEN pd.conductor_id IS NOT NULL THEN 1 END) as servicios_asignados,
        COUNT(CASE WHEN pd.estado = 'COMPLETADO' THEN 1 END) as servicios_completados,
        STRING_AGG(DISTINCT pd.conductor_nombre, ', ') as conductores
      FROM programaciones p
      LEFT JOIN clientes_especiales ce ON p.cliente_especial_id = ce.id
      LEFT JOIN programacion_detalles pd ON pd.programacion_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;

    if (programacionId) {
      query += ` AND p.id = $${idx}`;
      params.push(parseInt(programacionId));
      idx++;
    }
    if (fecha) {
      query += ` AND p.fecha_programacion = $${idx}`;
      params.push(fecha);
      idx++;
    }
    if (estado) {
      query += ` AND p.estado = $${idx}`;
      params.push(estado);
      idx++;
    }
    if (clienteEspecialId) {
      query += ` AND p.cliente_especial_id = $${idx}`;
      params.push(parseInt(clienteEspecialId));
      idx++;
    }

    query += ` GROUP BY p.id, ce.nombre ORDER BY p.fecha_programacion DESC, p.id DESC`;

    const result = await client.query(query, params);
    await client.end();

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No se encontraron programaciones' }, { status: 404 });
    }

    // Generate file based on format
    if (formato === 'excel') {
      return generateGenericExcel(result.rows);
    } else if (formato === 'pdf') {
      return generateGenericPDF(result.rows);
    } else {
      return NextResponse.json({ error: 'Formato no soportado. Use: excel o pdf' }, { status: 400 });
    }

  } catch (error: any) {
    try { await client.end(); } catch { }
    console.error('[Export API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// POST: SANNA-specific Export (existing)
// ============================================================================


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

// ============================================================================
// HELPER FUNCTIONS FOR GENERIC EXPORT
// ============================================================================

function generateGenericExcel(data: any[]) {
  // Prepare data for Excel
  const excelData = data.map(row => ({
    'Código': row.codigo_programacion,
    'Fecha': row.fecha,
    'Cliente': row.cliente_nombre || 'N/A',
    'Estado': row.estado,
    'Total Servicios': row.total_servicios,
    'Asignados': row.servicios_asignados,
    'Completados': row.servicios_completados,
    'Conductores': row.conductores || 'Sin asignar',
    'Notas': row.notas || ''
  }));

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // Código
    { wch: 12 }, // Fecha
    { wch: 20 }, // Cliente
    { wch: 15 }, // Estado
    { wch: 15 }, // Total Servicios
    { wch: 12 }, // Asignados
    { wch: 12 }, // Completados
    { wch: 30 }, // Conductores
    { wch: 40 }  // Notas
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Programaciones');

  // Generate buffer
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  // Return as download
  const filename = `programaciones_${new Date().toISOString().split('T')[0]}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

function generateGenericPDF(data: any[]) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('ZURI - Programaciones', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 105, 28, { align: 'center' });

  // Stats summary
  const totalProgramaciones = data.length;
  const totalServicios = data.reduce((sum, row) => sum + parseInt(row.total_servicios || 0), 0);
  const totalAsignados = data.reduce((sum, row) => sum + parseInt(row.servicios_asignados || 0), 0);
  const totalCompletados = data.reduce((sum, row) => sum + parseInt(row.servicios_completados || 0), 0);

  doc.setFontSize(9);
  doc.text(`Total Programaciones: ${totalProgramaciones}`, 14, 38);
  doc.text(`Total Servicios: ${totalServicios}`, 14, 43);
  doc.text(`Asignados: ${totalAsignados}`, 14, 48);
  doc.text(`Completados: ${totalCompletados}`, 14, 53);

  // Simple table header
  let y = 65;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Código', 14, y);
  doc.text('Fecha', 45, y);
  doc.text('Cliente', 70, y);
  doc.text('Estado', 110, y);
  doc.text('Total', 140, y);
  doc.text('Asig.', 160, y);
  doc.text('Compl.', 180, y);

  // Line under header
  doc.line(14, y + 2, 195, y + 2);
  y += 8;

  // Table rows
  doc.setFont('helvetica', 'normal');
  data.forEach((row, idx) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.text(row.codigo_programacion.substring(0, 12), 14, y);
    doc.text(row.fecha, 45, y);
    doc.text((row.cliente_nombre || 'N/A').substring(0, 15), 70, y);
    doc.text(row.estado.substring(0, 12), 110, y);
    doc.text(String(row.total_servicios), 140, y);
    doc.text(String(row.servicios_asignados), 160, y);
    doc.text(String(row.servicios_completados), 180, y);

    y += 6;
  });

  // Generate buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

  // Return as download
  const filename = `programaciones_${new Date().toISOString().split('T')[0]}.pdf`;

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

