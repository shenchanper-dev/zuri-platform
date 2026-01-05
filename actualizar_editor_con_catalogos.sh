#!/bin/bash
echo "Actualizando editor con nuevos catálogos..."

cat > src/components/EditorProgramacionContent.tsx << 'EOFEDITOR'
"use client";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Programacion {
  id: number;
  codigo_programacion: string;
  fecha_programacion: string;
  cliente_nombre: string;
  cliente_especial_id?: number;
  estado: string;
}

interface Detalle {
  id: number;
  tipo_servicio_id?: number;
  tipo_servicio_nombre?: string;
  cliente_nombre: string;
  cliente_especial_id?: number;
  area_servicio_id?: number;
  doctor_nombre: string;
  conductor_id?: number;
  conductor_nombre_completo_bd?: string;
  conductor_marca?: string;
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
}

export default function EditorProgramacionContent() {
  const searchParams = useSearchParams();
  const programacionId = searchParams.get('id');
  
  const [programaciones, setProgramaciones] = useState<Programacion[]>([]);
  const [programacion, setProgramacion] = useState<Programacion | null>(null);
  const [detalles, setDetalles] = useState<Detalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarEditor, setMostrarEditor] = useState(false);
  
  const [tiposServicio, setTiposServicio] = useState<any[]>([]);
  const [calificaciones, setCalificaciones] = useState<any[]>([]);
  const [clientesEspeciales, setClientesEspeciales] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [conductores, setConductores] = useState<any[]>([]);
  const [clinicas, setClinicas] = useState<any[]>([]);

  useEffect(() => {
    cargarProgramaciones();
    cargarCatalogos();
    
    if (programacionId) {
      cargarProgramacion(parseInt(programacionId));
    }
  }, [programacionId]);

  const cargarProgramaciones = async () => {
    try {
      const res = await fetch('/api/programaciones');
      const data = await res.json();
      setProgramaciones(data.programaciones || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarCatalogos = async () => {
    try {
      const [ts, cal, ce, ar, cond, cli] = await Promise.all([
        fetch('/api/tipos-servicio').then(r => r.json()),
        fetch('/api/calificaciones').then(r => r.json()),
        fetch('/api/clientes-especiales').then(r => r.json()),
        fetch('/api/areas-servicio').then(r => r.json()),
        fetch('/api/conductores-disponibles').then(r => r.json()),
        fetch('/api/clinicas-hospitales').then(r => r.json())
      ]);
      
      setTiposServicio(ts.tiposServicio || []);
      setCalificaciones(cal.calificaciones || []);
      setClientesEspeciales(ce.clientesEspeciales || []);
      setAreas(ar.areas || []);
      setConductores(cond.conductores || []);
      setClinicas(cli.clinicas || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const cargarProgramacion = async (id: number) => {
    try {
      const res = await fetch(`/api/programaciones/${id}`);
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

  const actualizarDetalle = async (detalleId: number, cambios: any) => {
    try {
      const res = await fetch(`/api/programacion-detalles/${detalleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cambios)
      });
      
      if (res.ok && programacion) {
        await cargarProgramacion(programacion.id);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const actualizarProgramacion = async (cambios: any) => {
    if (!programacion) return;
    
    try {
      const res = await fetch(`/api/programaciones/${programacion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cambios)
      });
      
      if (res.ok) {
        await cargarProgramacion(programacion.id);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (mostrarEditor && programacion) {
    return (
      <EditorProgramacion
        programacion={programacion}
        detalles={detalles}
        tiposServicio={tiposServicio}
        calificaciones={calificaciones}
        clientesEspeciales={clientesEspeciales}
        areas={areas}
        conductores={conductores}
        clinicas={clinicas}
        onActualizarDetalle={actualizarDetalle}
        onActualizarProgramacion={actualizarProgramacion}
        onVolver={() => {
          setMostrarEditor(false);
          setProgramacion(null);
          window.history.pushState({}, '', '/dashboard/programacion');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Programación de Servicios</h1>
        <p className="text-gray-600">Gestiona documentos de programación</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Programaciones</h2>
        </div>
        
        {programaciones.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="mb-2">No hay programaciones</p>
            <p className="text-sm">Ve a Gestión Excel y genera programaciones</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {programaciones.map(prog => (
                <tr key={prog.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-semibold text-blue-600">
                      {prog.codigo_programacion}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(prog.fecha_programacion).toLocaleDateString('es-PE')}
                  </td>
                  <td className="px-6 py-4 text-sm">{prog.cliente_nombre}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      prog.estado === 'COMPLETADO' ? 'bg-green-100 text-green-800' :
                      prog.estado === 'CONFIRMADO' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {prog.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => cargarProgramacion(prog.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Abrir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function EditorProgramacion({ 
  programacion, detalles, tiposServicio, calificaciones, clientesEspeciales, 
  areas, conductores, clinicas, onActualizarDetalle, onActualizarProgramacion, onVolver 
}: any) {
  const [editando, setEditando] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});

  const iniciarEdicion = (detalle: Detalle) => {
    setEditando(detalle.id);
    setFormData({
      tipo_servicio_id: detalle.tipo_servicio_id,
      cliente_especial_id: detalle.cliente_especial_id,
      area_servicio_id: detalle.area_servicio_id,
      conductor_id: detalle.conductor_id,
      fecha: detalle.fecha,
      hora_inicio: detalle.hora_inicio,
      hora_fin: detalle.hora_fin,
      calificacion_id: detalle.calificacion_id,
      observaciones: detalle.observaciones
    });
  };

  const guardarEdicion = async () => {
    if (editando) {
      await onActualizarDetalle(editando, formData);
      setEditando(null);
    }
  };

  const clienteEspecialNombre = (id?: number) => {
    if (!id) return null;
    return clientesEspeciales.find(c => c.id === id)?.nombre;
  };

  const areaNombre = (id?: number) => {
    if (!id) return null;
    return areas.find(a => a.id === id)?.nombre;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">PROGRAMACIÓN DE SERVICIOS</h1>
              <p className="text-blue-100">Sistema ZURI</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold mb-1">{programacion.codigo_programacion}</div>
              <div className="text-sm text-blue-100">
                {new Date(programacion.fecha_programacion).toLocaleDateString('es-PE', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 border-b bg-gray-50">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Cliente</label>
              <select
                value={programacion.cliente_especial_id || ''}
                onChange={(e) => onActualizarProgramacion({ 
                  cliente_especial_id: e.target.value ? parseInt(e.target.value) : null 
                })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Seleccionar</option>
                {clientesEspeciales.map(ce => (
                  <option key={ce.id} value={ce.id}>{ce.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Estado</label>
              <select 
                value={programacion.estado}
                onChange={(e) => onActualizarProgramacion({ estado: e.target.value })}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="BORRADOR">Borrador</option>
                <option value="CONFIRMADO">Confirmado</option>
                <option value="COMPLETADO">Completado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Servicios</label>
              <div className="text-2xl font-bold text-blue-600">{detalles.length}</div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6">
          <h2 className="text-lg font-semibold mb-4">Servicios Programados</h2>
          
          <div className="space-y-3">
            {detalles.map((detalle: Detalle, idx: number) => (
              <div key={detalle.id} className="border rounded-lg p-4 hover:shadow-md transition">
                {editando === detalle.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Cliente</label>
                        <select
                          value={formData.cliente_especial_id || ''}
                          onChange={e => setFormData({...formData, cliente_especial_id: e.target.value ? parseInt(e.target.value) : null})}
                          className="w-full px-2 py-1.5 border rounded text-sm"
                        >
                          <option value="">-</option>
                          {clientesEspeciales.map(ce => <option key={ce.id} value={ce.id}>{ce.nombre}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Área</label>
                        <select
                          value={formData.area_servicio_id || ''}
                          onChange={e => setFormData({...formData, area_servicio_id: e.target.value ? parseInt(e.target.value) : null})}
                          className="w-full px-2 py-1.5 border rounded text-sm"
                        >
                          <option value="">-</option>
                          {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Tipo</label>
                        <select
                          value={formData.tipo_servicio_id || ''}
                          onChange={e => setFormData({...formData, tipo_servicio_id: e.target.value ? parseInt(e.target.value) : null})}
                          className="w-full px-2 py-1.5 border rounded text-sm"
                        >
                          <option value="">-</option>
                          {tiposServicio.map(ts => <option key={ts.id} value={ts.id}>{ts.nombre}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Fecha</label>
                        <input type="date" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Inicio</label>
                        <input type="time" value={formData.hora_inicio} onChange={e => setFormData({...formData, hora_inicio: e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Fin</label>
                        <input type="time" value={formData.hora_fin} onChange={e => setFormData({...formData, hora_fin: e.target.value})} className="w-full px-2 py-1.5 border rounded text-sm" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Conductor</label>
                        <select value={formData.conductor_id || ''} onChange={e => setFormData({...formData, conductor_id: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-2 py-1.5 border rounded text-sm">
                          <option value="">Sin asignar</option>
                          {conductores.map(c => <option key={c.id} value={c.id}>{c.nombre_completo}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Calificación</label>
                        <select value={formData.calificacion_id || ''} onChange={e => setFormData({...formData, calificacion_id: e.target.value ? parseInt(e.target.value) : null})} className="w-full px-2 py-1.5 border rounded text-sm">
                          <option value="">-</option>
                          {calificaciones.map(cal => <option key={cal.id} value={cal.id}>{cal.descripcion}</option>)}
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditando(null)} className="px-3 py-1.5 text-sm border rounded">Cancelar</button>
                      <button onClick={guardarEdicion} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded">Guardar</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">#{idx + 1}</span>
                        <span className="font-semibold">{detalle.doctor_nombre}</span>
                        {detalle.tipo_servicio_nombre && <span className="text-xs bg-gray-100 px-2 py-1 rounded">{detalle.tipo_servicio_nombre}</span>}
                        {clienteEspecialNombre(detalle.cliente_especial_id) && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            {clienteEspecialNombre(detalle.cliente_especial_id)}
                          </span>
                        )}
                        {areaNombre(detalle.area_servicio_id) && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                            {areaNombre(detalle.area_servicio_id)}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Horario:</span> {detalle.hora_inicio} - {detalle.hora_fin}
                        {detalle.ubicacion && <span className="ml-4"><span className="font-medium">Ubicación:</span> {detalle.ubicacion}</span>}
                      </div>
                      
                      {detalle.conductor_nombre_completo_bd && (
                        <div className="text-sm bg-green-50 text-green-700 px-3 py-2 rounded">
                          Conductor: <strong>{detalle.conductor_nombre_completo_bd}</strong>
                          {detalle.conductor_placa && ` - ${detalle.conductor_marca} (${detalle.conductor_placa})`}
                        </div>
                      )}
                      
                      {detalle.calificacion_descripcion && (
                        <div className="mt-2 text-sm px-3 py-2 rounded" style={{ backgroundColor: `${detalle.calificacion_color}20`, color: detalle.calificacion_color }}>
                          {detalle.calificacion_descripcion}
                        </div>
                      )}
                    </div>
                    
                    <button onClick={() => iniciarEdicion(detalle)} className="ml-4 text-blue-600 hover:text-blue-800 text-sm font-medium">Editar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="px-8 py-6 bg-gray-50 border-t flex justify-between items-center">
          <button onClick={onVolver} className="px-4 py-2 border rounded-lg hover:bg-white">Volver</button>
          
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">PDF</button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">WhatsApp</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Email</button>
          </div>
        </div>
      </div>
    </div>
  );
}
EOFEDITOR

npm run build && pm2 restart zuri-dev

echo "Editor actualizado con Cliente, Área y Tipos completos"
