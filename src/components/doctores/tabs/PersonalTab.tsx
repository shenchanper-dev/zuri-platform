import React from 'react';
import { FotoUpload } from '@/components/FotoUpload';

interface PersonalTabProps {
    formData: any;
    onChange: (field: string, value: any) => void;
    errors: any;
    especialidades: any[];
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

export const PersonalTab: React.FC<PersonalTabProps> = ({ formData, onChange, errors, especialidades }) => {
    return (
        <div className="flex flex-col md:flex-row gap-10 animate-in fade-in slide-in-from-bottom-2 items-start">

            {/* FOTO SECCIÓN */}
            <div className="w-full md:w-[200px] flex-shrink-0 flex flex-col items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <FotoUpload
                    currentFoto={formData.foto_url}
                    onChange={(file) => onChange('foto_url', file)}
                    nombre={formData.nombres}
                    apellidos={formData.apellido_paterno}
                />
                <p className="text-[10px] uppercase font-black text-slate-400 mt-4 tracking-tighter">
                    Foto de Perfil
                </p>
            </div>

            {/* CAMPOS */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 w-full">
                <div className="sm:col-span-2 md:col-span-1">
                    <InputField
                        label="DNI *"
                        value={formData.dni}
                        onChange={(v: any) => onChange('dni', v)}
                        error={errors.dni}
                        maxLength={8}
                    />
                </div>

                <InputField
                    label="CMP *"
                    value={formData.cmp}
                    onChange={(v: any) => onChange('cmp', v)}
                    error={errors.cmp}
                    placeholder="Colegio Médico del Perú"
                />

                <InputField
                    label="RNE"
                    value={formData.rne}
                    onChange={(v: any) => onChange('rne', v)}
                    placeholder="Registro Nacional de Especialistas"
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
                    label="Fecha Nacimiento"
                    type="date"
                    value={formData.fecha_nacimiento}
                    onChange={(v: any) => onChange('fecha_nacimiento', v)}
                />

                <SelectField
                    label="Género"
                    value={formData.genero}
                    onChange={(v: any) => onChange('genero', v)}
                    options={[
                        { value: 'M', label: 'Masculino' },
                        { value: 'F', label: 'Femenino' }
                    ]}
                />

                <InputField
                    label="Celular"
                    value={formData.celular}
                    onChange={(v: any) => onChange('celular', v)}
                    type="tel"
                />

                <InputField
                    label="Email Profesional"
                    type="email"
                    value={formData.email_profesional}
                    onChange={(v: any) => onChange('email_profesional', v)}
                />

                <SelectField
                    label="Especialidad Principal *"
                    value={formData.especialidad_principal_id}
                    onChange={(v: any) => onChange('especialidad_principal_id', v)}
                    error={errors.especialidad_principal_id}
                    options={especialidades.map(e => ({ value: e.id, label: e.nombre }))}
                />

                <InputField
                    label="Universidad"
                    value={formData.universidad}
                    onChange={(v: any) => onChange('universidad', v)}
                />

                <InputField
                    label="Años de Experiencia"
                    type="number"
                    value={formData.anos_experiencia}
                    onChange={(v: any) => onChange('anos_experiencia', v)}
                    min="0"
                />

                <SelectField
                    label="Estado"
                    value={formData.estado}
                    onChange={(v: any) => onChange('estado', v)}
                    options={[
                        { value: 'ACTIVO', label: 'Activo' },
                        { value: 'INACTIVO', label: 'Inactivo' },
                        { value: 'VACACIONES', label: 'Vacaciones' },
                        { value: 'LICENCIA', label: 'Licencia' }
                    ]}
                />

                <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                    <textarea
                        value={formData.observaciones_doctores || ''}
                        onChange={(e) => onChange('observaciones_doctores', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Notas adicionales sobre el doctor..."
                    />
                </div>
            </div>
        </div>
    );
};
