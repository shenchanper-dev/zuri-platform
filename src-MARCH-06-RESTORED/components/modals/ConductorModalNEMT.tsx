'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  MapPin,
  Phone,
  CreditCard,
  Car,
  Settings,
  Activity
} from 'lucide-react';

import { Conductor, EstadoConductor } from '@/domain/entities/Conductor.entity';

// ✅ Tabs reales
import { PersonalTab } from '../conductores/tabs/PersonalTab';
import { DireccionTab } from '../conductores/tabs/DireccionTab';
import { ContactoTab } from '../conductores/tabs/ContactoTab';
import { LicenciaTab } from '../conductores/tabs/LicenciaTab';
import { VehiculoTab } from '../conductores/tabs/VehiculoTab';
import { ControlTab } from '../conductores/tabs/ControlTab';
import { useConductores } from '@/hooks/useConductores';

interface ConductorModalNEMTProps {
  isOpen: boolean;
  onClose: () => void;
  conductor?: Conductor;
  onSuccess: () => void;
}

const TABS = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'direccion', label: 'Dirección', icon: MapPin },
  { id: 'contacto', label: 'Contacto', icon: Phone },
  { id: 'licencia', label: 'Licencia', icon: CreditCard },
  { id: 'vehiculo', label: 'Vehículo', icon: Car },
  { id: 'control', label: 'Control', icon: Settings }
];

