import React from 'react';

interface MovilidadTabProps {
    formData: any;
    onChange: (field: string, value: any) => void;
}

const SelectField = ({ label, value, onChange, options, icon }: any) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {icon && <span className="mr-2">{icon}</span>}
            {label}
        </label>
        <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
            <option value="">Seleccionar...</option>
            {options.map((opt: any) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

const InputField = ({ label, value, onChange, type = 'text', icon, ...props }: any) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {icon && <span className="mr-2">{icon}</span>}
            {label}
        </label>
        <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            {...props}
        />
    </div>
);

const CheckboxField = ({ label, checked, onChange, icon }: any) => (
    <label className="flex items-center gap-2 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
        <input
            type="checkbox"
            checked={checked || false}
            onChange={(e) => onChange(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm font-medium text-gray-700">
            {icon && <span className="mr-2">{icon}</span>}
            {label}
        </span>
    </label>
);

export const MovilidadTab: React.FC<MovilidadTabProps> = ({ formData, onChange }) => {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-6">🚑 Movilidad y Necesidades NEMT</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tipo de Movilidad */}
                    <div className="md:col-span-2">
                        <SelectField
                            label="Tipo de Movilidad"
                            icon="♿"
                            value={formData.movilidad_tipo}
                            onChange={(v: any) => onChange('movilidad_tipo', v)}
                            options={[
                                { value: 'AMBULATORIO', label: 'Ambulatorio (camina sin ayuda)' },
                                { value: 'ASISTENCIA_LEVE', label: 'Asistencia Leve (bastón, andador)' },
                                { value: 'SILLA_RUEDAS', label: 'Silla de Ruedas Manual' },
                                { value: 'SILLA_RUEDAS_ELECTRICA', label: 'Silla de Ruedas Eléctrica' },
                                { value: 'CAMILLA', label: 'Camilla (no puede sentarse)' },
                                { value: 'BARIATRICO', label: 'Bariátrico (equipo especial)' }
                            ]}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Selecciona el nivel de movilidad del paciente para asignar el vehículo y conductor adecuado
                        </p>
                    </div>

                    {/* Tipo Silla de Ruedas (condicional) */}
                    {(formData.movilidad_tipo === 'SILLA_RUEDAS' || formData.movilidad_tipo === 'SILLA_RUEDAS_ELECTRICA') && (
                        <div className="md:col-span-2">
                            <SelectField
                                label="Tipo de Silla de Ruedas"
                                value={formData.tipo_silla_ruedas}
                                onChange={(v: any) => onChange('tipo_silla_ruedas', v)}
                                options={[
                                    { value: 'MANUAL_ESTANDAR', label: 'Manual Estándar' },
                                    { value: 'MANUAL_PLEGABLE', label: 'Manual Plegable' },
                                    { value: 'ELECTRICA', label: 'Eléctrica' },
                                    { value: 'RECLINABLE', label: 'Reclinable/Geriátrica' }
                                ]}
                            />
                        </div>
                    )}

                    {/* Checkboxes */}
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <CheckboxField
                            label="Requiere Oxígeno"
                            icon="💨"
                            checked={formData.requiere_oxigeno}
                            onChange={(v: any) => onChange('requiere_oxigeno', v)}
                        />

                        <CheckboxField
                            label="Requiere Acompañante"
                            icon="👥"
                            checked={formData.requiere_acompanante}
                            onChange={(v: any) => onChange('requiere_acompanante', v)}
                        />
                    </div>

                    {/* Medidas Físicas */}
                    <InputField
                        label="Peso Aproximado (kg)"
                        icon="⚖️"
                        type="number"
                        value={formData.peso_aproximado_kg}
                        onChange={(v: any) => onChange('peso_aproximado_kg', v)}
                        min="0"
                        step="0.5"
                        placeholder="70.5"
                    />

                    <InputField
                        label="Altura (cm)"
                        icon="📏"
                        type="number"
                        value={formData.altura_cm}
                        onChange={(v: any) => onChange('altura_cm', v)}
                        min="0"
                        placeholder="165"
                    />

                    {/* Info Box */}
                    <div className="md:col-span-2 bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Información NEMT</h4>
                        <p className="text-sm text-blue-800">
                            Esta información es crítica para asignar el <strong>vehículo adecuado</strong> y garantizar
                            la <strong>seguridad del paciente</strong> durante el transporte. Conductores deben ser certificados
                            según el tipo de movilidad.
                        </p>
                        <ul className="text-xs text-blue-700 mt-2 ml-4 list-disc">
                            <li>Ambulatorio: Vehículo estándar</li>
                            <li>Silla de Ruedas: Vehículo con rampa o elevador</li>
                            <li>Camilla: Ambulancia o vehículo adaptado</li>
                            <li>Bariátrico: Equipo especial + 2 conductores</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
