'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Importacion = Record<string, any>;
type Solicitud = Record<string, any>;

function toText(value: any) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function includesNormalized(haystack: any, needleLower: string) {
  const text = toText(haystack).toLowerCase();
  return text.includes(needleLower);
}

// Filtra DNIs artificiales/temporales generados por el sistema (ej: T7196246, X1234567, D0001234)
function isRealDni(dni: string): boolean {
  if (!dni || dni === '-') return false;
  // Los DNI artificiales empiezan con T, X, o D y son seguidos solo de dígitos
  return !/^[TXD]\d+$/.test(dni);
}

function formatDniConductor(raw: string): string {
  if (!raw || raw === '-') return '-';
  return isRealDni(raw) ? raw : '-';
}


function formatDate(value: any) {
  const text = toText(value);
  if (!text) return '-';
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return new Intl.DateTimeFormat('es-PE', { year: 'numeric', month: 'short', day: '2-digit' }).format(date);
}

function formatTime(value: any) {
  const text = toText(value);
  if (!text) return '-';
  return text.slice(0, 5);
}

export default function ExcelImportacionViewer({ importacionId }: { importacionId: number }) {
  const router = useRouter();
  const [importacion, setImportacion] = useState<Importacion | null>(null);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/importaciones/${importacionId}`);
        if (!res.ok) throw new Error('No se pudo cargar el detalle de la importación');
        const data = await res.json();
        setImportacion(data.importacion ?? null);
        setSolicitudes(Array.isArray(data.solicitudes) ? data.solicitudes : []);
      } catch (e: any) {
        setError(e?.message ?? 'Error al cargar el detalle');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [importacionId]);

  const stats = useMemo(() => {
    const total = solicitudes.length;
    const confirmados = solicitudes.filter((s) => s.confirmado === true || s.estado === 'CONFIRMADO').length;
    const sinConfirmar = total - confirmados;
    const conErrores = solicitudes.filter((s) => s.estado === 'ERROR').length;
    return { total, confirmados, sinConfirmar, conErrores };
  }, [solicitudes]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return solicitudes;
    return solicitudes.filter((s) => {
      return [
        s.doctor_nombre,
        s.doctor_nombre_bd,
        s.conductor_nombre,
        s.conductor_nombre_bd,
        s.paciente_nombre,
        s.paciente_dni,
        s.cliente_nombre,
        s.distrito,
        s.direccion_recojo,
        s.direccion_destino,
        s.ubicacion,
        s.descripcion
      ].some((field) => includesNormalized(field, needle));
    });
  }, [solicitudes, query]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Cargando detalle...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-red-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Detalle de Importación</h1>
              <p className="text-sm text-red-600 mt-1">⚠️ {error}</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/gestion-excel')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  const estado = toText(importacion?.estado);
  const estadoBadge =
    estado === 'CONFIRMADO' || estado === 'COMPLETADO'
      ? 'bg-green-100 text-green-800'
      : estado === 'CANCELADO'
        ? 'bg-red-100 text-red-800'
        : estado === 'ERROR'
          ? 'bg-orange-100 text-orange-800'
          : 'bg-blue-100 text-blue-800';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Detalle de Importación</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {estado && (
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${estadoBadge}`}>
                  {estado}
                </span>
              )}
              <p className="text-gray-600 text-sm">
                {toText(importacion?.nombre_archivo) || toText(importacion?.codigo_zuri) || `ID ${importacionId}`}
              </p>
              {importacion?.created_at && (
                <p className="text-gray-400 text-sm">Importado: {formatDate(importacion.created_at)}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/gestion-excel')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
          >
            <span>←</span> Volver a Lista
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total filas importadas</p>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Filas importadas</h2>
              <p className="text-xs text-gray-500 mt-1">
                Busca por DNI, doctor, conductor, distrito o dirección.
              </p>
            </div>
            <div className="w-full md:w-80">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">DNI</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conductor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">DNI Cond.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" title="Distrito que recorre/visita el conductor (zona de atención a pacientes)">Distrito ⓘ</th>

                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((s, idx) => {
                  const doctor = toText(s.doctor_nombre_bd) || toText(s.doctor_nombre) || '-';
                  const conductor = toText(s.conductor_nombre_bd) || toText(s.conductor_nombre) || '-';
                  const hora = [formatTime(s.hora_inicio), formatTime(s.hora_fin)].filter((x) => x !== '-').join(' - ') || '-';
                  const dniDoctor = toText(s.doctor_dni_bd) || toText(s.paciente_dni) || '-';
                  const dniConductor = formatDniConductor(
                    toText(s.conductor_dni_bd) || toText(s.conductor_dni) || toText(s.conductor_dni_excel)
                  );
                  const placaCond = toText(s.conductor_placa_bd) || toText(s.placa) || '-';
                  const distrito = toText(s.distrito) || toText(s.distrito_recojo) || '-';

                  return (
                    <tr key={toText(s.id) || idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatDate(s.fecha)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{hora}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-mono">{dniDoctor}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                        <div className="truncate" title={doctor}>{doctor}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                        <div className="truncate" title={conductor}>{conductor}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-mono">{dniConductor}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 font-mono font-semibold">{placaCond}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{distrito}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No hay filas para mostrar
            </div>
          )}
        </div>


      </div>
    </div >
  );
}

