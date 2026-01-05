#!/bin/bash
echo "Creando Frontend del módulo Programación..."

# 1. Hook personalizado
cat > src/hooks/useProgramaciones.ts << 'EOFHOOK'
import { useState, useEffect } from 'react';

export interface ProgramacionData {
  id?: number;
  codigo_programacion: string;
  fecha_programacion: string;
  cliente_nombre: string;
  estado: string;
  total_servicios?: number;
  servicios_asignados?: number;
}

export interface DetalleData {
  id?: number;
  tipo_servicio_id?: number;
  tipo_servicio_nombre?: string;
  cliente_id?: number;
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
  direccion_completa?: string;
  estado: string;
  calificacion_id?: number;
  calificacion_descripcion?: string;
  calificacion_color?: string;
  motivo_no_disponibilidad_id?: number;
  motivo_no_disponibilidad_desc?: string;
  observaciones?: string;
  incidencias?: string;
  orden?: number;
}

export function useProgramaciones() {
  const [programaciones, setProgramaciones] = useState<ProgramacionData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchProgramaciones = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/programaciones');
      const data = await response.json();
      if (response.ok) {
        setProgramaciones(data.programaciones || []);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const crearDesdeImportacion = async (importacionId: number) => {
    const response = await fetch('/api/programaciones/desde-importacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ importacionId })
    });
    
    if (response.ok) {
      await fetchProgramaciones();
      return { success: true, data: await response.json() };
    }
    return { success: false, error: (await response.json()).error };
  };
  
  useEffect(() => {
    fetchProgramaciones();
  }, []);
  
  return {
    programaciones,
    loading,
    crearDesdeImportacion,
    refetch: fetchProgramaciones
  };
}

export function useCatalogos() {
  const [tiposServicio, setTiposServicio] = useState<any[]>([]);
  const [calificaciones, setCalificaciones] = useState<any[]>([]);
  const [motivos, setMotivos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    Promise.all([
      fetch('/api/tipos-servicio').then(r => r.json()),
      fetch('/api/calificaciones').then(r => r.json()),
      fetch('/api/motivos-no-disponibilidad').then(r => r.json())
    ]).then(([ts, cal, mot]) => {
      setTiposServicio(ts.tiposServicio || []);
      setCalificaciones(cal.calificaciones || []);
      setMotivos(mot.motivos || []);
      setLoading(false);
    });
  }, []);
  
  return { tiposServicio, calificaciones, motivos, loading };
}
EOFHOOK

echo "Hook creado"

# Continuará con el componente principal...
echo "Componente principal en siguiente paso..."
