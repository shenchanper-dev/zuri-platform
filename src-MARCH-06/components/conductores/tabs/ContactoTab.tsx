import React from 'react';
import { InputField } from '@/components/conductores/shared/FormComponents';

interface ContactoTabProps {
    formData: any;
    onChange: (field: string, value: any) => void;
    errors: any;
}

export const ContactoTab: React.FC<ContactoTabProps> = ({ formData, onChange, errors }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
            <InputField
                label="Celular Principal *"
                value={formData.celular1}
                onChange={(v: any) => onChange('celular1', v)}
                maxLength={9}
                error={errors.celular1}
            />
            <InputField
                label="Celular Secundario"
                value={formData.celular2}
                onChange={(v: any) => onChange('celular2', v)}
                maxLength={9}
            />
            <InputField
                label="Email"
                value={formData.email}
                onChange={(v: any) => onChange('email', v)}
                type="email"
            />
            <div className="col-span-2 border-t border-slate-100 mt-4"></div>
            <h4 className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-widest">Contacto de Emergencia</h4>
            <InputField
                label="Nombre Completo"
                value={formData.nombreContactoEmergencia}
                onChange={(v: any) => onChange('nombreContactoEmergencia', v)}
            />
            <InputField
                label="Celular Emergencia"
                value={formData.celularContactoEmergencia}
                onChange={(v: any) => onChange('celularContactoEmergencia', v)}
                maxLength={9}
            />
        </div>
    );
};
