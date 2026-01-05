#!/bin/bash
echo "Creando sistema de exportación profesional..."

# 1. Crear API de exportación
mkdir -p src/app/api/programaciones/exportar
cat > src/app/api/programaciones/exportar/route.ts << 'EOFAPI'
import { NextResponse } from 'next/server';
import { Client } from 'pg';
import * as XLSX from 'xlsx';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function POST(request: Request) {
  const client = new Client(DB_CONFIG);
  
  try {
    const { programacionId } = await request.json();
    
    await client.connect();
    
    // Obtener datos de programación
    const progResult = await client.query(
      'SELECT * FROM programaciones WHERE id = $1',
      [programacionId]
    );
    
    if (progResult.rows.length === 0) {
      await client.end();
      return NextResponse.json({ error: 'Programación no encontrada' }, { status: 404 });
    }
    
    const programacion = progResult.rows[0];
    
    // Obtener detalles completos
    const detallesResult = await client.query(`
      SELECT 
        pd.*,
        ts.nombre as tipo_servicio,
        ce.nombre as cliente_especial,
        ar.nombre as area,
        c."nombreCompleto" as conductor_nombre,
        c."marcaAuto" as conductor_marca,
        c.modelo as conductor_modelo,
        c.placa as conductor_placa,
        cal.descripcion as calificacion
      FROM programacion_detalles pd
      LEFT JOIN tipos_servicio ts ON pd.tipo_servicio_id = ts.id
      LEFT JOIN clientes_especiales ce ON pd.cliente_especial_id = ce.id
      LEFT JOIN areas_servicio ar ON pd.area_servicio_id = ar.id
      LEFT JOIN conductores c ON pd.conductor_id = c.id
      LEFT JOIN calificaciones cal ON pd.calificacion_id = cal.id
      WHERE pd.programacion_id = $1
      ORDER BY pd.fecha, pd.hora_inicio
    `, [programacionId]);
    
    await client.end();
    
    // Crear workbook
    const wb = XLSX.utils.book_new();
    
    // Preparar datos
    const fecha = new Date(programacion.fecha_programacion);
    const nombreHoja = `${programacion.codigo_programacion}`;
    
    // Encabezado
    const datos: any[][] = [
      ['PROGRAMACIÓN DE SERVICIOS - SISTEMA ZURI'],
      [],
      [`Código: ${programacion.codigo_programacion}`],
      [`Fecha: ${fecha.toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`],
      [`Cliente: ${programacion.cliente_nombre || 'N/A'}`],
      [`Estado: ${programacion.estado}`],
      [],
      ['N°', 'Cliente', 'Área', 'Tipo', 'Doctor', 'Fecha', 'Hora Inicio', 'Hora Fin', 'Ubicación', 'Conductor', 'Vehículo', 'Calificación']
    ];
    
    // Datos de servicios
    detallesResult.rows.forEach((detalle, idx) => {
      datos.push([
        idx + 1,
        detalle.cliente_especial || '',
        detalle.area || '',
        detalle.tipo_servicio || '',
        detalle.doctor_nombre,
        new Date(detalle.fecha).toLocaleDateString('es-PE'),
        detalle.hora_inicio,
        detalle.hora_fin,
        detalle.ubicacion || '',
        detalle.conductor_nombre || 'Sin asignar',
        detalle.conductor_placa ? `${detalle.conductor_marca} ${detalle.conductor_modelo} (${detalle.conductor_placa})` : '',
        detalle.calificacion || ''
      ]);
    });
    
    // Resumen
    datos.push([]);
    datos.push(['RESUMEN']);
    datos.push(['Total de servicios:', detallesResult.rows.length]);
    datos.push(['Servicios con conductor:', detallesResult.rows.filter(d => d.conductor_id).length]);
    datos.push(['Servicios sin asignar:', detallesResult.rows.filter(d => !d.conductor_id).length]);
    
    // Crear hoja
    const ws = XLSX.utils.aoa_to_sheet(datos);
    
    // Anchos de columna
    ws['!cols'] = [
      { wch: 5 },  // N°
      { wch: 15 }, // Cliente
      { wch: 15 }, // Área
      { wch: 20 }, // Tipo
      { wch: 30 }, // Doctor
      { wch: 12 }, // Fecha
      { wch: 10 }, // Hora Inicio
      { wch: 10 }, // Hora Fin
      { wch: 25 }, // Ubicación
      { wch: 25 }, // Conductor
      { wch: 25 }, // Vehículo
      { wch: 30 }  // Calificación
    ];
    
    // Agregar hoja al workbook
    XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
    
    // Generar archivo
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    // Retornar como descarga
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${programacion.codigo_programacion}.xlsx"`
      }
    });
    
  } catch (error: any) {
    await client.end();
    console.error('Error exportando Excel:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFAPI

echo "✓ API de exportación creada"

# 2. Actualizar componente para usar exportación
cat > actualizar_botones_exportacion.py << 'EOFPY'
import re

with open('src/components/EditorProgramacionContent.tsx', 'r') as f:
    content = f.read()

# Buscar los botones actuales y reemplazarlos
old_buttons = '''        <div className="px-8 py-6 bg-gray-50 border-t flex justify-between items-center">
          <button onClick={onVolver} className="px-4 py-2 border rounded-lg hover:bg-white">Volver</button>
          
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">PDF</button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">WhatsApp</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Email</button>
          </div>
        </div>'''

new_buttons = '''        <div className="px-8 py-6 bg-gray-50 border-t flex justify-between items-center">
          <button onClick={onVolver} className="px-4 py-2 border rounded-lg hover:bg-white">Volver</button>
          
          <div className="flex gap-3">
            <button 
              onClick={async () => {
                try {
                  const res = await fetch('/api/programaciones/exportar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ programacionId: programacion.id })
                  });
                  
                  if (res.ok) {
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${programacion.codigo_programacion}.xlsx`;
                    a.click();
                  }
                } catch (error) {
                  alert('Error exportando Excel');
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              📊 Excel
            </button>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">PDF</button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">WhatsApp</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Email</button>
          </div>
        </div>'''

content = content.replace(old_buttons, new_buttons)

with open('src/components/EditorProgramacionContent.tsx', 'w') as f:
    f.write(content)

print("✓ Botón Excel funcional agregado")
EOFPY

python3 actualizar_botones_exportacion.py

npm run build && pm2 restart zuri-dev

echo ""
echo "✅ EXPORTACIÓN EXCEL LISTA"
echo ""
echo "Prueba en: https://admin.zuri.pe/dashboard/programacion"
echo "Haz clic en el botón 'Excel' para descargar"
