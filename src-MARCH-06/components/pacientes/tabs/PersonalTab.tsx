import React from 'react';
import { FotoUpload } from '@/components/FotoUpload';

interface PersonalTabProps {
    formData: any;
    onChange: (field: string, value: any) => void;
    errors: any;
    distritos: any[];
}

const InputField = ({ label, value, onChange, error, type = 'text', ...props }: any) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            {...props}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
);

const SelectField = ({ label, value, onChange, options, error }: any) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full px-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
        >
            <option value="">Seleccionar...</option>
            {options.map((opt: any) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
);

export const PersonalTab: React.FC<PersonalTabProps> = ({ formData, onChange, errors, distritos }) => {
    return (
        <div className="flex flex-col md:flex-row gap-10 animate-in fade-in slide-in-from-bottom-2 items-start">

            {/* FOTO */}
            <div className="w-full md:w-[200px] flex-shrink-0 flex flex-col items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <FotoUpload
                    currentFoto={formData.dni_foto_url}
                    onChange={(file) => onChange('dni_foto_url', file)}
                    nombre={formData.nombres}
                    apellidos={formData.apellido_paterno}
                />
                <p className="text-[10px] uppercase font-black text-slate-400 mt-4 tracking-tighter">
                    Foto DNI
                </p>
            </div>

            {/* CAMPOS */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 w-full">
                <div className="sm:col-span-2 md:col-span-1">
                    <SelectField
                        label="Tipo Documento"
                        value={formData.tipo_documento}
                        onChange={(v: any) => onChange('tipo_documento', v)}
                        options={[
                            { value: 'DNI', label: 'DNI' },
                            { value: 'CE', label: 'Carnet de Extranjería' },
                            { value: 'PASAPORTE', label: 'Pasaporte' }
                        ]}
                    />
                </div>

                <InputField
                    label="DNI *"
                    value={formData.dni}
                    onChange={(v: any) => onChange('dni', v)}
                    error={errors.dni}
                    maxLength={20}
                />

                <InputField
                    label="Nombres *"
                    value={formData.nombres}
                    onChange={(v: any) => onChange('nombres', v)}
                    error={errors.nombres}
                />

                <InputField
                    label="Apellido Paterno *"
                    value={formData.apellido_paterno}
                    onChange={(v: any) => onChange('apellido_paterno', v)}
                    error={errors.apellido_paterno}
                />

                <InputField
                    label="Apellido Materno"
                    value={formData.apellido_materno}
                    onChange={(v: any) => onChange('apellido_materno', v)}
                />

                <InputField
                    label="Fecha Nacimiento *"
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={(v: any) => onChange('fecha_nacimiento', v)}
                    error={errors.fecha_nacimiento}
                />

                <SelectField
                    label="Género"
                    value={formData.genero}
                    onChange={(v: any) => onChange('genero', v)}
                    options={[
                        { value: 'M', label: 'Masculino' },
                        { value: 'F', label: 'Femenino' },
                        { value: 'OTRO', label: 'Otro' }
                    ]}
                />

                <InputField
                    label="Celular"
                    type="tel"
                    value={formData.celular}
                    onChange={(v: any) => onChange('celular', v)}
                />

                <InputField
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(v: any) => onChange('email', v)}
                />

                <div className="sm:col-span-2">
                    <InputField
                        label="Dirección *"
                        value={formData.direccion}
                        onChange={(v: any) => onChange('direccion', v)}
                        error={errors.direccion}
                    />
                </div>

                <SelectField
                    label="Distrito"
                    value={formData.distrito_id}
                    onChange={(v: any) => onChange('distrito_id', v)}
                    options={distritos.map(d => ({ value: d.id, label: d.nombre }))}
                />

                <InputField
                    label="Referencia"
                    value={formData.referencia}
                    onChange={(v: any) => onChange('referencia', v)}
                    placeholder="Cerca a..., entre las calles..."
                />

                {/* Contacto de Emergencia */}
                <div className="sm:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-4">🚨 Contacto de Emergencia</h3>
                </div>

                <InputField
                    label="Nombre *"
                    value={formData.emergencia_nombre}
                    onChange={(v: any) => onChange('emergencia_nombre', v)}
                    error={errors.emergencia_nombre}
                />

                <InputField
                    label="Parentesco"
                    value={formData.emergencia_parentesco}
                    onChange={(v: any) => onChange('emergencia_parentesco', v)}
                    placeholder="Hijo, Esposa, etc."
                />

                <InputField
                    label="Teléfono 1 *"
                    type="tel"
                    value={formData.emergencia_telefono}
                    onChange={(v: any) => onChange('emergencia_telefono', v)}
                    error={errors.emergencia_telefono}
                />

                <InputField
                    label="Teléfono 2"
                    type="tel"
                    value={formData.emergencia_telefono_2}
                    onChange={(v: any) => onChange('emergencia_telefono_2', v)}
                />

                <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                    <textarea
                        value={formData.observaciones_pacientes || ''}
                        onChange={(e) => onChange('observaciones_pacientes', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Notas adicionales..."
                    />
                </div>
            </div>
        </div>
    );
};
