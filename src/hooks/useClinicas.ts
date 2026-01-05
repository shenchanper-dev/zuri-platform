import { useState, useEffect } from 'react';

export interface ClinicaData {
  id?: number;
  nombre: string;
  tipo: string;
  direccion: string;
  distrito: string;
  latitud: number;
  longitud: number;
  telefono: string;
  email: string;
  contacto: string;
  estado: 'ACTIVA' | 'INACTIVA' | 'MANTENIMIENTO';
  servicios24h: boolean;
  emergencia: boolean;
  uci: boolean;
  laboratorio: boolean;
  farmacia: boolean;
  radiologia: boolean;
  ambulancia: boolean;
  bancoSangre: boolean;
  dialisis: boolean;
  segurosAceptados: string;
  numeroConsultorios: number;
  numeroCamas: number;
  ascensor: boolean;
  estacionamiento: boolean;
  rampasAcceso: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClinicasStats {
  total: number;
  activas: number;
  conEmergencia: number;
  atienden24h: number;
  conUci: number;
  porTipo: {
    clinicas: number;
    hospitales: number;
    centros: number;
  };
}

export function useClinicas() {
  const [clinicas, setClinicas] = useState<ClinicaData[]>([]);
  const [stats, setStats] = useState<ClinicasStats>({
    total: 0,
    activas: 0,
    conEmergencia: 0,
    atienden24h: 0,
    conUci: 0,
    porTipo: { clinicas: 0, hospitales: 0, centros: 0 }
  });
  const [loading, setLoading] = useState(true);

  const fetchClinicas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clinicas');
      const data = await response.json();
      
      if (response.ok) {
        setClinicas(data.clinicas);
        setStats(data.estadisticas);
      } else {
        console.error('Error fetching clinicas:', data.error);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createClinica = async (data: Omit<ClinicaData, 'id'>) => {
    try {
      const response = await fetch('/api/clinicas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        await fetchClinicas();
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const updateClinica = async (id: number, data: Partial<ClinicaData>) => {
    try {
      const response = await fetch(`/api/clinicas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        await fetchClinicas();
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  const deleteClinica = async (id: number) => {
    try {
      const response = await fetch(`/api/clinicas/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchClinicas();
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  useEffect(() => {
    fetchClinicas();
  }, []);

  return {
    clinicas,
    stats,
    loading,
    createClinica,
    updateClinica,
    deleteClinica,
    refetch: fetchClinicas
  };
}
