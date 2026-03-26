import React from 'react';
import { InputField, SelectField } from '@/components/conductores/shared/FormComponents';
import { FotoUpload } from '@/components/FotoUpload';
import { VEHICLE_BRANDS_PERU } from '@/constants/vehicleBrands';

interface VehiculoTabProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  errors: any;
}

export const VehiculoTab: React.FC<VehiculoTabProps> = ({
  formData,
  onChange,
  errors
}) => {
  const handleFotoChange = async (file: File | null) => {
    if (!file) {
      onChange('fotoVehiculo', null);
      return;
    }
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('folder', 'vehiculos');
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (data.url) {
        onChange('fotoVehiculo', data.url);
      } else {
        alert('Error al subir la foto del vehículo');
      }
    } catch (error) {
      console.error('Error subiendo imagen vehiculo:', error);
      alert('Error al subir la imagen');
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-10 animate-in fade-in slide-in-from-bottom-2 items-start">

      {/* SECCIÓN FOTO VEHÍCULO */}
      <div className="w-full md:w-[240px] flex-shrink-0 flex flex-col items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <FotoUpload
          currentFoto={formData.fotoVehiculo}
          onChange={handleFotoChange}
          nombre="Auto"
          apellidos={formData.placa || ''}
        />
        <p className="text-[10px] uppercase font-black text-slate-400 mt-4 tracking-tighter">
          Foto del Vehículo
        </p>
      </div>

      {/* SECCIÓN CAMPOS */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 w-full">
        <InputField
          label="Placa *"
          value={formData.placa}
          onChange={(v: any) => onChange('placa', v)}
          error={errors?.placa}
          placeholder="ABC-123"
        />

        <SelectField
          label="Marca *"
          value={(!formData.marcaVehiculo || VEHICLE_BRANDS_PERU.includes(formData.marcaVehiculo)) ? formData.marcaVehiculo : 'Otros'}
          onChange={(v: any) => onChange('marcaVehiculo', v === 'Otros' ? 'Otros' : v)}
          options={VEHICLE_BRANDS_PERU.map(m => ({ value: m, label: m }))}
          placeholder="Seleccione marca..."
          error={errors?.marcaVehiculo}
        />

        {/* INPUT CONDICIONAL PARA OTRA MARCA */}
        {((!formData.marcaVehiculo || !VEHICLE_BRANDS_PERU.includes(formData.marcaVehiculo)) && (formData.marcaVehiculo === 'Otros' || !VEHICLE_BRANDS_PERU.includes(formData.marcaVehiculo))) && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-300">
            <InputField
              label="Especifique Marca"
              value={formData.marcaVehiculo === 'Otros' ? '' : formData.marcaVehiculo}
              onChange={(v: any) => onChange('marcaVehiculo', v)}
              placeholder="Ingrese la marca manualmente..."
              error={errors?.marcaVehiculo}
            />
          </div>
        )}

        <InputField
          label="Modelo"
          value={formData.modeloVehiculo}
          onChange={(v: any) => onChange('modeloVehiculo', v)}
          placeholder="Corolla, Yaris, etc."
          error={errors?.modeloVehiculo}
        />

        <InputField
          label="Año"
          type="number"
          value={formData.añoVehiculo}
          onChange={(v: any) => onChange('añoVehiculo', v)}
          placeholder="2024"
          error={errors?.añoVehiculo}
        />

        <InputField
          label="Color"
          value={formData.colorVehiculo}
          onChange={(v: any) => onChange('colorVehiculo', v)}
          placeholder="Rojo, Negro, Plata..."
        />

        <InputField
          label="Vencimiento SOAT"
          type="date"
          value={formData.soatVencimiento}
          onChange={(v: any) => onChange('soatVencimiento', v)}
          error={errors?.soatVencimiento}
        />

        <InputField
          label="Revisión Técnica"
          type="date"
          value={formData.revisionTecnicaVencimiento}
          onChange={(v: any) => onChange('revisionTecnicaVencimiento', v)}
          error={errors?.revisionTecnicaVencimiento}
        />
      </div>
    </div>
  );
};
