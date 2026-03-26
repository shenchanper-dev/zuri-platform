import React, { useState, useEffect } from 'react';
import useConductores from '@/hooks/useConductores';
import type { Conductor, CrearConductorDTO } from '@/domain/entities/Conductor.entity';

// ==========================================
// 🛡️ CONFIGURACIÓN DE NIVEL MUNDIAL
// ==========================================
interface Props {
  conductorEditar?: Conductor | null;
  onClose: () => void;
  onSuccess: () => void;
}

const INITIAL_STATE: CrearConductorDTO = {
  // 👤 Identidad
  dni: '',
  nombres: '',
  apellidos: '',
  nombreCompleto: '',
  email: '',
  fechaNacimiento: '',
  sexo: 'M',

  // 📞 Comunicación
  celular1: '',
  celular2: '',
  contactoEmergencia: '',
  celularEmergencia: '',

  // ⚖️ Legal y NEMT Compliance
  licencia_numero: '',
  licencia_categoria: '',
  fechaVencimientoBrevete: '',
  certificacionMedica: false,
  antecedentesPenales: false,

  // 🚗 Gestión de Flota
  placaVehiculo: '',
  marcaAuto: '',
  modeloAuto: '',
  añoAuto: new Date().getFullYear(),
  colorVehiculo: '',
  capacidadPasajeros: 4,
  soatVencimiento: '',
  revisionTecnicaVencimiento: '',

  // 📍 Ubicación y Despacho
  direccionCompleta: '',
  distritoId: 1,
  distrito_nombre: '',
  latitud: -12.046374,
  longitud: -77.042793,
  referenciaUbicacion: '',

  // ⚙️ Operaciones
  estado: 'PENDIENTE',
  servicios: []
};

