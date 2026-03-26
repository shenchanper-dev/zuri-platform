"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    X, Save, RefreshCw, Search, Calendar, Clock, MapPin,
    User, Stethoscope, Car, Building2, FileText, AlertCircle, Route
} from 'lucide-react';

// ============================================================================
// TIPOS
// ============================================================================

interface Catalogo {
    areas: { id: number; codigo: string; nombre: string }[];
    tipos: { id: number; codigo: string; nombre: string; descripcion?: string }[];
    calificaciones: { id: number; codigo: string; descripcion: string; tipo: string; color: string }[];
    clientes: { id: number; codigo: string; nombre: string; nombre_completo: string }[];
    especialidades: { id: number; codigo: string; nombre: string; tipo: string }[];
    distritos: { id: number; nombre: string }[];
    conductores: { id: number; nombreCompleto: string; dni: string; placa: string; estado: string }[];
    doctores: { id: number; nombre: string; dni: string; cmp: string }[];
}

interface DetalleParaEditar {
    id: number;
    fecha: string;
    turno: string | null;
    doctor_id?: number | null;
    doctor_nombre: string;
    conductor_id?: number | null;
    conductor_nombre?: string | null;
    conductor_nombre_bd?: string;
    hora_inicio: string;
    hora_fin: string;
    ubicacion?: string | null;
    direccion_completa?: string | null;
    area_servicio_id?: number | null;
    tipo_servicio_id?: number | null;
    cliente_especial_id?: number | null;
    cliente_nombre?: string | null;
    distrito_id?: number | null;
    distrito_nombre?: string | null;
    especialidad_id?: number | null;
    especialidad_nombre?: string | null;
    calificacion_id?: number | null;
    estado: string;
    observaciones?: string | null;
}

interface DispatchEditPanelProps {
    detalle: DetalleParaEditar;
    onGuardar: (detalleId: number, campos: Record<string, any>) => void;
    onCerrar: () => void;
}

const ESTADOS = [
    { value: 'PROGRAMADO', label: 'Programado' },
    { value: 'ASIGNADO', label: 'Asignado' },
    { value: 'EN_CURSO', label: 'En Curso' },
    { value: 'COMPLETADO', label: 'Completado' },
    { value: 'D', label: 'D – Devuelto' },
    { value: 'NM', label: 'NM – No Marcó' },
    { value: 'G', label: 'G – Viene de Guardia' },
    { value: 'OSM', label: 'OSM – Otro sacó material' },
    { value: 'C', label: 'C – Cancelado cliente' },
    { value: 'CED', label: 'CED – Cancelado domicilio' },
    { value: 'DT', label: 'DT – Doble Turno' },
];

const TURNOS = [
    { value: 'M', label: 'M – Mañana' },
    { value: 'T', label: 'T – Tarde' },
    { value: 'N', label: 'N – Noche' },
    { value: 'M-T', label: 'M-T – Mañana y Tarde' },
];

// Especialidades de RUTA del conductor (no médicas) 
const ESPECIALIDADES_RUTA = [
    { value: 'AGUDO', label: 'AGUDO' },
    { value: 'C.I.', label: 'C.I.' },
    { value: 'S.M.', label: 'S.M.' },
    { value: 'M', label: 'M' },
    { value: 'OTROS', label: 'OTROS' },
];

// ============================================================================
// SEARCHABLE SELECT — componente estable fuera del render principal
// Se extrae como componente separado para evitar pérdida de foco
// ============================================================================

interface SearchableSelectProps {
    label: string;
    icon: any;
    value: number | null;
    displayText: string;
    searchValue: string;
    onSearchChange: (v: string) => void;
    options: { id: number; label: string; sub?: string }[];
    onSelect: (id: number, label: string) => void;
    showList: boolean;
    setShowList: (v: boolean) => void;
}

