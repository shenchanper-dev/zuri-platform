#!/bin/bash
echo "=== APLICANDO MEJORAS SOLICITADAS ==="

# MEJORA 1: Agregar botón Eliminar en la tabla
echo "[1/3] Agregando botón Eliminar..."

python3 << 'EOFPY1'
with open('src/components/EditorProgramacionContent.tsx', 'r') as f:
    content = f.read()

# Agregar función eliminar después de cargarProgramacion
insert_after = '''  const cargarProgramacion = async (id: number) => {
    try {
      const res = await fetch(\`/api/programaciones/\${id}\`);
      const data = await res.json();
      
      if (res.ok) {
        setProgramacion(data.programacion);
        setDetalles(data.detalles || []);
        setMostrarEditor(true);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };'''

new_function = '''  const cargarProgramacion = async (id: number) => {
    try {
      const res = await fetch(\`/api/programaciones/\${id}\`);
      const data = await res.json();
      
      if (res.ok) {
        setProgramacion(data.programacion);
        setDetalles(data.detalles || []);
        setMostrarEditor(true);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const eliminarProgramacion = async (id: number, codigo: string) => {
    if (!confirm(\`¿Eliminar programación \${codigo}?\`)) return;
    
    try {
      const res = await fetch(\`/api/programaciones/\${id}\`, { method: 'DELETE' });
      if (res.ok) {
        alert(\`Programación \${codigo} eliminada\`);
        await cargarProgramaciones();
      }
    } catch (error) {
      alert('Error al eliminar');
    }
  };'''

content = content.replace(insert_after, new_function)

# Agregar div con botones
old_button = '''                  <td className="px-6 py-4">
                    <button
                      onClick={() => cargarProgramacion(prog.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Abrir
                    </button>
                  </td>'''

new_buttons = '''                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => cargarProgramacion(prog.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Abrir
                      </button>
                      <button
                        onClick={() => eliminarProgramacion(prog.id, prog.codigo_programacion)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>'''

content = content.replace(old_button, new_buttons)

with open('src/components/EditorProgramacionContent.tsx', 'w') as f:
    f.write(content)

print("✓ Botón Eliminar agregado")
EOFPY1

# MEJORA 2: Agregar campos Cliente y Área en el editor
echo "[2/3] Agregando selectores de Cliente y Área..."

python3 << 'EOFPY2'
with open('src/components/EditorProgramacionContent.tsx', 'r') as f:
    content = f.read()

# 1. Agregar estados para catálogos
old_states = '''  const [tiposServicio, setTiposServicio] = useState<any[]>([]);
  const [calificaciones, setCalificaciones] = useState<any[]>([]);
  const [motivos, setMotivos] = useState<any[]>([]);
  const [conductores, setConductores] = useState<any[]>([]);
  const [doctores, setDoctores] = useState<any[]>([]);
  const [clinicas, setClinicas] = useState<any[]>([]);'''

new_states = '''  const [tiposServicio, setTiposServicio] = useState<any[]>([]);
  const [calificaciones, setCalificaciones] = useState<any[]>([]);
  const [clientesEspeciales, setClientesEspeciales] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [conductores, setConductores] = useState<any[]>([]);'''

content = content.replace(old_states, new_states)

# 2. Actualizar carga de catálogos
old_catalogos = '''      const [ts, cal, mot, cond, doc, cli] = await Promise.all([
        fetch('/api/tipos-servicio').then(r => r.json()),
        fetch('/api/calificaciones').then(r => r.json()),
        fetch('/api/motivos-no-disponibilidad').then(r => r.json()),
        fetch('/api/conductores-disponibles').then(r => r.json()),
        fetch('/api/doctores').then(r => r.json()),
        fetch('/api/clinicas-hospitales').then(r => r.json())
      ]);
      
      setTiposServicio(ts.tiposServicio || []);
      setCalificaciones(cal.calificaciones || []);
      setMotivos(mot.motivos || []);
      setConductores(cond.conductores || []);
      setDoctores(doc.doctores || []);
      setClinicas(cli.clinicas || []);'''

new_catalogos = '''      const [ts, cal, ce, ar, cond] = await Promise.all([
        fetch('/api/tipos-servicio').then(r => r.json()),
        fetch('/api/calificaciones').then(r => r.json()),
        fetch('/api/clientes-especiales').then(r => r.json()),
        fetch('/api/areas-servicio').then(r => r.json()),
        fetch('/api/conductores-disponibles').then(r => r.json())
      ]);
      
      setTiposServicio(ts.tiposServicio || []);
      setCalificaciones(cal.calificaciones || []);
      setClientesEspeciales(ce.clientesEspeciales || []);
      setAreas(ar.areas || []);
      setConductores(cond.conductores || []);'''

