import React, { useState, useEffect } from 'react';
import useConductores from '@/hooks/useConductores';
import type { Conductor, CrearConductorDTO } from '@/domain/entities/Conductor.entity';

// ==========================================
// 🛡️ TYPES & PROPS
// ==========================================
interface Props {
  conductorEditar?: Conductor | null;
  onClose: () => void;
  onSuccess: () => void;
}

const INITIAL_STATE: CrearConductorDTO = {
  nombres: '',
  apellidos: '',
  dni: '',
  celular1: '',
  email: '',
  licencia_numero: '',
  licencia_categoria: '',
  licencia_vencimiento: '',
  placaVehiculo: '',
  marcaAuto: '',
  modeloAuto: '',
  colorAuto: '',
  distrito_nombre: '',
  direccionCompleta: '',
  latitud: -12.046374,
  longitud: -77.042793,
  referencia: '',
  estado: 'PENDIENTE'
};

export default function ConductorForm({ conductorEditar, onClose, onSuccess }: Props) {
  const { crearConductor, actualizarConductor, loading, error: apiError, limpiarError } = useConductores();
  
  const [formData, setFormData] = useState<CrearConductorDTO>(INITIAL_STATE);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (conductorEditar) {
      setIsEditMode(true);
      setFormData({
        nombres: conductorEditar.nombres || '',
        apellidos: conductorEditar.apellidos || '',
        dni: conductorEditar.dni || '',
        celular1: conductorEditar.celular1 || '',
        email: conductorEditar.email || '',
        // 🛠️ FIX 1: Forzamos que siempre sea un String para evitar fallos de .trim()
        licencia_numero: String(conductorEditar.licencia_numero || (conductorEditar as any).numeroBrevete || '').trim(),
        placaVehiculo: conductorEditar.placaVehiculo || '',
        marcaAuto: conductorEditar.marcaAuto || '',
        modeloAuto: conductorEditar.modeloAuto || '',
        colorAuto: conductorEditar.colorAuto || '',
        distrito_nombre: conductorEditar.distrito_nombre || '',
        direccionCompleta: conductorEditar.direccionCompleta || '',
        latitud: conductorEditar.latitud || -12.046374,
        longitud: conductorEditar.longitud || -77.042793,
        referencia: conductorEditar.referencia || '',
        estado: conductorEditar.estado || 'PENDIENTE'
      });
    } else {
      setIsEditMode(false);
      setFormData(INITIAL_STATE);
    }
    limpiarError();
  }, [conductorEditar, limpiarError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    let finalValue: string | number = value;
    if (name === 'placaVehiculo') finalValue = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (name === 'dni') finalValue = value.replace(/\D/g, '').slice(0, 8);
    if (name === 'celular1') finalValue = value.replace(/\D/g, '').slice(0, 9);
    // 🛠️ FIX 2: Autocorrección de Licencia mientras escribes
    if (name === 'licencia_numero') finalValue = value.toUpperCase().trim();

    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleGeoLocation = () => {
    if (!navigator.geolocation) return alert('Geolocalización no soportada');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude
        }));
      },
      (err) => alert('Error obteniendo ubicación: ' + err.message)
    );
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (formData.dni.length !== 8) errors.dni = 'El DNI debe tener 8 dígitos';
    if (!formData.nombres.trim()) errors.nombres = 'Nombres requeridos';
    if (!formData.apellidos.trim()) errors.apellidos = 'Apellidos requeridos';
    if (formData.celular1.length !== 9) errors.celular1 = 'Celular debe tener 9 dígitos';
    
    // 🛠️ FIX 3: Validación Ultra-Robusta para la Licencia
    const lic = String(formData.licencia_numero || '').trim();
    if (!lic || lic.length < 3) {
      errors.licencia_numero = 'Número de licencia es obligatorio';
    }

    if (!formData.placaVehiculo.trim()) errors.placaVehiculo = 'Placa requerida';
    if (!formData.email.includes('@')) errors.email = 'Email inválido';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      ...formData,
      latitud: Number(formData.latitud),
      longitud: Number(formData.longitud),
    };

    let result;
    if (isEditMode && conductorEditar?.id) {
      result = await actualizarConductor(conductorEditar.id, payload);
    } else {
      result = await crearConductor(payload);
    }

    if (result.success) {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditMode ? '✏️ Editar Conductor' : '🆕 Nuevo Conductor'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {(apiError || Object.keys(formErrors).length > 0) && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">
              <div className="flex">
                <div className="flex-shrink-0 text-red-500">⚠️</div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">Por favor corrige los siguientes errores:</p>
                  <ul className="list-disc ml-5 mt-1 text-sm text-red-600">
                    {apiError && <li>{apiError}</li>}
                    {Object.values(formErrors).map((err, idx) => <li key={idx}>{err}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 border-b pb-1">
              👤 Datos Personales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputGroup label="DNI" name="dni" value={formData.dni} onChange={handleChange} error={formErrors.dni} placeholder="8 dígitos" maxLength={8} />
              <InputGroup label="Nombres" name="nombres" value={formData.nombres} onChange={handleChange} error={formErrors.nombres} />
              <InputGroup label="Apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} error={formErrors.apellidos} />
              <InputGroup label="Celular" name="celular1" value={formData.celular1} onChange={handleChange} error={formErrors.celular1} placeholder="9XXXXXXXX" maxLength={9} />
              <InputGroup label="Email" name="email" type="email" value={formData.email} onChange={handleChange} error={formErrors.email} className="md:col-span-2" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 border-b pb-1">
              🚗 Unidad y Legal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputGroup label="Placa" name="placaVehiculo" value={formData.placaVehiculo} onChange={handleChange} error={formErrors.placaVehiculo} placeholder="ABC-123" />
              <InputGroup label="Licencia" name="licencia_numero" value={formData.licencia_numero} onChange={handleChange} error={formErrors.licencia_numero} />
              <InputGroup label="Marca" name="marcaAuto" value={formData.marcaAuto} onChange={handleChange} />
              <InputGroup label="Modelo" name="modeloAuto" value={formData.modeloAuto} onChange={handleChange} />
              <InputGroup label="Color" name="colorAuto" value={formData.colorAuto} onChange={handleChange} />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center border-b pb-1 mb-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">📍 Ubicación</h3>
              <button type="button" onClick={handleGeoLocation} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">
                🎯 Usar mi ubicación
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputGroup label="Distrito" name="distrito_nombre" value={formData.distrito_nombre} onChange={handleChange} />
              <InputGroup label="Dirección Completa" name="direccionCompleta" value={formData.direccionCompleta} onChange={handleChange} className="md:col-span-2" />
              <InputGroup label="Latitud" name="latitud" type="number" value={formData.latitud} onChange={handleChange} step="any" />
              <InputGroup label="Longitud" name="longitud" type="number" value={formData.longitud} onChange={handleChange} step="any" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium" disabled={loading}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className={`px-6 py-2.5 rounded-lg text-white font-medium shadow-md flex items-center ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {loading ? 'Guardando...' : isEditMode ? 'Actualizar' : 'Crear Conductor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface InputGroupProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  className?: string;
}

const InputGroup = ({ label, error, className = '', ...props }: InputGroupProps) => (
  <div className={`flex flex-col ${className}`}>
    <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      {...props}
      autoComplete="off"
      className={`w-full px-3 py-2 rounded-lg border outline-none focus:ring-2 ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}`}
    />
    {error && <span className="text-xs text-red-500 mt-1 font-medium">{error}</span>}
  </div>
);