export default function ConductorForm({ conductorEditar, onClose, onSuccess }: Props) {
  const [activeTab, setActiveTab] = useState(1);
  const { crearConductor, actualizarConductor, loading, error: apiError } = useConductores();

  const [formData, setFormData] = useState<CrearConductorDTO>(INITIAL_STATE);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 🔄 SINCRONIZACIÓN DE DATOS (Edit Mode)
  useEffect(() => {
    if (conductorEditar) {
      setFormData({
        ...INITIAL_STATE,
        ...conductorEditar,
        // Compatibilidad con campos antiguos o alias de DB
        licencia_numero: conductorEditar.licencia_numero || (conductorEditar as any).numeroBrevete || '',
      });
    }
  }, [conductorEditar]);

  // ⚙️ MANEJO DE CAMBIOS PROFESIONAL
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    // 1. Auto-formateo según Reglas de Dominio
    if (name === 'placaVehiculo') finalValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (name === 'dni') finalValue = value.replace(/\D/g, '').slice(0, 8);

    // 2. Sincronización de nombres
    if (name === 'nombres' || name === 'apellidos') {
      setFormData(prev => {
        const newData = { ...prev, [name]: value };
        return { ...newData, nombreCompleto: `${newData.nombres} ${newData.apellidos}`.trim() };
      });
      return;
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.dni || formData.dni.length < 8) errors.dni = "DNI debe tener 8 dígitos";
    if (!formData.nombres) errors.nombres = "Nombres son obligatorios";
    if (!formData.licencia_numero) errors.licencia_numero = "Número de licencia requerido para NEMT";
    if (!formData.placaVehiculo) errors.placaVehiculo = "Placa vehicular requerida";

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) setActiveTab(1); // Regresa al inicio si hay error
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const res = conductorEditar
      ? await actualizarConductor(conductorEditar.id, formData)
      : await crearConductor(formData);

    if (res.success) {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[95vh] overflow-hidden">

        {/* HEADER */}
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {conductorEditar ? '✏️ Expediente del Conductor' : '🆕 Registro de Conductor NEMT'}
            </h2>
            <p className="text-sm text-slate-500 font-medium">Cumplimiento de estándares de transporte médico</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-3xl">&times;</button>
        </div>

        {/* NAVEGACIÓN POR TABS (Veyo Style) */}
        <div className="flex border-b overflow-x-auto bg-white px-6 scrollbar-hide">
          {[
            { id: 1, label: '👤 Perfil Personal' },
            { id: 2, label: '📞 Contacto' },
            { id: 3, label: '⚖️ Legal/Médico' },
            { id: 4, label: '🚗 Vehículo' },
            { id: 5, label: '📍 Despacho/GPS' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-6 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">

          {apiError && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded shadow-sm">
              <strong>Error del Servidor:</strong> {apiError}
            </div>
          )}

          {/* TAB 1: IDENTIDAD */}
          {activeTab === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-300">
              <InputGroup label="N° DNI (8 dígitos)" name="dni" value={formData.dni} onChange={handleChange} error={formErrors.dni} maxLength={8} />
              <div className="hidden md:block"></div>
              <InputGroup label="Nombres" name="nombres" value={formData.nombres} onChange={handleChange} error={formErrors.nombres} />
              <InputGroup label="Apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} />
              <InputGroup label="Email Corporativo" name="email" type="email" value={formData.email} onChange={handleChange} />
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="Fecha Nacimiento" name="fechaNacimiento" type="date" value={formData.fechaNacimiento} onChange={handleChange} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Sexo</label>
                  <select name="sexo" value={formData.sexo} onChange={handleChange} className="px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-50">
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMUNICACIÓN */}
          {activeTab === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-300">
              <InputGroup label="Celular 1 (Principal)" name="celular1" value={formData.celular1} onChange={handleChange} placeholder="999888777" />
              <InputGroup label="Celular 2 (Opcional)" name="celular2" value={formData.celular2} onChange={handleChange} />
              <InputGroup label="Contacto de Emergencia" name="contactoEmergencia" value={formData.contactoEmergencia} onChange={handleChange} placeholder="Nombre del familiar" />
              <InputGroup label="Celular de Emergencia" name="celularEmergencia" value={formData.celularEmergencia} onChange={handleChange} />
            </div>
          )}

          {/* TAB 3: LEGAL / MÉDICO */}
          {activeTab === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputGroup label="Número de Licencia" name="licencia_numero" value={formData.licencia_numero} onChange={handleChange} error={formErrors.licencia_numero} />
                <InputGroup label="Categoría" name="licencia_categoria" value={formData.licencia_categoria} onChange={handleChange} placeholder="Ej: A-IIb" />
                <InputGroup label="Vencimiento Licencia" name="fechaVencimientoBrevete" type="date" value={formData.fechaVencimientoBrevete} onChange={handleChange} />
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl flex flex-col md:flex-row gap-8 border border-slate-100">
                <CheckboxGroup label="Certificación Médica aprobada" name="certificacionMedica" checked={formData.certificacionMedica} onChange={handleChange} />
                <CheckboxGroup label="Antecedentes Penales verificados" name="antecedentesPenales" checked={formData.antecedentesPenales} onChange={handleChange} />
              </div>
            </div>
          )}

          {/* TAB 4: VEHÍCULO */}
          {activeTab === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-right-4 duration-300">
              <InputGroup label="Placa" name="placaVehiculo" value={formData.placaVehiculo} onChange={handleChange} error={formErrors.placaVehiculo} placeholder="ABC-123" />
              <InputGroup label="Marca" name="marcaAuto" value={formData.marcaAuto} onChange={handleChange} />
              <InputGroup label="Modelo" name="modeloAuto" value={formData.modeloAuto} onChange={handleChange} />
              <InputGroup label="Año" name="añoAuto" type="number" value={formData.añoAuto} onChange={handleChange} />
              <InputGroup label="Color" name="colorVehiculo" value={formData.colorVehiculo} onChange={handleChange} />
              <InputGroup label="Capacidad Pasajeros" name="capacidadPasajeros" type="number" value={formData.capacidadPasajeros} onChange={handleChange} />
              <InputGroup label="Vencimiento SOAT" name="soatVencimiento" type="date" value={formData.soatVencimiento} onChange={handleChange} />
              <InputGroup label="Revisión Técnica" name="revisionTecnicaVencimiento" type="date" value={formData.revisionTecnicaVencimiento} onChange={handleChange} />
            </div>
          )}

          {/* TAB 5: UBICACIÓN */}
          {activeTab === 5 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-300">
              <InputGroup label="Distrito" name="distrito_nombre" value={formData.distrito_nombre} onChange={handleChange} />
              <InputGroup label="Referencia de Ubicación" name="referenciaUbicacion" value={formData.referenciaUbicacion} onChange={handleChange} />
              <div className="md:col-span-2">
                <InputGroup label="Dirección Completa" name="direccionCompleta" value={formData.direccionCompleta} onChange={handleChange} />
              </div>
              <InputGroup label="Latitud" name="latitud" type="number" step="any" value={formData.latitud} onChange={handleChange} />
              <InputGroup label="Longitud" name="longitud" type="number" step="any" value={formData.longitud} onChange={handleChange} />
            </div>
          )}

        </form>

        {/* FOOTER ACCIONES */}
        <div className="p-6 border-t bg-slate-50 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-white transition-all shadow-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className={`px-10 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2 ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200'
              }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Sincronizando...
              </>
            ) : conductorEditar ? 'Actualizar Expediente' : 'Registrar Conductor'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 🧩 COMPONENTES UI (DISEÑO PROFESIONAL)
// ==========================================
const InputGroup = ({ label, error, ...props }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</label>
    <input
      {...props}
      autoComplete="off"
      className={`px-4 py-3 rounded-xl border transition-all outline-none focus:ring-4 ${error
        ? 'border-red-400 focus:ring-red-50 bg-red-50'
        : 'border-slate-200 focus:border-blue-500 focus:ring-blue-50 bg-white'
        }`}
    />
    {error && <span className="text-[10px] text-red-500 font-bold uppercase ml-1">{error}</span>}
  </div>
);

const CheckboxGroup = ({ label, name, checked, onChange }: any) => (
  <label className="flex items-center gap-4 cursor-pointer group">
    <div className="relative flex items-center">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="w-6 h-6 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 transition-all"
      />
    </div>
    <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
      {label}
    </span>
  </label>
);