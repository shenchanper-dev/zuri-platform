import React from 'react';

interface ConsultaTabProps {
    formData: any;
    onChange: (field: string, value: any) => void;
}

const InputField = ({ label, value, onChange, type = 'text', ...props }: any) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            {...props}
        />
    </div>
);

const CheckboxField = ({ label, checked, onChange }: any) => (
    <label className="flex items-center gap-2 cursor-pointer">
        <input
            type="checkbox"
            checked={checked || false}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
);

const SelectField = ({ label, value, onChange, options }: any) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
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

export const ConsultaTab: React.FC<ConsultaTabProps> = ({ formData, onChange }) => {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Configuración de Consulta</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Teleconsulta */}
                    <div className="md:col-span-2">
                        <CheckboxField
                            label="Acepta Teleconsulta"
                            checked={formData.acepta_teleconsulta}
                            onChange={(v: any) => onChange('acepta_teleconsulta', v)}
                        />
                        <p className="text-xs text-gray-500 ml-6 mt-1">
                            El doctor puede atender consultas virtuales
                        </p>
                    </div>

                    {/* Duración */}
                    <InputField
                        label="Duración de Consulta (minutos)"
                        type="number"
                        value={formData.duracion_consulta_min}
                        onChange={(v: any) => onChange('duracion_consulta_min', v)}
                        min="15"
                        step="15"
                        placeholder="30"
                    />
                </div>

                <hr className="my-8" />

                {/* TARIFAS */}
                <h3 className="text-lg font-bold text-gray-900 mb-6">💰 Tarifas</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SelectField
                        label="Moneda"
                        value={formData.moneda}
                        onChange={(v: any) => onChange('moneda', v)}
                        options={[
                            { value: 'PEN', label: 'PEN - Soles' },
                            { value: 'USD', label: 'USD - Dólares' }
                        ]}
                    />

                    <div></div>

                    <InputField
                        label="Tarifa por Consulta"
                        type="number"
                        value={formData.tarifa_consulta}
                        onChange={(v: any) => onChange('tarifa_consulta', v)}
                        min="0"
                        step="0.01"
                        placeholder="150.00"
                    />

                    <InputField
                        label="Tarifa por Hora"
                        type="number"
                        value={formData.tarifa_hora}
                        onChange={(v: any) => onChange('tarifa_hora', v)}
                        min="0"
                        step="0.01"
                        placeholder="200.00"
                    />

                    <InputField
                        label="Tarifa por Turno"
                        type="number"
                        value={formData.tarifa_turno}
                        onChange={(v: any) => onChange('tarifa_turno', v)}
                        min="0"
                        step="0.01"
                        placeholder="800.00"
                    />

                    <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-900">
                            <strong>Nota:</strong> Las tarifas son referenciales. Puedes especificar:
                        </p>
                        <ul className="text-xs text-blue-800 mt-2 ml-4 list-disc">
                            <li><strong>Consulta:</strong> Precio por consulta individual</li>
                            <li><strong>Hora:</strong> Precio si cobras por hora de servicio</li>
                            <li><strong>Turno:</strong> Precio por turno completo (mañana/tarde/noche de 4-6 horas)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
