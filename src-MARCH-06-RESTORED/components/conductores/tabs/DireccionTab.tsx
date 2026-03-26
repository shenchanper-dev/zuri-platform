import React from 'react';
import { InputField, SelectField } from '@/components/conductores/shared/FormComponents';
import dynamic from 'next/dynamic';
import { Activity, Locate, Map } from 'lucide-react';

// Dynamic import for OpenStreetMap to avoid SSR issues
const OpenStreetMap = dynamic(() => import('@/components/shared/OpenStreetMap'), { ssr: false });

interface DireccionTabProps {
    formData: any;
    onChange: (field: string, value: any) => void;
    errors: any;
    distritos: any[];
    detectLocation: () => void;
    gpsLoading: boolean;
}

export const DireccionTab: React.FC<DireccionTabProps> = ({
    formData,
    onChange,
    errors,
    distritos,
    detectLocation,
    gpsLoading
}) => {
    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                    <InputField
                        label="Dirección Exacta *"
                        value={formData.domicilioCompleto}
                        onChange={(v: any) => onChange('domicilioCompleto', v)}
                        placeholder="Av., Calle, Jr., Número, Referencia"
                        error={errors.domicilioCompleto}
                    />
                </div>

                <div className="flex flex-col gap-1 w-full">
                    <SelectField
                        label="Distrito *"
                        value={formData.distritoId}
                        onChange={(v: any) => onChange('distritoId', v)}
                        options={distritos || []}
                        placeholder={distritos?.length > 0 ? "Seleccione Distrito..." : "Cargando distritos..."}
                        disabled={!distritos || distritos.length === 0}
                    />
                    {errors.distritoId && <span className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.distritoId}</span>}
                </div>

                <div className="flex items-end gap-2">
                    <div className="grow">
                        <p className="text-[10px] font-bold text-slate-500 uppercase ml-1 mb-1">Coordenadas GPS</p>
                        <div className="flex gap-2">
                            <input
                                disabled
                                value={formData.domicilioLatitud || ''}
                                placeholder="Lat"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono shadow-inner"
                            />
                            <input
                                disabled
                                value={formData.domicilioLongitud || ''}
                                placeholder="Lon"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono shadow-inner"
                            />
                        </div>
                    </div>
                    <button
                        onClick={detectLocation}
                        disabled={gpsLoading}
                        type="button"
                        className="h-[46px] px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg shadow-lg shadow-emerald-200 flex items-center gap-2 transition-all duration-300 active:scale-95 text-xs font-black uppercase tracking-widest"
                    >
                        {gpsLoading ? <Activity className="animate-spin" size={16} /> : <Locate size={16} />}
                        <span>GPS</span>
                    </button>
                </div>
            </div>

            {/* OpenStreetMap Integration */}
            <div className="col-span-2">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Map size={18} className="text-blue-600" />
                    </div>
                    <h4 className="text-xs font-black text-slate-600 uppercase tracking-widest">Ubicación en Mapa</h4>
                </div>
                <div className="relative group">
                    <OpenStreetMap
                        latitude={formData.domicilioLatitud}
                        longitude={formData.domicilioLongitud}
                        address={formData.domicilioCompleto}
                        nombre={`${formData.nombres} ${formData.apellidos}`}
                        className="w-full h-80 rounded-2xl border-2 border-slate-100 shadow-xl overflow-hidden grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                    />
                    {!formData.domicilioLatitud && (
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                            <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 animate-bounce">
                                <Locate className="text-blue-600" size={32} />
                                <p className="text-xs font-black uppercase text-slate-400">Presiona GPS para ubicar</p>
                            </div>
                        </div>
                    )}
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">
                    {formData.domicilioLatitud && formData.domicilioLongitud
                        ? '📍 Ubicación detectada - El marcador muestra la posición del conductor'
                        : '⚠️ Presiona el botón GPS para detectar la ubicación automáticamente'}
                </p>
            </div>
        </div>
    );
};
