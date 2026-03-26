'use client';

import { useState, useEffect } from 'react';
import { PersonalTab } from '@/components/doctores/tabs/PersonalTab';
import { ConsultaTab } from '@/components/doctores/tabs/ConsultaTab';
import ExportacionDoctores from '@/components/doctores/ExportacionDoctores';

type ViewMode = 'tarjetas' | 'lista';

export default function DoctoresPage() {
    const [activeTab, setActiveTab] = useState('lista');
    const [doctores, setDoctores] = useState<any[]>([]);
    const [especialidades, setEspecialidades] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [filtroEspecialidad, setFiltroEspecialidad] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('tarjetas');

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [showExport, setShowExport] = useState(false);

    const [formData, setFormData] = useState<any>({
        estado: 'ACTIVO',
        acepta_teleconsulta: false,
        duracion_consulta_min: 30,
        moneda: 'PEN'
    });
    const [errors, setErrors] = useState<any>({});
    const [editingId, setEditingId] = useState<number | null>(null);

    useEffect(() => { fetchEspecialidades(); }, []);

    useEffect(() => {
        if (activeTab === 'lista') fetchDoctores();
    }, [activeTab, search, filtroEspecialidad, page, limit]);

    useEffect(() => { setPage(1); }, [search, filtroEspecialidad]);

    const fetchEspecialidades = async () => {
        try {
            const res = await fetch('/api/especialidades');
            const data = await res.json();
            setEspecialidades(data.especialidades || []);
        } catch (error) {
            console.error('Error cargando especialidades:', error);
        }
    };

    const fetchDoctores = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (filtroEspecialidad) params.append('especialidad_id', filtroEspecialidad);
            params.append('limit', limit.toString());
            params.append('offset', ((page - 1) * limit).toString());

            const res = await fetch(`/api/doctores?${params}`);
            const data = await res.json();
            setDoctores(data.doctores || []);
            if (data.pagination) {
                setTotal(data.pagination.total);
                setTotalPages(data.pagination.pages);
            }
        } catch (error) {
            console.error('Error cargando doctores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev: any) => ({ ...prev, [field]: null }));
    };

    const validateForm = () => {
        const newErrors: any = {};
        if (!formData.nombres) newErrors.nombres = 'Requerido';
        if (!formData.apellido_paterno) newErrors.apellido_paterno = 'Requerido';
        if (!formData.cmp) newErrors.cmp = 'Requerido';
        if (!formData.especialidad_principal_id) newErrors.especialidad_principal_id = 'Requerido';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const uploadFoto = async (file: File): Promise<string> => {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'doctores');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Error al subir la foto');
        const data = await res.json();
        return data.url;
    };

    const handleSubmit = async () => {
        if (!validateForm()) { alert('Por favor completa los campos requeridos'); return; }
        setLoading(true);
        try {
            const payload = { ...formData };
            if (payload.foto_url instanceof File) payload.foto_url = await uploadFoto(payload.foto_url);
            if (payload.fecha_nacimiento === '') payload.fecha_nacimiento = null;

            const url = editingId ? `/api/doctores/${editingId}` : '/api/doctores';
            const method = editingId ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'Error al guardar'); }

            alert(editingId ? 'Doctor actualizado' : 'Doctor creado exitosamente');
            setActiveTab('lista');
            setFormData({ estado: 'ACTIVO', acepta_teleconsulta: false, duracion_consulta_min: 30, moneda: 'PEN' });
            setEditingId(null);
            fetchDoctores();
        } catch (error: any) { alert(error.message); } finally { setLoading(false); }
    };

    const handleEdit = async (id: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/doctores/${id}`);
            const data = await res.json();
            setFormData(data.doctor);
            setEditingId(id);
            setActiveTab('personal');
        } catch { alert('Error al cargar doctor'); } finally { setLoading(false); }
    };

    const handleDelete = async (id: number, nombre: string) => {
        if (!confirm(`\u26A0\uFE0F \u00BFEliminar al doctor?\n\n"${nombre}"\n\nEsta acci\u00F3n lo remover\u00E1 del listado de forma permanente.`)) return;
        try {
            const res = await fetch(`/api/doctores/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Error al eliminar');
            alert(`Doctor "${nombre}" eliminado exitosamente.`);
            fetchDoctores();
        } catch (error: any) { alert(error.message); }
    };

    const handleNewDoctor = () => {
        setFormData({ estado: 'ACTIVO', acepta_teleconsulta: false, duracion_consulta_min: 30, moneda: 'PEN' });
        setEditingId(null);
        setErrors({});
        setActiveTab('personal');
    };

    /* ─── Estadísticas rápidas ─────────────────────────────────────── */
    const stats = {
        total,
        conFoto: doctores.filter((d: any) => d.foto_url).length,
        especialidades: Array.from(new Set(doctores.map((d: any) => d.especialidad_nombre).filter(Boolean))).length,
    };

    /* ─── Tarjeta doctor (grid) ────────────────────────────────────── */
    const DoctorCard = ({ doctor }: { doctor: any }) => {
        const initials = `${(doctor.nombres || '?')[0]}${(doctor.apellido_paterno || '?')[0]}`.toUpperCase();
        return (
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                        {doctor.foto_url ? (
                            <img src={doctor.foto_url} alt={doctor.nombre_completo} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-lg font-bold text-blue-600">{initials}</span>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{doctor.nombre_completo}</h3>
                        <p className="text-xs text-gray-500">CMP: {doctor.cmp}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${doctor.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {doctor.estado}
                    </span>
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 mb-3">
                    <div className="flex items-center gap-1.5">
                        <span className="text-blue-500">&#9679;</span>
                        <span className="truncate">{doctor.especialidad_nombre || 'Sin especialidad'}</span>
                    </div>
                    {doctor.celular && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-green-500">&#9742;</span>
                            <span>{doctor.celular}</span>
                        </div>
                    )}
                    {doctor.universidad && (
                        <div className="flex items-center gap-1.5">
                            <span className="text-purple-500">&#127891;</span>
                            <span className="truncate">{doctor.universidad}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-400 border-t border-gray-100 pt-2 mb-3">
                    <span>{doctor.numero_clinicas || 0} cl\u00EDnicas</span>
                    <span>{doctor.numero_pacientes || 0} pacientes</span>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => handleEdit(doctor.id)} className="flex-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 py-1.5 rounded-md font-medium transition-colors">
                        Editar
                    </button>
                    <button onClick={() => handleDelete(doctor.id, doctor.nombre_completo)} className="flex-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 py-1.5 rounded-md font-medium transition-colors">
                        Eliminar
                    </button>
                </div>
            </div>
        );
    };

    /* ─── Paginación ───────────────────────────────────────────────── */
    const Pagination = () => {
        if (total <= 0) return null;
        return (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 mt-4">
                <p className="text-sm text-gray-700">
                    <span className="font-medium">{(page - 1) * limit + 1}</span>–<span className="font-medium">{Math.min(page * limit, total)}</span> de <span className="font-medium">{total}</span>
                </p>
                <nav className="inline-flex -space-x-px rounded-md shadow-sm">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-2 rounded-l-md text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:bg-gray-100 text-sm">&#9664;</button>
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        let pNum = i + 1;
                        if (totalPages > 5) { if (page > 3) pNum = page - 2 + i; if (pNum > totalPages) pNum = totalPages - (4 - i); }
                        return (
                            <button key={pNum} onClick={() => setPage(pNum)}
                                className={`px-3 py-2 text-sm font-semibold ${page === pNum ? 'bg-blue-600 text-white' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'}`}>
                                {pNum}
                            </button>
                        );
                    })}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-2 rounded-r-md text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:bg-gray-100 text-sm">&#9654;</button>
                </nav>
            </div>
        );
    };

    /* ─── RENDER ──────────────────────────────────────────────────── */
    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Gesti&oacute;n de Doctores</h1>
                <p className="text-gray-600 mt-1">Administra la informaci&oacute;n de los m&eacute;dicos profesionales</p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-t-lg border-b border-gray-200">
                <div className="flex gap-6 px-6">
                    <button onClick={() => setActiveTab('lista')} className={`py-4 px-2 border-b-2 font-medium transition-colors ${activeTab === 'lista' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        Lista de Doctores
                    </button>
                    {activeTab !== 'lista' && (
                        <>
                            <button onClick={() => setActiveTab('personal')} className={`py-4 px-2 border-b-2 font-medium transition-colors ${activeTab === 'personal' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                Personal
                            </button>
                            <button onClick={() => setActiveTab('consulta')} className={`py-4 px-2 border-b-2 font-medium transition-colors ${activeTab === 'consulta' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                                Consulta &amp; Tarifas
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-b-lg shadow-sm p-6">
                {activeTab === 'lista' && (
                    <div>
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-blue-500 text-white p-4 rounded-lg">
                                <div className="text-2xl font-bold">{stats.total}</div>
                                <div className="text-sm opacity-90">Total Doctores</div>
                            </div>
                            <div className="bg-emerald-500 text-white p-4 rounded-lg">
                                <div className="text-2xl font-bold">{stats.conFoto}</div>
                                <div className="text-sm opacity-90">Con Foto</div>
                            </div>
                            <div className="bg-purple-500 text-white p-4 rounded-lg">
                                <div className="text-2xl font-bold">{stats.especialidades}</div>
                                <div className="text-sm opacity-90">Especialidades</div>
                            </div>
                        </div>

                        {/* Controles */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 space-y-3">
                            {/* Búsqueda */}
                            <input
                                type="text"
                                placeholder="Buscar por nombre, CMP, DNI o especialidad..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />

                            {/* Filtros y controles */}
                            <div className="flex flex-col md:flex-row justify-between gap-3">
                                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                                    <select value={filtroEspecialidad} onChange={(e) => setFiltroEspecialidad(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                                        <option value="">Todas las especialidades</option>
                                        {especialidades.map((e: any) => (
                                            <option key={e.id} value={e.id}>{e.nombre}</option>
                                        ))}
                                    </select>
                                    <select value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                                        <option value={20}>20 por p&aacute;gina</option>
                                        <option value={50}>50 por p&aacute;gina</option>
                                        <option value={100}>100 por p&aacute;gina</option>
                                    </select>
                                </div>

                                <div className="flex gap-2 items-center">
                                    {/* Vista toggle */}
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        <button onClick={() => setViewMode('tarjetas')} title="Vista tarjetas"
                                            className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${viewMode === 'tarjetas' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                            </svg>
                                        </button>
                                        <button onClick={() => setViewMode('lista')} title="Vista lista"
                                            className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${viewMode === 'lista' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                            </svg>
                                        </button>
                                    </div>

                                    <button onClick={() => setShowExport(true)} disabled={doctores.length === 0}
                                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Exportar
                                    </button>
                                    <button onClick={handleNewDoctor} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg transition-colors text-sm">
                                        + Nuevo Doctor
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Data */}
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            </div>
                        ) : (
                            <>
                                {/* Vista Tarjetas (grid) */}
                                {viewMode === 'tarjetas' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {doctores.map((doctor: any) => (
                                            <DoctorCard key={doctor.id} doctor={doctor} />
                                        ))}
                                        {doctores.length === 0 && (
                                            <div className="col-span-full text-center py-12 text-gray-500">No hay doctores registrados</div>
                                        )}
                                    </div>
                                )}

                                {/* Vista Lista (tabla) */}
                                {viewMode === 'lista' && (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CMP</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Especialidad</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {doctores.map((doctor: any) => {
                                                    const initials = `${(doctor.nombres || '?')[0]}${(doctor.apellido_paterno || '?')[0]}`.toUpperCase();
                                                    return (
                                                        <tr key={doctor.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full flex-shrink-0 bg-blue-100 flex items-center justify-center overflow-hidden">
                                                                        {doctor.foto_url ? (
                                                                            <img src={doctor.foto_url} alt={doctor.nombre_completo} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <span className="text-sm font-bold text-blue-600">{initials}</span>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-sm font-medium text-gray-900">{doctor.nombre_completo}</div>
                                                                        {doctor.universidad && <div className="text-xs text-gray-400">{doctor.universidad}</div>}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{doctor.cmp}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">{doctor.especialidad_nombre || 'N/A'}</td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                                {doctor.celular && <div>{doctor.celular}</div>}
                                                                {doctor.email_profesional && <div className="text-xs">{doctor.email_profesional}</div>}
                                                            </td>
                                                            <td className="px-4 py-3 text-sm">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${doctor.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                                    {doctor.estado}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm">
                                                                <button onClick={() => handleEdit(doctor.id)} className="text-blue-600 hover:text-blue-800 mr-3">Editar</button>
                                                                <button onClick={() => handleDelete(doctor.id, doctor.nombre_completo)} className="text-red-600 hover:text-red-800">Eliminar</button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                        {doctores.length === 0 && (
                                            <div className="text-center py-12 text-gray-500">No hay doctores registrados</div>
                                        )}
                                    </div>
                                )}

                                <Pagination />
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'personal' && (
                    <PersonalTab formData={formData} onChange={handleChange} errors={errors} especialidades={especialidades} />
                )}

                {activeTab === 'consulta' && (
                    <ConsultaTab formData={formData} onChange={handleChange} />
                )}

                {activeTab !== 'lista' && (
                    <div className="mt-8 flex gap-3">
                        <button onClick={handleSubmit} disabled={loading}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                            {loading ? 'Guardando...' : (editingId ? 'Actualizar Doctor' : 'Crear Doctor')}
                        </button>
                        <button onClick={() => { setActiveTab('lista'); setFormData({ estado: 'ACTIVO', acepta_teleconsulta: false, duracion_consulta_min: 30, moneda: 'PEN' }); setEditingId(null); }}
                            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                            Cancelar
                        </button>
                    </div>
                )}
            </div>

            {showExport && (
                <ExportacionDoctores datos={doctores} total={total} onClose={() => setShowExport(false)} />
            )}
        </div>
    );
}