export default function ConductorModalNEMT({
  isOpen,
  onClose,
  conductor,
  onSuccess
}: ConductorModalNEMTProps) {
  const [activeTab, setActiveTab] = useState('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);
  const [distritos, setDistritos] = useState<any[]>([]);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [formData, setFormData] = useState<any>({
    dni: '', nombres: '', apellidos: '', sexo: 'M', foto: null, fotoVehiculo: null,
    celular1: '', celular2: '', email: '',
    domicilioCompleto: '', distritoId: '',
    nombreContactoEmergencia: '', celularContactoEmergencia: '',
    numeroBrevete: '', licencia_categoria: 'A-I', fechaVencimientoBrevete: '',
    certificacionMedica: false, antecedentesPenales: false,
    marcaVehiculo: '', modeloVehiculo: '', placa: '', añoVehiculo: new Date().getFullYear(),
    colorVehiculo: '', soatVencimiento: '', revisionTecnicaVencimiento: '',
    servicios: [], equipamiento: [],
    estado: 'ACTIVO', domicilioLatitud: null, domicilioLongitud: null
  });

  const mapConductorToFormData = (c: any) => ({
    ...c,
    distritoId: c.distritoId ? String(c.distritoId) : '',
    domicilioCompleto: c.domicilioCompleto || c.direccionCompleta || '',
    placa: c.placa || c.placaVehiculo || '',
    marcaVehiculo: c.marcaVehiculo || c.marcaAuto || '',
    modeloVehiculo: c.modeloVehiculo || c.modeloAuto || '',
    añoVehiculo: c.añoVehiculo || c.añoAuto || new Date().getFullYear(),
    colorVehiculo: c.colorVehiculo || '',
    nombreContactoEmergencia: c.nombreContactoEmergencia || c.contactoEmergencia || '',
    celularContactoEmergencia: c.celularContactoEmergencia || c.celularEmergencia || '',
    foto: c.foto || null,
    fotoVehiculo: c.fotoVehiculo || null,
    sexo: c.sexo || 'M',
    certificacionMedica: c.certificacionMedica || false,
    antecedentesPenales: c.antecedentesPenales || false,
    licencia_categoria: c.licencia_categoria || c.licenciaCategoria || 'A-I',
    estado: c.estado || 'ACTIVO',
    equipamiento: Array.isArray(c.equipamiento) ? c.equipamiento : [],
    servicios: Array.isArray(c.servicios) ? c.servicios : [],
  });

  useEffect(() => {
    setMounted(true);
    if (!isOpen) return;

    loadDistritos();

    if (conductor) {
      setFormData(mapConductorToFormData(conductor));
      console.log('🔄 [useEffect] Conductor cargado, colorVehiculo:', conductor.colorVehiculo);
    } else {
      resetForm();
    }

    setActiveTab('personal');
    setErrors({});
  }, [isOpen, conductor]);

  useEffect(() => {
    if (!isOpen || !conductor?.id) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/conductores/${conductor.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data?.success && data.conductor) {
          setFormData(mapConductorToFormData(data.conductor));
        }
      } catch {
        return;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, conductor?.id]);

  const resetForm = () => {
    setFormData({
      dni: '', nombres: '', apellidos: '', sexo: 'M', foto: '', fotoVehiculo: '',
      celular1: '', celular2: '', email: '',
      domicilioCompleto: '', distritoId: '',
      nombreContactoEmergencia: '', celularContactoEmergencia: '',
      numeroBrevete: '', licencia_categoria: 'A-I', fechaVencimientoBrevete: '',
      certificacionMedica: false, antecedentesPenales: false,
      marcaVehiculo: '', modeloVehiculo: '', placa: '', añoVehiculo: new Date().getFullYear(),
      colorVehiculo: '', soatVencimiento: '', revisionTecnicaVencimiento: '',
      servicios: [], equipamiento: [],
      estado: 'ACTIVO', domicilioLatitud: null, domicilioLongitud: null
    });
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const loadDistritos = async () => {
    try {
      const res = await fetch('/api/distritos?activo=true');
      const data = await res.json();
      if (data.success && Array.isArray(data.distritos)) {
        setDistritos(data.distritos.map((d: any) => ({
          value: String(d.id),
          label: d.nombre
        })));
      } else {
        console.error('❌ [Frontend] Formato inválido de distritos:', data);
      }
    } catch (e) {
      console.error('❌ Error cargando distritos:', e);
    }
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return alert('GPS no soportado');
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleFieldChange('domicilioLatitud', pos.coords.latitude);
        handleFieldChange('domicilioLongitud', pos.coords.longitude);
        setGpsLoading(false);
      },
      () => { alert('Error obteniendo ubicación'); setGpsLoading(false); },
      { enableHighAccuracy: true }
    );
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.dni || formData.dni.length !== 8) e.dni = 'DNI inválido';
    if (!formData.nombres) e.nombres = 'Nombres requeridos';
    if (!formData.apellidos) e.apellidos = 'Apellidos requeridos';
    if (!formData.celular1) e.celular1 = 'Celular requerido';
    if (!formData.numeroBrevete) e.numeroBrevete = 'Licencia requerida';
    if (!formData.domicilioCompleto) e.domicilioCompleto = 'Dirección requerida';
    if (!formData.distritoId) e.distritoId = 'Distrito requerido';

    setErrors(e);

    if (Object.keys(e).length > 0) {
      alert('Por favor complete todos los campos obligatorios (*) marcados en rojo.');
      return false;
    }

    return true;
  };

  // 🚀 SOLUCIÓN MAGISTRAL: LOGICA DE UPLOAD UNIFICADA (Base64)
  const { actualizarConductor, crearConductor } = useConductores();

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      console.log('🕵️ [DEBUG] handleSubmit iniciado con Base64');

      let result;
      if (conductor) {
        // Actualizar existente (las fotos ya vienen como Base64 desde las pestañas)
        result = await actualizarConductor(conductor.id, formData);
      } else {
        // Crear nuevo
        result = await crearConductor(formData);
      }

      if (!result.success) {
        throw new Error(result.error || 'Error al guardar el conductor');
      }

      console.log('✅ [handleSubmit] Guardado exitoso con Base64:', result.data);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('❌ [handleSubmit] Error:', err);
      alert(err.message || 'Error crítico al procesar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center px-8 py-5 border-b bg-white">
          <h2 className="text-xl font-black text-slate-800">
            {conductor ? '📝 Editar Expediente' : '🆕 Registro Nuevo Conductor'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-slate-50 overflow-x-auto no-scrollbar">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-[11px] font-black uppercase tracking-widest flex items-center gap-2 whitespace-nowrap transition-all
                ${activeTab === tab.id ? 'bg-white border-b-2 border-blue-600 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-white">
          {activeTab === 'personal' && <PersonalTab formData={formData} onChange={handleFieldChange} errors={errors} />}
          {activeTab === 'direccion' && (
            <DireccionTab
              formData={formData}
              onChange={handleFieldChange}
              errors={errors}
              distritos={distritos}
              detectLocation={detectLocation}
              gpsLoading={gpsLoading}
            />
          )}
          {activeTab === 'contacto' && <ContactoTab formData={formData} onChange={handleFieldChange} errors={errors} />}
          {activeTab === 'licencia' && <LicenciaTab formData={formData} onChange={handleFieldChange} errors={errors} />}
          {activeTab === 'vehiculo' && <VehiculoTab formData={formData} onChange={handleFieldChange} errors={errors} />}
          {activeTab === 'control' && <ControlTab formData={formData} onChange={handleFieldChange} />}
        </div>

        {/* Action Footer */}
        <div className="p-6 border-t bg-slate-50 flex justify-between items-center px-8">
          <button onClick={onClose} className="text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors">Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Procesando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
