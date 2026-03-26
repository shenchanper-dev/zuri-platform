import React from 'react';
import { FotoUpload } from '@/components/FotoUpload';
import { InputField, SelectField } from '@/components/conductores/shared/FormComponents';

interface PersonalTabProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  errors: any;
}

export const PersonalTab: React.FC<PersonalTabProps> = ({ formData, onChange, errors }) => {
  const comprimirImagen = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Máximo 400x400px para fotos de perfil
        const max = 400;
        const ratio = Math.min(max / img.width, max / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.75)); // 75% calidad
      };
      img.src = url;
    });
  };

  const handleFotoChange = async (file: File | null) => {
    if (!file) {
      onChange('foto', null);
      return;
    }
    try {
      const base64 = await comprimirImagen(file);
      onChange('foto', base64);
    } catch (error) {
      console.error('Error comprimiendo imagen:', error);
      alert('Error al procesar la imagen');
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-10 animate-in fade-in slide-in-from-bottom-2 items-start">

      {/* SECCIÓN FOTO: Con ancho fijo para que no se deforme */}
      <div className="w-full md:w-[200px] flex-shrink-0 flex flex-col items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <FotoUpload
          currentFoto={formData.foto}
          onChange={handleFotoChange}
          nombre={formData.nombres}
          apellidos={formData.apellidos}
        />
        <p className="text-[10px] uppercase font-black text-slate-400 mt-4 tracking-tighter">
          Foto de Perfil
        </p>
      </div>

      {/* SECCIÓN CAMPOS: Grid que se adapta sin amontonarse */}
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
          label="Nombres *"
          value={formData.nombres}
          onChange={(v: any) => onChange('nombres', v)}
          error={errors.nombres}
        />

        <InputField
          label="Apellidos *"
          value={formData.apellidos}
          onChange={(v: any) => onChange('apellidos', v)}
          error={errors.apellidos}
        />

        <InputField
          label="Fecha Nacimiento"
          type="date"
          value={formData.fechaNacimiento}
          onChange={(v: any) => onChange('fechaNacimiento', v)}
        />

        <SelectField
          label="Sexo"
          value={formData.sexo}
          onChange={(v: any) => onChange('sexo', v)}
          options={[
            { value: 'M', label: 'Masculino' },
            { value: 'F', label: 'Femenino' }
          ]}
        />
      </div>
    </div>
  );
};