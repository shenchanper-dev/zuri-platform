import React from 'react';
import { SERVICIOS_DISPONIBLES } from '@/domain/entities/Conductor.entity';
import { SelectField } from '@/components/conductores/shared/FormComponents';

interface ControlTabProps {
    formData: any;
    onChange: (field: string, value: any) => void;
}

export const ControlTab: React.FC<ControlTabProps> = ({ formData, onChange }) => {
    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2">
            <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Estado del Conductor</h4>
                <div className="max-w-xs">
                    <SelectField
                        label="Estado Actual"
                        value={formData.estado || 'ACTIVO'}
                        onChange={(v: any) => onChange('estado', v)}
                        options={[
                            { value: 'ACTIVO', label: 'ACTIVO' },
                            { value: 'INACTIVO', label: 'INACTIVO' },
                            { value: 'SUSPENDIDO', label: 'SUSPENDIDO' }
                        ]}
                    />
                </div>
            </div>

            <div className="border-t pt-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Equipamiento NEMT</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['OXIGENO', 'SILLA_RUEDAS', 'RAMPA', 'CAMILLA', 'BOTIQUIN', 'EXTINTOR'].map(item => (
                        <label key={item} className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${formData.equipamiento?.includes(item) ? 'bg-blue-50 border-blue-200' : 'border-slate-100 hover:bg-slate-50'}`}>
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-slate-300 text-blue-600"
                                checked={formData.equipamiento?.includes(item)}
                                onChange={(e) => {
                                    const list = formData.equipamiento || [];
                                    onChange('equipamiento', e.target.checked ? [...list, item] : list.filter((i: any) => i !== item));
                                }}
                            />
                            <span className={`text-sm font-bold ${formData.equipamiento?.includes(item) ? 'text-blue-700' : 'text-slate-600'}`}>
                                {item.replace('_', ' ')}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Servicios Habilitados</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {SERVICIOS_DISPONIBLES.map(servicio => (
                        <label key={servicio.value} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${formData.servicios?.includes(servicio.value) ? 'bg-emerald-50 border-emerald-200' : 'border-slate-100'}`}>
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-slate-300 text-emerald-600"
                                checked={formData.servicios?.includes(servicio.value)}
                                onChange={(e) => {
                                    const list = formData.servicios || [];
                                    onChange('servicios', e.target.checked ? [...list, servicio.value] : list.filter((i: any) => i !== servicio.value));
                                }}
                            />
                            <span className="text-xs font-bold text-slate-700">{servicio.label}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};
