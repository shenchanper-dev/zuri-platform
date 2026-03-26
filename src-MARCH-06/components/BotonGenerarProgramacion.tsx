"use client";
import { useState } from 'react';

interface Props {
  importacionId: number;
  codigoZuri: string;
  onSuccess?: () => void;
}

export function BotonGenerarProgramacion({ importacionId, codigoZuri, onSuccess }: Props) {
  const [generando, setGenerando] = useState(false);

  const generarProgramacion = async () => {
    if (!confirm(`¿Generar programación desde ${codigoZuri}?`)) return;

    setGenerando(true);
    try {
      const response = await fetch('/api/programaciones/desde-importacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importacion_id: importacionId })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Programación ${data.programacion.codigo_programacion} creada`);
        window.location.href = `/dashboard/programacion?id=${data.programacion.id}`;
        onSuccess?.();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setGenerando(false);
    }
  };

  return (
    <button
      onClick={generarProgramacion}
      disabled={generando}
      className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50"
    >
      {generando ? 'Generando...' : '📋 Programar'}
    </button>
  );
}
