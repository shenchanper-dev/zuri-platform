'use client';

import { useState, useEffect, useCallback } from 'react';

interface Reporte {
    id: number;
    fecha: string;
    fecha_recibido: string;
    conductor_nombre: string | null;
    conductor_raw: string | null;
    conductor_placa: string | null;
    placa_raw: string | null;
    paciente_nombre: string | null;
    paciente_raw: string | null;
    tecnico_nombre: string | null;
    tecnico_raw: string | null;
    distrito: string | null;
    hora_llegada: string | null;
    hora_salida: string | null;
    duracion_minutos: number | null;
    observaciones: string | null;
    match_conductor: boolean;
    match_tecnico: boolean;
    match_paciente: boolean;
    error_parse: boolean;
    conductor_id: number | null;
    paciente_id: number | null;
}

interface Stats {
    total_servicios: string;
    conductores_activos: string;
    tiempo_promedio: string | null;
    distritos_cubiertos: string;
    errores_parse: string;
}

export default function ComunicacionesPage() {
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [reportes, setReportes] = useState<Reporte[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [distritos, setDistritos] = useState<{ distrito: string; total: string }[]>([]);
    const [porConductor, setPorConductor] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/toma-muestras?fecha=${fecha}`);
            const data = await res.json();
            if (data.success) {
                setReportes(data.reportes || []);
                setStats(data.stats || null);
                setDistritos(data.distritos || []);
                setPorConductor(data.porConductor || []);
            }
        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            setLoading(false);
        }
    }, [fecha]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const exportarExcel = async () => {
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();

        // Hoja 1: Servicios del día
        const wsData = reportes.map(r => ({
            'Hora': r.fecha_recibido ? new Date(r.fecha_recibido).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '',
            'Conductor': r.conductor_nombre || r.conductor_raw || 'N/A',
            'Placa': r.conductor_placa || r.placa_raw || '',
            'Paciente': r.paciente_nombre || r.paciente_raw || 'N/A',
            'Técnico': r.tecnico_nombre || r.tecnico_raw || 'N/A',
            'Distrito': r.distrito || '',
            'Llegada': r.hora_llegada || '',
            'Salida': r.hora_salida || '',
            'Duración (min)': r.duracion_minutos || '',
            'Observaciones': r.observaciones || '',
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(wsData), 'Servicios del día');

        // Hoja 2: Por conductor
        const wsCond = porConductor.map(c => ({
            'Conductor': c.nombre,
            'Placa': c.placa || '',
            'Total Servicios': parseInt(c.total_servicios),
            'Tiempo Promedio (min)': c.tiempo_promedio || '',
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(wsCond), 'Por conductor');

        // Hoja 3: Por distrito
        const wsDist = distritos.map(d => ({
            'Distrito': d.distrito,
            'Total Servicios': parseInt(d.total),
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(wsDist), 'Por distrito');

        XLSX.writeFile(wb, `toma_muestras_${fecha}.xlsx`);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">💬 Comunicaciones</h1>
                    <p className="text-gray-600 mt-1">Reportes de tomas de muestra desde WhatsApp</p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button
                        onClick={exportarExcel}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                        📥 Excel
                    </button>
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                        🔄 Actualizar
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <StatCard
                        icon="🩺"
                        label="Servicios Hoy"
                        value={stats.total_servicios || '0'}
                        color="blue"
                    />
                    <StatCard
                        icon="🚗"
                        label="Conductores Activos"
                        value={stats.conductores_activos || '0'}
                        color="emerald"
                        href="/dashboard/conductores"
                    />
                    <StatCard
                        icon="⏱️"
                        label="Tiempo Promedio"
                        value={stats.tiempo_promedio ? `${stats.tiempo_promedio} min` : '—'}
                        color="amber"
                    />
                    <StatCard
                        icon="📍"
                        label="Distritos Cubiertos"
                        value={stats.distritos_cubiertos || '0'}
                        color="purple"
                    />
                    <StatCard
                        icon="⚠️"
                        label="Errores Parse"
                        value={stats.errores_parse || '0'}
                        color="red"
                    />
                </div>
            )}

            {/* Tabla Principal */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Hora', 'Conductor', 'Placa', 'Paciente', 'Técnico', 'Distrito', 'Llegada', 'Salida', 'Duración', 'Obs'].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase text-gray-500 tracking-wider">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-12 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
                                    </td>
                                </tr>
                            ) : reportes.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                                        No hay reportes para esta fecha
                                    </td>
                                </tr>
                            ) : (
                                reportes.map((r) => {
                                    const sinConductor = r.conductor_id === null;
                                    const rowClass = r.error_parse
                                        ? 'bg-red-100 border-l-4 border-red-500'
                                        : sinConductor
                                            ? 'bg-red-50 border-l-4 border-red-400'
                                            : !r.match_tecnico
                                                ? 'bg-yellow-50/50'
                                                : 'hover:bg-gray-50';

                                    return (
                                        <tr key={r.id} className={`transition-colors ${rowClass}`}>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {r.fecha_recibido
                                                    ? new Date(r.fecha_recibido).toLocaleTimeString('es-PE', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })
                                                    : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {r.conductor_nombre ? (
                                                    <a
                                                        href={`/dashboard/conductores?id=${r.conductor_id}`}
                                                        className="text-blue-600 hover:underline font-medium"
                                                    >
                                                        {r.conductor_nombre}
                                                    </a>
                                                ) : (
                                                    <a
                                                        href="/dashboard/conductores"
                                                        title="Conductor no registrado — click para agregar"
                                                        className="inline-flex items-center gap-1 text-red-600 font-semibold hover:text-red-800 hover:underline cursor-pointer"
                                                    >
                                                        <span>{r.conductor_raw || '—'}</span>
                                                        <span className="bg-red-100 text-red-700 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-red-300">+ AGREGAR</span>
                                                    </a>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-mono text-gray-700">
                                                {r.conductor_placa || r.placa_raw || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {r.paciente_nombre ? (
                                                    <a
                                                        href={`/dashboard/pacientes?id=${r.paciente_id}`}
                                                        className="text-blue-600 hover:underline font-medium"
                                                    >
                                                        {r.paciente_nombre}
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-500">{r.paciente_raw || '—'}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {r.tecnico_nombre ? (
                                                    <span className="font-medium text-gray-800">{r.tecnico_nombre}</span>
                                                ) : (
                                                    <span className="text-yellow-600" title="Técnico no encontrado en sistema">
                                                        {r.tecnico_raw || '—'} ⚠️
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{r.distrito || '—'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {r.hora_llegada ? r.hora_llegada.substring(0, 5) : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {r.hora_salida ? r.hora_salida.substring(0, 5) : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                                                {r.duracion_minutos ? `${r.duracion_minutos} min` : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate" title={r.observaciones || ''}>
                                                {r.observaciones || '—'}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Desglose inferior */}
            {(distritos.length > 0 || porConductor.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {/* Por Distrito */}
                    {distritos.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-black uppercase text-gray-500 tracking-wider mb-4">
                                📍 Por Distrito
                            </h3>
                            <div className="space-y-2">
                                {distritos.map((d) => (
                                    <div key={d.distrito} className="flex items-center justify-between">
                                        <span className="text-sm text-gray-700">{d.distrito}</span>
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                            {d.total}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Por Conductor */}
                    {porConductor.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-black uppercase text-gray-500 tracking-wider mb-4">
                                🚗 Por Conductor
                            </h3>
                            <div className="space-y-2">
                                {porConductor.map((c: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div>
                                            <span className="text-sm font-medium text-gray-700">{c.nombre}</span>
                                            {c.placa && (
                                                <span className="ml-2 text-xs text-gray-400 font-mono">{c.placa}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                                {c.total_servicios} svc
                                            </span>
                                            {c.tiempo_promedio && (
                                                <span className="text-xs text-gray-400">
                                                    ~{c.tiempo_promedio} min
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Componente StatCard ─────────────────────────────────────────────
function StatCard({
    icon,
    label,
    value,
    color,
    href,
}: {
    icon: string;
    label: string;
    value: string;
    color: string;
    href?: string;
}) {
    const colorMap: Record<string, string> = {
        blue: 'bg-blue-50 border-blue-200 text-blue-700',
        emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        amber: 'bg-amber-50 border-amber-200 text-amber-700',
        purple: 'bg-purple-50 border-purple-200 text-purple-700',
        red: 'bg-red-50 border-red-200 text-red-700',
    };

    const content = (
        <div className={`rounded-xl border p-4 ${colorMap[color] || colorMap.blue}`}>
            <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{icon}</span>
                <span className="text-[10px] font-black uppercase tracking-wider opacity-70">{label}</span>
            </div>
            <div className="text-2xl font-black">{value}</div>
        </div>
    );

    if (href) {
        return <a href={href} className="block hover:opacity-90 transition-opacity">{content}</a>;
    }
    return content;
}
