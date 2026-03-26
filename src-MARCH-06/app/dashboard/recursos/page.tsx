"use client";

import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
    Search, RefreshCw, User, Car, Stethoscope, AlertCircle, Link2, X,
    Phone, CreditCard, Hash, Activity, MapPin, Truck
} from "lucide-react";

// ============================================================================
// TIPOS
// ============================================================================

interface Conductor {
    id: number;
    dni: string;
    nombreCompleto: string;
    nombres: string;
    apellidos: string;
    celular1: string | null;
    celular2: string | null;
    email: string | null;
    placa: string | null;
    marcaVehiculo: string | null;
    modeloVehiculo: string | null;
    tipoVehiculo: string | null;
    colorVehiculo: string | null;
    numeroBrevete: string | null;
    licencia_categoria: string | null;
    estado: string;
    estadoServicio: string;
    domicilioCompleto: string | null;
    distrito_nombre: string | null;
}

interface Doctor {
    id: number;
    dni: string;
    nombre_completo: string;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
    celular: string | null;
    email_profesional: string | null;
    cmp: string | null;
    rne: string | null;
    especialidad_nombre: string | null;
    universidad: string | null;
    estado: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const estadoBadge = (estado: string) => {
    const map: Record<string, string> = {
        ACTIVO: "bg-green-100 text-green-700 border-green-300",
        INACTIVO: "bg-gray-100 text-gray-600 border-gray-300",
        DISPONIBLE: "bg-emerald-100 text-emerald-700 border-emerald-300",
        OCUPADO: "bg-amber-100 text-amber-700 border-amber-300",
        DESCONECTADO: "bg-slate-100 text-slate-500 border-slate-300",
    };
    return map[estado] || "bg-gray-100 text-gray-600 border-gray-300";
};

const Row = ({ label, value }: { label: string; value?: string | null }) => (
    value ? (
        <div className="flex gap-2 py-1.5 border-b border-gray-50 last:border-0">
            <span className="text-xs text-gray-400 w-32 shrink-0 font-medium">{label}</span>
            <span className="text-xs text-gray-800 font-medium">{value}</span>
        </div>
    ) : null
);

// ============================================================================
// DIALOGO DETALLE CONDUCTOR
// ============================================================================

function ConductorDialog({ conductor, onClose }: { conductor: Conductor; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-xs text-blue-200 uppercase tracking-wider font-medium">Conductor #{conductor.id}</p>
                        <h3 className="text-white font-bold text-base truncate">{conductor.nombreCompleto}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/20 transition ml-3 shrink-0">
                        <X className="h-5 w-5 text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                    {/* Estado badges */}
                    <div className="flex gap-2 flex-wrap">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${estadoBadge(conductor.estado)}`}>
                            {conductor.estado}
                        </span>
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${estadoBadge(conductor.estadoServicio)}`}>
                            {conductor.estadoServicio}
                        </span>
                    </div>

                    {/* Datos personales */}
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <User className="h-3.5 w-3.5" /> Datos Personales
                        </p>
                        <div className="bg-gray-50 rounded-xl px-4 py-2">
                            <Row label="DNI" value={conductor.dni} />
                            <Row label="Teléfono 1" value={conductor.celular1} />
                            <Row label="Teléfono 2" value={conductor.celular2} />
                            <Row label="Email" value={conductor.email} />
                            <Row label="Domicilio" value={conductor.domicilioCompleto} />
                            <Row label="Distrito" value={conductor.distrito_nombre} />
                        </div>
                    </div>

                    {/* Licencia */}
                    {(conductor.numeroBrevete || conductor.licencia_categoria) && (
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <CreditCard className="h-3.5 w-3.5" /> Licencia
                            </p>
                            <div className="bg-gray-50 rounded-xl px-4 py-2">
                                <Row label="N° Brevete" value={conductor.numeroBrevete} />
                                <Row label="Categoría" value={conductor.licencia_categoria} />
                            </div>
                        </div>
                    )}

                    {/* Vehículo */}
                    {conductor.placa && (
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                <Truck className="h-3.5 w-3.5" /> Vehículo
                            </p>
                            <div className="bg-gray-50 rounded-xl px-4 py-2">
                                <Row label="Placa" value={conductor.placa} />
                                <Row label="Tipo" value={conductor.tipoVehiculo} />
                                <Row label="Marca" value={conductor.marcaVehiculo} />
                                <Row label="Modelo" value={conductor.modeloVehiculo} />
                                <Row label="Color" value={conductor.colorVehiculo} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-3 bg-gray-50 border-t text-xs text-gray-400 text-center">
                    Para editar, ve al módulo <strong>Conductores</strong> en el menú lateral.
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// DIALOGO DETALLE DOCTOR
// ============================================================================

function DoctorDialog({ doctor, onClose }: { doctor: Doctor; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-4 flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-xs text-purple-200 uppercase tracking-wider font-medium">Doctor #{doctor.id}</p>
                        <h3 className="text-white font-bold text-base truncate">{doctor.nombre_completo}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/20 transition ml-3 shrink-0">
                        <X className="h-5 w-5 text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                    <div className="flex gap-2">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${estadoBadge(doctor.estado)}`}>
                            {doctor.estado}
                        </span>
                        {doctor.especialidad_nombre && (
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border bg-purple-50 text-purple-700 border-purple-200">
                                {doctor.especialidad_nombre}
                            </span>
                        )}
                    </div>

                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <User className="h-3.5 w-3.5" /> Datos Personales
                        </p>
                        <div className="bg-gray-50 rounded-xl px-4 py-2">
                            <Row label="DNI" value={(doctor.dni || '').replace(/^DNI/i, '') || '—'} />
                            <Row label="Teléfono" value={doctor.celular} />
                            <Row label="Email" value={doctor.email_profesional} />
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Stethoscope className="h-3.5 w-3.5" /> Credenciales
                        </p>
                        <div className="bg-gray-50 rounded-xl px-4 py-2">
                            <Row label="CMP" value={doctor.cmp} />
                            <Row label="RNE" value={doctor.rne} />
                            <Row label="Especialidad" value={doctor.especialidad_nombre} />
                            <Row label="Universidad" value={doctor.universidad} />
                        </div>
                    </div>
                </div>

                <div className="px-6 py-3 bg-gray-50 border-t text-xs text-gray-400 text-center">
                    Para editar, ve al módulo <strong>Doctores</strong> en el menú lateral.
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function RecursosPage() {
    const [activeTab, setActiveTab] = useState("drivers");
    const [searchQuery, setSearchQuery] = useState("");

    const [conductores, setConductores] = useState<Conductor[]>([]);
    const [loadingCond, setLoadingCond] = useState(true);
    const [totalCond, setTotalCond] = useState(0);

    const [doctores, setDoctores] = useState<Doctor[]>([]);
    const [loadingDoc, setLoadingDoc] = useState(true);
    const [totalDoc, setTotalDoc] = useState(0);

    const [conductorSeleccionado, setConductorSeleccionado] = useState<Conductor | null>(null);
    const [doctorSeleccionado, setDoctorSeleccionado] = useState<Doctor | null>(null);

    const cargarConductores = async () => {
        setLoadingCond(true);
        try {
            const res = await fetch('/api/conductores?limit=1000&page=1');
            const data = await res.json();
            const lista = data.conductores || data.data || [];
            setConductores(lista);
            setTotalCond(data.pagination?.total || lista.length);
        } catch (e) {
            console.error('Error cargando conductores:', e);
        } finally {
            setLoadingCond(false);
        }
    };

    const cargarDoctores = async () => {
        setLoadingDoc(true);
        try {
            const res = await fetch('/api/doctores?limit=1000&page=1');
            const data = await res.json();
            const lista = data.doctores || data.data || [];
            setDoctores(lista);
            setTotalDoc(data.pagination?.total || lista.length);
        } catch (e) {
            console.error('Error cargando doctores:', e);
        } finally {
            setLoadingDoc(false);
        }
    };

    useEffect(() => {
        cargarConductores();
        cargarDoctores();
    }, []);

    const q = searchQuery.toLowerCase();

    const conductoresFiltrados = useMemo(() =>
        conductores.filter(c =>
            (c.nombreCompleto || '').toLowerCase().includes(q) ||
            (c.dni || '').includes(q) ||
            (c.placa || '').toLowerCase().includes(q)
        ), [conductores, q]);

    const vehiculosFiltrados = useMemo(() =>
        conductores.filter(c => c.placa).filter(c =>
            (c.placa || '').toLowerCase().includes(q) ||
            (c.nombreCompleto || '').toLowerCase().includes(q) ||
            (c.marcaVehiculo || '').toLowerCase().includes(q)
        ), [conductores, q]);

    const doctoresFiltrados = useMemo(() =>
        doctores.filter(d =>
            (d.nombre_completo || '').toLowerCase().includes(q) ||
            (d.dni || '').includes(q) ||
            (d.cmp || '').includes(q) ||
            (d.especialidad_nombre || '').toLowerCase().includes(q)
        ), [doctores, q]);

    const loading = loadingCond || loadingDoc;

    return (
        <div className="p-6 h-full flex flex-col space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Gestión de Recursos</h1>
                    <p className="text-muted-foreground text-sm">
                        Vista centralizada. Doble clic en cualquier fila para ver el detalle.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    <Link2 className="h-3.5 w-3.5 text-blue-500" />
                    Edición completa en módulos <strong>Conductores</strong> y <strong>Doctores</strong>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSearchQuery(''); }} className="flex-1 flex flex-col">
                <TabsList className="w-full justify-start border-b rounded-none mb-0 bg-transparent p-0">
                    <TabsTrigger value="drivers" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none bg-transparent flex items-center gap-1.5 pb-2">
                        <User className="h-4 w-4" />
                        Conductores
                        {!loadingCond && <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">{totalCond}</span>}
                    </TabsTrigger>
                    <TabsTrigger value="vehicles" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none bg-transparent flex items-center gap-1.5 pb-2">
                        <Car className="h-4 w-4" />
                        Vehículos
                        {!loadingCond && <span className="ml-1 text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full font-medium">{conductores.filter(c => c.placa).length}</span>}
                    </TabsTrigger>
                    <TabsTrigger value="staff" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none bg-transparent flex items-center gap-1.5 pb-2">
                        <Stethoscope className="h-4 w-4" />
                        Personal Médico
                        {!loadingDoc && <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium">{totalDoc}</span>}
                    </TabsTrigger>
                </TabsList>

                {/* Search bar */}
                <div className="flex gap-2 items-center my-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar por nombre, DNI, placa…" className="pl-8"
                            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                    <button onClick={() => { cargarConductores(); cargarDoctores(); }}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-gray-500" title="Recargar">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* ── CONDUCTORES ── */}
                <TabsContent value="drivers" className="flex-1 bg-white rounded-xl border shadow-sm overflow-hidden m-0">
                    <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
                        <h2 className="font-semibold flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-500" /> Directorio de Conductores
                        </h2>
                        <span className="text-sm text-gray-500">{conductoresFiltrados.length} de {totalCond}</span>
                    </div>
                    {loadingCond ? (
                        <div className="flex items-center justify-center h-40 text-gray-400">
                            <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Cargando…
                        </div>
                    ) : (
                        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Nombre Completo</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">DNI</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Teléfono</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Placa</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Vehículo</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {conductoresFiltrados.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-10 text-gray-400">Sin resultados</td></tr>
                                    ) : conductoresFiltrados.map((c, idx) => (
                                        <tr key={c.id}
                                            className="hover:bg-sky-50 transition-colors cursor-pointer select-none"
                                            onDoubleClick={() => setConductorSeleccionado(c)}
                                            title="Doble clic para ver detalle">
                                            <td className="px-3 py-2.5 text-gray-400 font-mono text-xs">{idx + 1}</td>
                                            <td className="px-3 py-2.5 font-medium text-gray-900">{c.nombreCompleto || '—'}</td>
                                            <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{c.dni || '—'}</td>
                                            <td className="px-3 py-2.5 text-xs text-gray-600">{c.celular1 || c.celular2 || '—'}</td>
                                            <td className="px-3 py-2.5">
                                                {c.placa ? (
                                                    <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded border border-gray-300">{c.placa}</span>
                                                ) : <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-gray-600">{c.tipoVehiculo || '—'}</td>
                                            <td className="px-3 py-2.5">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${estadoBadge(c.estado)}`}>
                                                    {c.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </TabsContent>

                {/* ── VEHÍCULOS ── */}
                <TabsContent value="vehicles" className="flex-1 bg-white rounded-xl border shadow-sm overflow-hidden m-0">
                    <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Car className="h-4 w-4 text-teal-500" /> Vehículos con Placa Registrada
                        </h2>
                        <span className="text-sm text-gray-500">{vehiculosFiltrados.length} vehículos</span>
                    </div>
                    {loadingCond ? (
                        <div className="flex items-center justify-center h-40 text-gray-400">
                            <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Cargando…
                        </div>
                    ) : (
                        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Placa</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Marca / Modelo</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Color</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Conductor</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {vehiculosFiltrados.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-10 text-gray-400">Sin vehículos con placa registrada</td></tr>
                                    ) : vehiculosFiltrados.map((c, idx) => (
                                        <tr key={c.id}
                                            className="hover:bg-sky-50 transition-colors cursor-pointer select-none"
                                            onDoubleClick={() => setConductorSeleccionado(c)}
                                            title="Doble clic para ver detalle">
                                            <td className="px-3 py-2.5 text-gray-400 font-mono text-xs">{idx + 1}</td>
                                            <td className="px-3 py-2.5">
                                                <span className="font-mono font-bold text-sm bg-gray-100 px-2 py-0.5 rounded border border-gray-300">{c.placa}</span>
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-gray-700">{c.tipoVehiculo || '—'}</td>
                                            <td className="px-3 py-2.5 text-xs text-gray-700">
                                                {[c.marcaVehiculo, c.modeloVehiculo].filter(Boolean).join(' ') || '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-xs text-gray-700">{c.colorVehiculo || '—'}</td>
                                            <td className="px-3 py-2.5 font-medium text-gray-900 text-xs">{c.nombreCompleto}</td>
                                            <td className="px-3 py-2.5">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${estadoBadge(c.estado)}`}>
                                                    {c.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </TabsContent>

                {/* ── PERSONAL MÉDICO ── */}
                <TabsContent value="staff" className="flex-1 bg-white rounded-xl border shadow-sm overflow-hidden m-0">
                    <div className="px-4 py-3 border-b flex justify-between items-center bg-gray-50">
                        <h2 className="font-semibold flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-purple-500" /> Directorio de Personal Médico
                        </h2>
                        <span className="text-sm text-gray-500">{doctoresFiltrados.length} de {totalDoc}</span>
                    </div>
                    {loadingDoc ? (
                        <div className="flex items-center justify-center h-40 text-gray-400">
                            <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Cargando…
                        </div>
                    ) : (
                        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Nombre Completo</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">DNI</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">CMP</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Especialidad</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Teléfono</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {doctoresFiltrados.length === 0 ? (
                                        <tr><td colSpan={7} className="text-center py-10 text-gray-400">Sin resultados</td></tr>
                                    ) : doctoresFiltrados.map((d, idx) => (
                                        <tr key={d.id}
                                            className="hover:bg-sky-50 transition-colors cursor-pointer select-none"
                                            onDoubleClick={() => setDoctorSeleccionado(d)}
                                            title="Doble clic para ver detalle">
                                            <td className="px-3 py-2.5 text-gray-400 font-mono text-xs">{idx + 1}</td>
                                            <td className="px-3 py-2.5 font-medium text-gray-900">{d.nombre_completo || '—'}</td>
                                            <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{(d.dni || '').replace(/^DNI/i, '') || '—'}</td>
                                            <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{d.cmp || '—'}</td>
                                            <td className="px-3 py-2.5 text-xs text-gray-700">{d.especialidad_nombre || '—'}</td>
                                            <td className="px-3 py-2.5 text-xs text-gray-600">{d.celular || '—'}</td>
                                            <td className="px-3 py-2.5">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${estadoBadge(d.estado)}`}>
                                                    {d.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            {conductorSeleccionado && (
                <ConductorDialog conductor={conductorSeleccionado} onClose={() => setConductorSeleccionado(null)} />
            )}
            {doctorSeleccionado && (
                <DoctorDialog doctor={doctorSeleccionado} onClose={() => setDoctorSeleccionado(null)} />
            )}
        </div>
    );
}