function SearchableSelect({
    label, icon: Icon, value, displayText,
    searchValue, onSearchChange, options, onSelect,
    showList, setShowList
}: SearchableSelectProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    // Keep focus on the input while the dropdown is open
    useEffect(() => {
        if (showList && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showList, options]);

    return (
        <div className="relative edit-panel-search">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                <Icon className="h-3.5 w-3.5 inline mr-1" />
                {label}
            </label>
            <div className="relative">
                <input
                    ref={inputRef}
                    value={showList ? searchValue : displayText}
                    onChange={e => { onSearchChange(e.target.value); if (!showList) setShowList(true); }}
                    onFocus={() => setShowList(true)}
                    placeholder={`Buscar ${label.toLowerCase()}…`}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 pr-8"
                />
                {value ? (
                    <button onClick={() => { onSelect(0 as any, ''); onSearchChange(''); setShowList(false); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-400 p-1">
                        <X className="h-4 w-4" />
                    </button>
                ) : null}
            </div>
            {showList && options.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {options.map(opt => (
                        <button
                            key={opt.id}
                            onMouseDown={(e) => {
                                // Use mouseDown to fire before blur
                                e.preventDefault();
                                onSelect(opt.id, opt.label);
                                onSearchChange('');
                                setShowList(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 text-sm hover:bg-indigo-50 border-b border-gray-50 last:border-0
                                ${opt.id === value ? 'bg-indigo-100 font-semibold' : ''}`}
                        >
                            <span className="block font-medium text-gray-900">{opt.label}</span>
                            {opt.sub && <span className="text-xs text-gray-400">{opt.sub}</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function DispatchEditPanel({ detalle, onGuardar, onCerrar }: DispatchEditPanelProps) {
    const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
    const [loadingCatalogo, setLoadingCatalogo] = useState(true);
    const [guardando, setGuardando] = useState(false);

    // Editable fields state
    const [fecha, setFecha] = useState(detalle.fecha?.substring(0, 10) || '');
    const [turno, setTurno] = useState(detalle.turno || '');
    const [doctorId, setDoctorId] = useState<number | null>(detalle.doctor_id ?? null);
    const [doctorNombre, setDoctorNombre] = useState(detalle.doctor_nombre || '');
    const [conductorId, setConductorId] = useState<number | null>(detalle.conductor_id ?? null);
    const [conductorNombre, setConductorNombre] = useState(detalle.conductor_nombre_bd || detalle.conductor_nombre || '');
    const [horaInicio, setHoraInicio] = useState(detalle.hora_inicio?.toString().slice(0, 5) || '');
    const [horaFin, setHoraFin] = useState(detalle.hora_fin?.toString().slice(0, 5) || '');
    const [ubicacion, setUbicacion] = useState(detalle.ubicacion || '');
    const [direccionCompleta, setDireccionCompleta] = useState(detalle.direccion_completa || '');
    const [areaId, setAreaId] = useState<number | null>(detalle.area_servicio_id ?? null);
    const [tipoId, setTipoId] = useState<number | null>(detalle.tipo_servicio_id ?? null);
    const [clienteId, setClienteId] = useState<number | null>(detalle.cliente_especial_id ?? null);
    const [clienteNombre, setClienteNombre] = useState(detalle.cliente_nombre || '');
    const [distritoId, setDistritoId] = useState<number | null>(detalle.distrito_id || null);
    // Especialidad de Ruta — stored as text, not as FK
    const [espRuta, setEspRuta] = useState(detalle.especialidad_nombre || '');
    const [calificacionId, setCalificacionId] = useState<number | null>(detalle.calificacion_id ?? null);
    const [estado, setEstado] = useState(detalle.estado || 'PROGRAMADO');
    const [observaciones, setObservaciones] = useState(detalle.observaciones || '');

    // Search states for conductor and doctor
    const [buscarDoctor, setBuscarDoctor] = useState('');
    const [buscarConductor, setBuscarConductor] = useState('');
    const [showDoctorList, setShowDoctorList] = useState(false);
    const [showConductorList, setShowConductorList] = useState(false);

    // Load catalogs
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/catalogos');
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                setCatalogo(data);
            } catch (e) {
                console.error('Error loading catalogos:', e);
            } finally {
                setLoadingCatalogo(false);
            }
        })();
    }, []);

    // Filtered doctors/conductors
    const doctoresFiltrados = useMemo(() => {
        if (!catalogo?.doctores) return [];
        const q = buscarDoctor.toLowerCase();
        if (!q) return catalogo.doctores.slice(0, 20);
        return catalogo.doctores.filter(d =>
            d.nombre.toLowerCase().includes(q) || (d.dni || '').includes(q)
        ).slice(0, 15);
    }, [catalogo, buscarDoctor]);

    const conductoresFiltrados = useMemo(() => {
        if (!catalogo?.conductores) return [];
        const q = buscarConductor.toLowerCase();
        if (!q) return catalogo.conductores.slice(0, 20);
        return catalogo.conductores.filter(c =>
            (c.nombreCompleto || '').toLowerCase().includes(q) ||
            (c.placa || '').toLowerCase().includes(q) ||
            (c.dni || '').includes(q)
        ).slice(0, 15);
    }, [catalogo, buscarConductor]);

    // Handle save
    const handleGuardar = async () => {
        setGuardando(true);
        try {
            const body: Record<string, any> = {
                fecha: fecha || undefined,
                turno: turno || undefined,
                doctor_id: doctorId,
                doctor_nombre: doctorNombre,
                conductor_id: conductorId,
                conductor_nombre: conductorNombre,
                hora_inicio: horaInicio || undefined,
                hora_fin: horaFin || undefined,
                ubicacion: ubicacion || undefined,
                direccion_completa: direccionCompleta || undefined,
                area_servicio_id: areaId,
                tipo_servicio_id: tipoId,
                cliente_especial_id: clienteId,
                cliente_nombre: clienteNombre || undefined,
                distrito_id: distritoId,
                distrito_nombre: catalogo?.distritos.find(d => d.id === distritoId)?.nombre || undefined,
                // Especialidad de Ruta se guarda como nombre/texto
                especialidad_id: null,
                especialidad_nombre: espRuta || undefined,
                calificacion_id: calificacionId,
                estado,
                observaciones: observaciones || undefined,
            };

            const res = await fetch(`/api/programacion-detalles/${detalle.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error('Error al guardar');
            onGuardar(detalle.id, body);
        } catch (e) {
            console.error('Error guardando detalle:', e);
            alert('Error al guardar los cambios.');
        } finally {
            setGuardando(false);
        }
    };

    // Close dropdowns on outside click  
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.edit-panel-search')) {
                setShowDoctorList(false);
                setShowConductorList(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Label component for reuse
    const Label = ({ icon: LabelIcon, children }: { icon?: any; children: React.ReactNode }) => (
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            {LabelIcon && <LabelIcon className="h-3.5 w-3.5 inline mr-1" />}
            {children}
        </label>
    );

    const inputCls = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300";
    const selectCls = `${inputCls} bg-white`;

    return (
        <div className="fixed inset-x-0 bottom-0 top-16 z-50 flex justify-end">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCerrar} />

            {/* Panel — responsive: full-width on mobile, 480px on tablet, 520px on desktop */}
            <div className="relative w-full sm:max-w-[480px] lg:max-w-[520px] bg-white shadow-2xl flex flex-col h-full animate-slide-in-right">
                {/* Header — always visible, fixed at top */}
                <div className="flex-shrink-0 px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-indigo-500 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg font-bold text-white truncate">
                            ✏️ Editar Servicio
                        </h3>
                        <p className="text-xs text-indigo-100 mt-0.5 truncate">
                            #{detalle.id} — {detalle.doctor_nombre}
                        </p>
                    </div>
                    <button onClick={onCerrar} className="ml-2 p-2 rounded-lg hover:bg-white/20 transition flex-shrink-0">
                        <X className="h-5 w-5 text-white" />
                    </button>
                </div>

                {/* Body — scrollable */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4">
                    {loadingCatalogo ? (
                        <div className="flex items-center justify-center h-40 text-gray-400">
                            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                            Cargando catálogos…
                        </div>
                    ) : (
                        <>
                            {/* Row 1: Fecha + Turno */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label icon={Calendar}>Fecha</Label>
                                    <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                                        className={inputCls} />
                                </div>
                                <div>
                                    <Label icon={Clock}>Turno</Label>
                                    <select value={turno} onChange={e => setTurno(e.target.value)} className={selectCls}>
                                        <option value="">Sin turno</option>
                                        {TURNOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Row 2: Cliente */}
                            <div>
                                <Label icon={Building2}>Cliente</Label>
                                <select value={clienteId || ''} onChange={e => {
                                    const id = Number(e.target.value) || null;
                                    setClienteId(id);
                                    setClienteNombre(catalogo?.clientes.find(c => c.id === id)?.nombre || '');
                                }} className={selectCls}>
                                    <option value="">Seleccionar cliente…</option>
                                    {catalogo?.clientes.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre} — {c.nombre_completo}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Row 3: Area + Tipo */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label>Área</Label>
                                    <select value={areaId || ''} onChange={e => setAreaId(Number(e.target.value) || null)}
                                        className={selectCls}>
                                        <option value="">Seleccionar…</option>
                                        {catalogo?.areas.map(a => (
                                            <option key={a.id} value={a.id}>{a.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label>Tipo de Servicio</Label>
                                    <select value={tipoId || ''} onChange={e => setTipoId(Number(e.target.value) || null)}
                                        className={selectCls}>
                                        <option value="">Seleccionar…</option>
                                        {catalogo?.tipos.map(t => (
                                            <option key={t.id} value={t.id}>{t.codigo} — {t.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Row 4: Especialidad de Ruta + Clasificación */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label icon={Route}>Esp. de Ruta</Label>
                                    <select value={espRuta} onChange={e => setEspRuta(e.target.value)}
                                        className={selectCls}>
                                        <option value="">Seleccionar…</option>
                                        {ESPECIALIDADES_RUTA.map(e => (
                                            <option key={e.value} value={e.value}>{e.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label>Clasificación</Label>
                                    <select value={calificacionId || ''} onChange={e => setCalificacionId(Number(e.target.value) || null)}
                                        className={selectCls}>
                                        <option value="">Sin clasificar</option>
                                        {catalogo?.calificaciones.map(c => (
                                            <option key={c.id} value={c.id}>{c.descripcion}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Row 5: Doctor (searchable) */}
                            <SearchableSelect
                                label="Médico" icon={Stethoscope}
                                value={doctorId} displayText={doctorNombre}
                                searchValue={buscarDoctor} onSearchChange={setBuscarDoctor}
                                options={doctoresFiltrados.map(d => ({ id: d.id, label: d.nombre, sub: d.dni ? `DNI: ${d.dni}` : undefined }))}
                                onSelect={(id, label) => { setDoctorId(id || null); setDoctorNombre(label); setBuscarDoctor(''); }}
                                showList={showDoctorList} setShowList={setShowDoctorList}
                            />

                            {/* Row 6: Conductor (searchable) */}
                            <SearchableSelect
                                label="Conductor" icon={Car}
                                value={conductorId} displayText={conductorNombre}
                                searchValue={buscarConductor} onSearchChange={setBuscarConductor}
                                options={conductoresFiltrados.map(c => ({
                                    id: c.id,
                                    label: c.nombreCompleto || `DNI: ${c.dni}`,
                                    sub: c.placa ? `Placa: ${c.placa}` : undefined
                                }))}
                                onSelect={(id, label) => { setConductorId(id || null); setConductorNombre(label); setBuscarConductor(''); }}
                                showList={showConductorList} setShowList={setShowConductorList}
                            />

                            {/* Row 7: Horario */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label icon={Clock}>Hora Inicio</Label>
                                    <input type="time" value={horaInicio} onChange={e => setHoraInicio(e.target.value)}
                                        className={inputCls} />
                                </div>
                                <div>
                                    <Label icon={Clock}>Hora Fin</Label>
                                    <input type="time" value={horaFin} onChange={e => setHoraFin(e.target.value)}
                                        className={inputCls} />
                                </div>
                            </div>

                            {/* Row 8: Distrito */}
                            <div>
                                <Label icon={MapPin}>Distrito</Label>
                                <select value={distritoId || ''} onChange={e => setDistritoId(Number(e.target.value) || null)}
                                    className={selectCls}>
                                    <option value="">Seleccionar distrito…</option>
                                    {catalogo?.distritos.map(d => (
                                        <option key={d.id} value={d.id}>{d.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Row 9: Ubicación + Dirección */}
                            <div>
                                <Label icon={MapPin}>Ubicación / Dirección</Label>
                                <input value={ubicacion} onChange={e => setUbicacion(e.target.value)}
                                    placeholder="Clínica SANNA San Isidro"
                                    className={`${inputCls} mb-2`} />
                                <input value={direccionCompleta} onChange={e => setDireccionCompleta(e.target.value)}
                                    placeholder="Dirección completa (recojo → destino)"
                                    className={inputCls} />
                            </div>

                            {/* Row 10: Estado */}
                            <div>
                                <Label>Estado</Label>
                                <select value={estado} onChange={e => setEstado(e.target.value)} className={selectCls}>
                                    {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                                </select>
                            </div>

                            {/* Row 11: Observaciones */}
                            <div>
                                <Label icon={FileText}>Observaciones</Label>
                                <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
                                    rows={3} placeholder="Notas adicionales…"
                                    className={`${inputCls} resize-none`} />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer — sticky at bottom */}
                <div className="flex-shrink-0 px-4 sm:px-5 py-3 sm:py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3">
                    <button onClick={onCerrar}
                        className="px-4 py-2.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium">
                        Cancelar
                    </button>
                    <button onClick={handleGuardar} disabled={guardando}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50">
                        {guardando ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Guardar Cambios
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slideInRight 0.25s ease-out;
                }
            `}</style>
        </div>
    );
}