content = content.replace(old_catalogos, new_catalogos)

# 3. Actualizar props de EditorProgramacion
old_props = '''        tiposServicio={tiposServicio}
        calificaciones={calificaciones}
        motivos={motivos}
        conductores={conductores}
        doctores={doctores}
        clinicas={clinicas}'''

new_props = '''        tiposServicio={tiposServicio}
        calificaciones={calificaciones}
        clientesEspeciales={clientesEspeciales}
        areas={areas}
        conductores={conductores}'''

content = content.replace(old_props, new_props)

# 4. Actualizar parámetros de EditorProgramacion
old_params = '''function EditorProgramacion({ programacion, detalles, tiposServicio, calificaciones, conductores, onActualizarDetalle, onActualizarProgramacion, onVolver }: any)'''

new_params = '''function EditorProgramacion({ programacion, detalles, tiposServicio, calificaciones, clientesEspeciales, areas, conductores, onActualizarDetalle, onActualizarProgramacion, onVolver }: any)'''

content = content.replace(old_params, new_params)

# 5. Agregar campos en formData
old_formdata = '''    setFormData({
      tipo_servicio_id: detalle.tipo_servicio_id,
      conductor_id: detalle.conductor_id,
      fecha: detalle.fecha,
      hora_inicio: detalle.hora_inicio,
      hora_fin: detalle.hora_fin,
      calificacion_id: detalle.calificacion_id,
      observaciones: detalle.observaciones
    });'''

new_formdata = '''    setFormData({
      tipo_servicio_id: detalle.tipo_servicio_id || '',
      cliente_especial_id: detalle.cliente_especial_id || '',
      area_servicio_id: detalle.area_servicio_id || '',
      conductor_id: detalle.conductor_id || '',
      fecha: detalle.fecha,
      hora_inicio: detalle.hora_inicio,
      hora_fin: detalle.hora_fin,
      calificacion_id: detalle.calificacion_id || '',
      observaciones: detalle.observaciones || ''
    });'''

content = content.replace(old_formdata, new_formdata)

# 6. Actualizar interfaz Detalle
old_interface = '''interface Detalle {
  id: number;
  tipo_servicio_id?: number;
  tipo_servicio_nombre?: string;
  cliente_nombre: string;
  doctor_id?: number;
  doctor_nombre: string;
  conductor_id?: number;
  conductor_nombre_completo_bd?: string;
  conductor_marca?: string;
  conductor_modelo?: string;
  conductor_placa?: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  turno?: string;
  ubicacion?: string;
  estado: string;
  calificacion_id?: number;
  calificacion_descripcion?: string;
  calificacion_color?: string;
  motivo_no_disponibilidad_id?: number;
  observaciones?: string;
}'''

new_interface = '''interface Detalle {
  id: number;
  tipo_servicio_id?: number;
  tipo_servicio_nombre?: string;
  cliente_nombre: string;
  cliente_especial_id?: number;
  cliente_especial_nombre?: string;
  area_servicio_id?: number;
  area_nombre?: string;
  doctor_nombre: string;
  conductor_id?: number;
  conductor_nombre_completo_bd?: string;
  conductor_marca?: string;
  conductor_modelo?: string;
  conductor_placa?: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  ubicacion?: string;
  estado: string;
  calificacion_id?: number;
  calificacion_descripcion?: string;
  calificacion_color?: string;
  observaciones?: string;
}'''

content = content.replace(old_interface, new_interface)

with open('src/components/EditorProgramacionContent.tsx', 'w') as f:
    f.write(content)

print("✓ Estados y catálogos actualizados")
EOFPY2

# MEJORA 3: Actualizar formulario de edición
echo "[3/3] Actualizando formulario con Cliente y Área..."

python3 << 'EOFPY3'
with open('src/components/EditorProgramacionContent.tsx', 'r') as f:
    content = f.read()

# Reemplazar el grid de 4 columnas por uno que incluya Cliente y Área primero
old_grid = '''                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Tipo</label>
                        <select
                          value={formData.tipo_servicio_id || ''}
                          onChange={e => setFormData({...formData, tipo_servicio_id: e.target.value})}
                          className="w-full px-2 py-1.5 border rounded text-sm"
                        >
                          <option value="">-</option>
                          {tiposServicio.map((ts: any) => (
                            <option key={ts.id} value={ts.id}>{ts.nombre}</option>
                          ))}
                        </select>
                      </div>'''

