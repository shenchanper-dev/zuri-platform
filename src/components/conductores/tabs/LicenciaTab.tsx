import { InputField, SelectField } from '@/components/conductores/shared/FormComponents';

interface LicenciaTabProps {
    formData: any;
    onChange: (field: string, value: any) => void;
    errors: any;
}

export const LicenciaTab: React.FC<LicenciaTabProps> = ({ formData, onChange, errors }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
            <InputField
                label="Nº Licencia *"
                value={formData.numeroBrevete}
                onChange={(v: any) => onChange('numeroBrevete', v)}
                error={errors.numeroBrevete}
            />
            <SelectField
                label="Categoría"
                value={formData.licencia_categoria}
                onChange={(v: any) => onChange('licencia_categoria', v)}
                options={[
                    { value: 'A-I', label: 'A-I' },
                    { value: 'A-IIa', label: 'A-IIa' },
                    { value: 'A-IIb', label: 'A-IIb' },
                    { value: 'A-IIIa', label: 'A-IIIa' },
                    { value: 'A-IIIb', label: 'A-IIIb' },
                    { value: 'A-IIIc', label: 'A-IIIc' }
                ]}
            />
            <InputField
                label="Vencimiento Licencia"
                type="date"
                value={formData.fechaVencimientoBrevete}
                onChange={(v: any) => onChange('fechaVencimientoBrevete', v)}
            />
            <div className="col-span-2 grid grid-cols-2 gap-4 mt-2">
                <label className="flex items-center gap-3 p-4 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.certificacionMedica}
                        onChange={e => onChange('certificacionMedica', e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600"
                    />
                    <span className="text-sm font-bold text-slate-700">Certificación Médica</span>
                </label>
                <label className="flex items-center gap-3 p-4 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={formData.antecedentesPenales}
                        onChange={e => onChange('antecedentesPenales', e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600"
                    />
                    <span className="text-sm font-bold text-slate-700">Sin Antecedentes</span>
                </label>
            </div>
        </div>
    );
};
