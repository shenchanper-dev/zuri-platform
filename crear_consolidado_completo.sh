#!/bin/bash
echo "Creando API de consolidado y botón..."

# 1. CREAR API DE CONSOLIDADO
mkdir -p src/app/api/programaciones/exportar-consolidado

cat > src/app/api/programaciones/exportar-consolidado/route.ts << 'EOFAPI'
import { NextResponse } from 'next/server';
import { Client } from 'pg';
import ExcelJS from 'exceljs';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function POST(request: Request) {
  const client = new Client(DB_CONFIG);
  
  try {
    const { fecha } = await request.json();
    
    await client.connect();
    
    const programacionesResult = await client.query(
      'SELECT * FROM programaciones WHERE DATE(fecha_programacion) = $1 ORDER BY codigo_programacion',
      [fecha]
    );
    
    if (programacionesResult.rows.length === 0) {
      await client.end();
      return NextResponse.json({ error: 'No hay programaciones para esta fecha' }, { status: 404 });
    }
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Consolidado');
    
    const headers = [
      'FECHA', 'CLIENTE', 'ÁREA', 'TIPO', 'TURNO', 'USUARIO',
      'BOTIQUÍN/OTRO', 'H.INICIO PROGRAMADA', 'H. TERMINO PROGRAMADA',
      'CONDUCTOR', 'H. UBICACIÓN RECOJO', 'H. UBICACIÓN DEJANDO',
      'CALIFICACIÓN', 'OBS', 'A', 'MAD-SANNA', 'DETALLAR MOTIVO XQ NOS SALE'
    ];
    
    const colores = {
      gris: 'FFA5A5A5',
      verde: 'FF92D050',
      azul: 'FF0070C0',
      naranja: 'FFDE6800',
      rojo: 'FFEE0000',
      amarillo: 'FFFFFF00'
    };
    
    const coloresColumnas = [
      null, colores.gris, colores.gris, colores.gris, colores.gris, colores.gris,
      colores.gris, colores.naranja, colores.naranja, colores.azul,
      colores.amarillo, colores.naranja, colores.rojo, null,
      colores.gris, colores.verde, colores.amarillo
    ];
    
    let filaActual = 1;
    
    for (const programacion of programacionesResult.rows) {
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
      `, [programacion.id]);
      
      const headerRow = worksheet.getRow(filaActual);
      headers.forEach((header, idx) => {
        const cell = headerRow.getCell(idx + 1);
        cell.value = header;
        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF000000' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } }
        };
        if (coloresColumnas[idx]) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: coloresColumnas[idx] } };
        }
      });
      headerRow.height = 30;
      filaActual++;
      
      detallesResult.rows.forEach((detalle, idx) => {
        const row = worksheet.getRow(filaActual);
        const valores = [
          new Date(detalle.fecha),
          detalle.cliente_especial || 'SANNA',
          detalle.area || 'MEDICINA',
          detalle.tipo_servicio || 'MAD',
          detalle.turno || 'M',
          detalle.doctor_nombre,
          '', detalle.hora_inicio, detalle.hora_fin,
          detalle.conductor_nombre || '', '', '',
          detalle.calificacion || '', detalle.observaciones || '',
          idx + 1, 'MAD-SANNA', ''
        ];
        
        valores.forEach((val, i) => {
          const cell = row.getCell(i + 1);
          cell.value = val;
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
        });
        
        row.getCell(1).numFmt = 'm/d/yyyy';
        filaActual++;
      });
      
      filaActual += 2;
    }
    
    worksheet.columns = headers.map((h, i) => ({
      width: i === 5 ? 25 : i === 9 ? 30 : i === 12 ? 45 : i === 16 ? 25 : 12
    }));
    
    await client.end();
    
    const buffer = await workbook.xlsx.writeBuffer();
    const fechaArchivo = fecha.replace(/-/g, '');
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Consolidado_' + fechaArchivo + '.xlsx"'
      }
    });
    
  } catch (error: any) {
    await client.end();
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFAPI

echo "✓ API consolidado creada"

# 2. AGREGAR BOTÓN EN COMPONENTE
python3 << 'EOFPY'
with open('src/components/EditorProgramacionContent.tsx', 'r') as f:
    content = f.read()

# Buscar la línea que tiene el título
old_header = '''      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Programación de Servicios</h1>
        <p className="text-gray-600">Gestiona documentos de programación</p>
      </div>'''

new_header = '''      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-3xl font-bold">Programación de Servicios</h1>
            <p className="text-gray-600">Gestiona documentos de programación</p>
          </div>
          <button
            onClick={async () => {
              const hoy = new Date().toISOString().split('T')[0];
              try {
                const res = await fetch('/api/programaciones/exportar-consolidado', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ fecha: hoy })
                });
                
                if (res.ok) {
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'Consolidado_' + hoy.replace(/-/g, '') + '.xlsx';
                  a.click();
                } else {
                  alert('No hay programaciones para hoy');
                }
              } catch (error) {
                alert('Error generando consolidado');
              }
            }}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-lg"
          >
            📊 Excel Programación Final
          </button>
        </div>
      </div>'''

content = content.replace(old_header, new_header)

with open('src/components/EditorProgramacionContent.tsx', 'w') as f:
    f.write(content)

print("✓ Botón consolidado agregado")
EOFPY

npm run build && pm2 restart zuri-dev

echo ""
echo "✅ SISTEMA COMPLETO"
echo ""
echo "Funcionalidades implementadas:"
echo "  ✓ Exportación individual con colores corregidos"
echo "  ✓ Nombre de archivo con fecha del día"
echo "  ✓ Botón 'Excel Programación Final' en dashboard"
echo "  ✓ Consolidado genera archivo único con todas las programaciones del día"
echo ""
echo "Prueba en: https://admin.zuri.pe/dashboard/programacion"