new_grid = '''                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Cliente</label>
                        <select
                          value={formData.cliente_especial_id}
                          onChange={e => setFormData({...formData, cliente_especial_id: e.target.value})}
                          className="w-full px-2 py-1.5 border rounded text-sm"
                        >
                          <option value="">-</option>
                          {clientesEspeciales.map((ce: any) => <option key={ce.id} value={ce.id}>{ce.nombre}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Área</label>
                        <select
                          value={formData.area_servicio_id}
                          onChange={e => setFormData({...formData, area_servicio_id: e.target.value})}
                          className="w-full px-2 py-1.5 border rounded text-sm"
                        >
                          <option value="">-</option>
                          {areas.map((a: any) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Tipo</label>
                        <select
                          value={formData.tipo_servicio_id}
                          onChange={e => setFormData({...formData, tipo_servicio_id: e.target.value})}
                          className="w-full px-2 py-1.5 border rounded text-sm"
                        >
                          <option value="">-</option>
                          {tiposServicio.map((ts: any) => (
                            <option key={ts.id} value={ts.id}>{ts.nombre}</option>
                          ))}
                        </select>
                      </div>'''

content = content.replace(old_grid, new_grid)

# Agregar badges de Cliente y Área en vista normal
old_badges = '''                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">#{idx + 1}</span>
                        <span className="font-semibold">{detalle.doctor_nombre}</span>
                        {detalle.tipo_servicio_nombre && <span className="text-xs bg-gray-100 px-2 py-1 rounded">{detalle.tipo_servicio_nombre}</span>}'''

new_badges = '''                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">#{idx + 1}</span>
                        <span className="font-semibold">{detalle.doctor_nombre}</span>
                        {detalle.tipo_servicio_nombre && <span className="text-xs bg-gray-100 px-2 py-1 rounded">{detalle.tipo_servicio_nombre}</span>}
                        {detalle.cliente_especial_nombre && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            {detalle.cliente_especial_nombre}
                          </span>
                        )}
                        {detalle.area_nombre && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                            {detalle.area_nombre}
                          </span>
                        )}'''

content = content.replace(old_badges, new_badges)

# Actualizar guardarEdicion para limpiar valores vacíos
old_guardar = '''  const guardarEdicion = async () => {
    if (editando) {
      await onActualizarDetalle(editando, formData);
      setEditando(null);
    }
  };'''

new_guardar = '''  const guardarEdicion = async () => {
    if (editando) {
      const datosLimpios = Object.keys(formData).reduce((acc: any, key) => {
        acc[key] = formData[key] === '' ? null : formData[key];
        return acc;
      }, {});
      
      await onActualizarDetalle(editando, datosLimpios);
      setEditando(null);
    }
  };'''

content = content.replace(old_guardar, new_guardar)

with open('src/components/EditorProgramacionContent.tsx', 'w') as f:
    f.write(content)

print("✓ Formulario actualizado con Cliente y Área")
EOFPY3

# Actualizar API para aceptar los nuevos campos
echo "Actualizando API programacion-detalles..."

cat > src/app/api/programacion-detalles/\[id\]/route.ts << 'EOFAPI'
import { NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const client = new Client(DB_CONFIG);
  
  try {
    const body = await request.json();
    const { id } = params;
    
    const campos = [];
    const valores = [];
    let contador = 1;
    
    const camposPermitidos = [
      'tipo_servicio_id', 'cliente_especial_id', 'area_servicio_id',
      'conductor_id', 'fecha', 'hora_inicio', 'hora_fin', 
      'calificacion_id', 'observaciones'
    ];
    
    camposPermitidos.forEach(campo => {
      if (body[campo] !== undefined) {
        if (body[campo] === '' || body[campo] === null) {
          campos.push(\`\${campo} = NULL\`);
        } else {
          campos.push(\`\${campo} = $\${contador}\`);
          valores.push(body[campo]);
          contador++;
        }
      }
    });
    
    if (campos.length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }
    
    campos.push('updated_at = NOW()');
    valores.push(id);
    
    const query = \`UPDATE programacion_detalles SET \${campos.join(', ')} WHERE id = $\${contador} RETURNING *\`;
    
    await client.connect();
    const result = await client.query(query, valores);
    await client.end();
    
    return NextResponse.json({ detalle: result.rows[0] });
  } catch (error: any) {
    await client.end();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
EOFAPI

npm run build && pm2 restart zuri-dev

echo ""
echo "================================================"
echo "✅ MEJORAS APLICADAS"
echo "================================================"
echo ""
echo "Cambios realizados:"
echo "  ✓ Botón Eliminar en tabla de programaciones"
echo "  ✓ Selector de Cliente (SANNA, C.I., JP, SM, Otro)"
echo "  ✓ Selector de Área (MEDICINA, PEDIATRÍA, etc.)"
echo "  ✓ Badges de colores mostrando Cliente y Área"
echo "  ✓ API actualizada para guardar nuevos campos"
echo ""
echo "Prueba en: https://admin.zuri.pe/dashboard/programacion"
