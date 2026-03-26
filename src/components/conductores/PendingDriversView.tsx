'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Conductor {
    id: number;
    dni: string;
    nombres: string;
    apellidos: string;
    email: string;
    celular1: string;
    estado_registro: 'EN_PROCESO' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
    fecha_registro: string;
    fecha_aprobacion?: string;
    fecha_rechazo?: string;
    razon_rechazo?: string;
    tienePin?: boolean;
}

export default function PendingDriversView() {
    const [conductores, setConductores] = useState<Conductor[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('PENDIENTE');

    const [selectedConductor, setSelectedConductor] = useState<Conductor | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [razonRechazo, setRazonRechazo] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadConductores();
    }, [filter]);

    const loadConductores = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/conductores?estadoRegistro=${filter}`);
            const data = await response.json();
            setConductores(data.conductores || []);
        } catch (error) {
            console.error('Error loading conductores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAprobar = async (conductorId: number) => {
        if (!confirm('¿Estás seguro de aprobar este conductor?')) return;

        setActionLoading(true);
        try {
            const response = await fetch(`/api/conductores/${conductorId}/aprobar`, {
                method: 'PUT',
            });

            const data = await response.json();

            if (data.success) {
                alert('✅ Conductor aprobado exitosamente');
                loadConductores();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error al aprobar conductor');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRechazar = async () => {
        if (!selectedConductor) return;
        if (!razonRechazo.trim()) {
            alert('Debes especificar una razón');
            return;
        }

        setActionLoading(true);
        try {
            const response = await fetch(`/api/conductores/${selectedConductor.id}/rechazar`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ razon: razonRechazo }),
            });

            const data = await response.json();

            if (data.success) {
                alert('❌ Conductor rechazado');
                setShowRejectModal(false);
                setSelectedConductor(null);
                setRazonRechazo('');
                loadConductores();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            alert('Error al rechazar conductor');
        } finally {
            setActionLoading(false);
        }
    };

    const getDaysAgo = (fecha: string) => {
        const diff = Date.now() - new Date(fecha).getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    };

    const getEstadoBadge = (estado: string) => {
        const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
            EN_PROCESO: { label: 'En Proceso', variant: 'secondary' },
            PENDIENTE: { label: 'Pendiente', variant: 'default' },
            APROBADO: { label: 'Aprobado', variant: 'outline' },
            RECHAZADO: { label: 'Rechazado', variant: 'destructive' },
        };

        const { label, variant } = config[estado] || { label: estado, variant: 'outline' };
        return <Badge variant={variant}>{label}</Badge>;
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">Gestión de Conductores</h1>
                <p className="text-gray-600">Aprobar/rechazar solicitudes de registro</p>
            </div>

            {/* Banner Alerta Conductores sin PIN */}
            {conductores.filter(c => !c.tienePin && c.estado_registro === 'APROBADO').length > 0 && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-lg shadow-sm flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-amber-100 p-2 rounded-full">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-amber-900">Conductores sin PIN detectados</h4>
                        <p className="text-amber-800 text-sm">
                            Hay <strong>{conductores.filter(c => !c.tienePin && c.estado_registro === 'APROBADO').length}</strong> conductores aprobados que aún no tienen credenciales de acceso.
                            Asígnalas desde el módulo <a href="/dashboard/conductores" className="underline font-semibold">Gestión de Conductores</a>.
                        </p>
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div className="flex gap-2 mb-6">
                {['PENDIENTE', 'EN_PROCESO', 'APROBADO', 'RECHAZADO'].map((estado) => (
                    <Button
                        key={estado}
                        variant={filter === estado ? 'default' : 'outline'}
                        onClick={() => setFilter(estado)}
                    >
                        {estado.replace('_', ' ')}
                    </Button>
                ))}
            </div>

            {/* Lista de Conductores */}
            {loading ? (
                <div className="text-center py-12">Cargando...</div>
            ) : conductores.length === 0 ? (
                <Card className="p-12 text-center">
                    <p className="text-gray-500">No hay conductores en estado: {filter}</p>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {conductores.map((conductor) => (
                        <Card key={conductor.id} className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-semibold">
                                            {conductor.nombres} {conductor.apellidos}
                                        </h3>
                                        {getEstadoBadge(conductor.estado_registro)}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                                        <div>
                                            <p><strong>DNI:</strong> {conductor.dni}</p>
                                            <p><strong>Email:</strong> {conductor.email}</p>
                                            <p><strong>Celular:</strong> {conductor.celular1}</p>
                                        </div>
                                        <div>
                                            <p><strong>Registro:</strong> hace {getDaysAgo(conductor.fecha_registro)} días</p>
                                            {conductor.fecha_aprobacion && (
                                                <p><strong>Aprobado:</strong> {new Date(conductor.fecha_aprobacion).toLocaleDateString()}</p>
                                            )}
                                            {conductor.fecha_rechazo && (
                                                <p><strong>Rechazado:</strong> {new Date(conductor.fecha_rechazo).toLocaleDateString()}</p>
                                            )}
                                        </div>
                                    </div>

                                    {conductor.razon_rechazo && (
                                        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                                            <p className="text-sm"><strong>Razón de rechazo:</strong></p>
                                            <p className="text-sm text-red-800">{conductor.razon_rechazo}</p>
                                        </div>
                                    )}
                                </div>

                                {conductor.estado_registro === 'PENDIENTE' && (
                                    <div className="flex gap-2 ml-4">
                                        <Button
                                            onClick={() => handleAprobar(conductor.id)}
                                            disabled={actionLoading}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            ✅ Aprobar
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setSelectedConductor(conductor);
                                                setShowRejectModal(true);
                                            }}
                                            disabled={actionLoading}
                                            variant="destructive"
                                        >
                                            ❌ Rechazar
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal de Rechazo */}
            <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rechazar Conductor</DialogTitle>
                        <DialogDescription>
                            {selectedConductor && `${selectedConductor.nombres} ${selectedConductor.apellidos}`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="razon">Razón del Rechazo *</Label>
                            <Textarea
                                id="razon"
                                placeholder="Ej: Licencia vencida, documentación incompleta..."
                                value={razonRechazo}
                                onChange={(e) => setRazonRechazo(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowRejectModal(false);
                                setRazonRechazo('');
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRechazar}
                            disabled={actionLoading || !razonRechazo.trim()}
                        >
                            {actionLoading ? 'Procesando...' : 'Rechazar Conductor'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
