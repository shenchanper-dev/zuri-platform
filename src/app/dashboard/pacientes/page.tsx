'use client';

import { useState, useEffect } from 'react';
import { PersonalTab } from '@/components/pacientes/tabs/PersonalTab';
import { MovilidadTab } from '@/components/pacientes/tabs/MovilidadTab';

export default function PacientesPage() {
    const [activeTab, setActiveTab] = useState('lista');
    const [pacientes, setPacientes] = useState([]);
    const [distritos, setDistritos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState<any>({
        tipo_documento: 'DNI',
        estado: 'ACTIVO',
        movilidad_tipo: 'AMBULATORIO',
        requiere_oxigeno: false,
        requiere_acompanante: false
    });
    const [errors, setErrors] = useState<any>({});
    const [editingId, setEditingId] = useState<number | null>(null);

    useEffect(() => {
        fetchDistritos();
    }, []);

    useEffect(() => {
        if (activeTab === 'lista') {
            fetchPacientes();
        }
    }, [activeTab, search]);

    const fetchDistritos = async () => {
        try {
            const res = await fetch('/api/distritos');
            const data = await res.json();
            setDistritos(data.distritos || []);
        } catch (error) {
            console.error('Error cargando distritos:', error);
        }
    };

    const fetchPacientes = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);

            const res = await fetch(`/api/pacientes?${params}`);
            const data = await res.json();
            setPacientes(data.pacientes || []);
        } catch (error) {
            console.error('Error cargando pacientes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev: any) => ({ ...prev, [field]: null }));
        }
    };

    const validateForm = () => {
        const newErrors: any = {};

        if (!formData.dni) newErrors.dni = 'Requerido';
        if (!formData.nombres) newErrors.nombres = 'Requerido';
        if (!formData.apellido_paterno) newErrors.apellido_paterno = 'Requerido';
        if (!formData.fecha_nacimiento) newErrors.fecha_nacimiento = 'Requerido';
        if (!formData.direccion) newErrors.direccion = 'Requerido';
        if (!formData.emergencia_nombre) newErrors.emergencia_nombre = 'Requerido';
        if (!formData.emergencia_telefono) newErrors.emergencia_telefono = 'Requerido';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            alert('Por favor completa los campos requeridos');
            return;
        }

        setLoading(true);
        try {
            const url = editingId ? `/api/pacientes/${editingId}` : '/api/pacientes';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al guardar');
            }

            alert(editingId ? 'Paciente actualizado' : 'Paciente creado exitosamente');
            setActiveTab('lista');
            setFormData({ tipo_documento: 'DNI', estado: 'ACTIVO', movilidad_tipo: 'AMBULATORIO' });
            setEditingId(null);
            fetchPacientes();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (id: number) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/pacientes/${id}`);
            const data = await res.json();
            setFormData(data.paciente);
            setEditingId(id);
            setActiveTab('personal');
        } catch (error) {
            alert('Error al cargar paciente');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Desactivar este paciente?')) return;

        try {
            const res = await fetch(`/api/pacientes/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Error al eliminar');

            alert('Paciente desactivado');
            fetchPacientes();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleNewPaciente = () => {
        setFormData({ tipo_documento: 'DNI', estado: 'ACTIVO', movilidad_tipo: 'AMBULATORIO', requiere_oxigeno: false, requiere_acompanante: false });
        setEditingId(null);
        setErrors({});
        setActiveTab('personal');
    };

    // Helper para icono de movilidad
    const getMovilidadIcon = (tipo: string) => {
        const icons: any = {
            'AMBULATORIO': '🚶',
            'ASISTENCIA_LEVE': '🦯',
            'SILLA_RUEDAS': '♿',
            'SILLA_RUEDAS_ELECTRICA': '♿⚡',
            'CAMILLA': '🛏️',
            'BARIATRICO': '⚖️'
        };
        return icons[tipo] || '❓';
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Pacientes</h1>
                <p className="text-gray-600 mt-1">Administra la información de pacientes con estándares NEMT</p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-t-lg border-b border-gray-200">
                <div className="flex gap-6 px-6">
                    <button
                        onClick={() => setActiveTab('lista')}
                        className={`py-4 px-2 border-b-2 font-medium transition-colors ${activeTab === 'lista'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        📋 Lista de Pacientes
                    </button>
                    {(activeTab !== 'lista') && (
                        <>
                            <button
                                onClick={() => setActiveTab('personal')}
                                className={`py-4 px-2 border-b-2 font-medium transition-colors ${activeTab === 'personal'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                👤 Personal
                            </button>
                            <button
                                onClick={() => setActiveTab('movilidad')}
                                className={`py-4 px-2 border-b-2 font-medium transition-colors ${activeTab === 'movilidad'
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                ♿ Movilidad NEMT
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-b-lg shadow-sm p-6">
                {activeTab === 'lista' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <input
                                type="text"
                                placeholder="Buscar por nombre, DNI o celular..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                onClick={handleNewPaciente}
                                className="ml-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                            >
                                + Nuevo Paciente
                            </button>
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">DNI</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre Completo</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Movilidad</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {pacientes.map((paciente: any) => (
                                            <tr key={paciente.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{paciente.dni}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{paciente.nombre_completo}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className="flex items-center gap-2">
                                                        <span className="text-lg">{getMovilidadIcon(paciente.movilidad_tipo)}</span>
                                                        <span className="text-xs">{paciente.movilidad_tipo?.replace('_', ' ')}</span>
                                                    </span>
                                                    {paciente.requiere_oxigeno && <span className="text-xs text-red-600">💨 Oxígeno</span>}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {paciente.celular && <div>{paciente.celular}</div>}
                                                    {paciente.email && <div className="text-xs">{paciente.email}</div>}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${paciente.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {paciente.estado}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <button
                                                        onClick={() => handleEdit(paciente.id)}
                                                        className="text-blue-600 hover:text-blue-800 mr-3"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(paciente.id)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {pacientes.length === 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        No hay pacientes registrados
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'personal' && (
                    <PersonalTab
                        formData={formData}
                        onChange={handleChange}
                        errors={errors}
                        distritos={distritos}
                    />
                )}

                {activeTab === 'movilidad' && (
                    <MovilidadTab
                        formData={formData}
                        onChange={handleChange}
                    />
                )}

                {/* Action Buttons */}
                {activeTab !== 'lista' && (
                    <div className="mt-8 flex gap-3">
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                        >
                            {loading ? 'Guardando...' : (editingId ? 'Actualizar Paciente' : 'Crear Paciente')}
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('lista');
                                setFormData({ tipo_documento: 'DNI', estado: 'ACTIVO', movilidad_tipo: 'AMBULATORIO' });
                                setEditingId(null);
                            }}
                            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
