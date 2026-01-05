'use client';
import React, { useState, useEffect, useRef } from 'react';
import { X, User, MapPin, Phone, CreditCard, Car, Shield, Camera } from 'lucide-react';
import { useConductores } from '@/hooks/useConductores';
import type { Conductor, CrearConductorDTO, EstadoConductor } from '@/domain/entities/Conductor.entity';

// ================================
// CONSTANTES OPTIMIZADAS - FUERA DEL COMPONENTE
// ================================
const DISTRITOS_LIMA = [
  'Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos',
  'Cieneguilla', 'Comas', 'El Agustino', 'Independencia', 'Jesús María',
  'La Molina', 'La Victoria', 'Lima', 'Lince', 'Los Olivos', 'Lurigancho',
  'Lurín', 'Magdalena del Mar', 'Miraflores', 'Pachacámac', 'Pucusana',
  'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa', 'Punta Negra',
  'Rímac', 'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho',
  'San Juan de Miraflores', 'San Luis', 'San Martín de Porres', 'San Miguel',
  'Santa Anita', 'Santa María del Mar', 'Santa Rosa', 'Santiago de Surco',
  'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo'
] as const;

const SERVICIOS_NEMT = [
  { id: 'STANDARD', label: 'Estándar / Ambulatorio', icon: '🚗' },
  { id: 'WHEELCHAIR', label: 'Silla de Ruedas', icon: '♿' },
  { id: 'STRETCHER', label: 'Camilla', icon: '🛏️' },
  { id: 'AMBULATORY', label: 'Ambulatorio Asistido', icon: '🚶' },
  { id: 'OXYGEN', label: 'Oxígeno', icon: '🫁' }
] as const;

const TABS_CONDUCTORES = [
  { id: 1, label: 'Personal', icon: User },
  { id: 2, label: 'Dirección', icon: MapPin },
  { id: 3, label: 'Contacto', icon: Phone },
  { id: 4, label: 'Licencia', icon: CreditCard },
  { id: 5, label: 'Vehículo', icon: Car },
  { id: 6, label: 'Control', icon: Shield }
] as const;

// ================================
// INTERFACE
// ================================
interface ConductorModalNEMTProps {
  isOpen: boolean;
  onClose: () => void;
  conductor?: Conductor | null;
  onSuccess?: () => void;
}

// ================================
// COMPONENTE PRINCIPAL OPTIMIZADO
// ================================
const ConductorModalNEMT: React.FC<ConductorModalNEMTProps> = ({
  isOpen,
  onClose,
  conductor,
  onSuccess
}) => {
  // ================================
  // ESTADO DEL FORMULARIO - CAMPOS UNIFICADOS
  // ================================
  const [formData, setFormData] = useState<CrearConductorDTO>({
    // CAMPOS OBLIGATORIOS
    dni: '',
    nombreCompleto: '',
    direccionCompleta: '',
    distrito_id: 0,
    celular1: '',
    estado: 'ACTIVO' as EstadoConductor,
    servicios: [],
    
    // CAMPOS OPCIONALES BÁSICOS
    nombres: '',
    apellidos: '',
    fechaNacimiento: '',
    sexo: 'Masculino',
    email: '',
    foto: '',
    fotoUrl: '',
    
    // LOCATION & GPS
    distrito_nombre: '',
    latitud: undefined,
    longitud: undefined,
    
    // COMMUNICATION
    celular2: '',
    telefono: '',
    telefonoEmergencia: '',
    contactoEmergencia: '',
    celularEmergencia: '',
    
    // LEGAL DOCUMENTATION (UNIFICADOS)
    numeroBrevete: '',
    licenciaCategoria: 'A2b',
    fechaVencimientoBrevete: '',
    certificacionMedica: false,
    fechaCertificacionMedica: '',
    antecedentesPenales: false,
    fechaAntecedentes: '',
    
    // VEHICLE INFORMATION
    placaVehiculo: '',
    marcaAuto: '',        
    modeloAuto: '',      
    añoAuto: undefined,   
    colorAuto: '',
    soatVencimiento: '',
    revisionTecnicaVencimiento: '',
    
    // OPERATIONAL STATE
    serviciosAsignados: [],
    motivoInactividad: '',
    puntosLicencia: 0,
    
    // PERFORMANCE METRICS
    calificacionPromedio: 5.0,
    totalViajes: 0,
    totalKilometros: 0
  });

  // ================================
  // ESTADOS DE CONTROL
  // ================================
  const [activeTab, setActiveTab] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [selectedFoto, setSelectedFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>('');
  const fotoInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const { crearConductor, actualizarConductor } = useConductores();

  // ================================
  // INICIALIZACIÓN DEL FORMULARIO
  // ================================
  useEffect(() => {
    if (conductor) {
      // Editar conductor existente - MAPEO INTELIGENTE
      setFormData({
        dni: conductor?.dni || '',
        nombreCompleto: conductor?.nombreCompleto || '',
        nombres: conductor?.nombres || '',
        apellidos: conductor?.apellidos || '',
        fechaNacimiento: conductor?.fechaNacimiento || '',
        sexo: conductor?.sexo || 'Masculino',
        email: conductor?.email || '',
        foto: conductor?.foto || '',
        fotoUrl: conductor?.fotoUrl || '',
        direccionCompleta: conductor?.direccionCompleta || '',
        distrito_nombre: conductor?.distrito_nombre || '',
        distrito_id: conductor?.distrito_id || 0,
        latitud: conductor?.latitud || undefined,
        longitud: conductor?.longitud || undefined,
        celular1: conductor?.celular1 || '',
        celular2: conductor?.celular2 || '',
        telefono: conductor?.telefono || '',
        telefonoEmergencia: conductor?.telefonoEmergencia || '',
        contactoEmergencia: conductor?.contactoEmergencia || '',
        celularEmergencia: conductor?.celularEmergencia || '',
        
        // ✅ LICENCIA - MAPEO DB -> UI
        numeroBrevete: conductor?.numeroBrevete || conductor?.licencia_numero || '',
        licenciaCategoria: conductor?.licenciaCategoria || conductor?.licencia_categoria || 'A2b',
        fechaVencimientoBrevete: conductor?.fechaVencimientoBrevete || '',
        
        certificacionMedica: conductor?.certificacionMedica || false,
        fechaCertificacionMedica: conductor?.fechaCertificacionMedica || '',
        antecedentesPenales: conductor?.antecedentesPenales || false,
        fechaAntecedentes: conductor?.fechaAntecedentes || '',
        placaVehiculo: conductor?.placaVehiculo || '',
        marcaAuto: conductor?.marcaAuto || '',           
        modeloAuto: conductor?.modeloAuto || '',         
        añoAuto: conductor?.añoAuto || undefined,        
        colorAuto: conductor?.colorAuto || '',
        soatVencimiento: conductor?.soatVencimiento || '',
        revisionTecnicaVencimiento: conductor?.revisionTecnicaVencimiento || '',
        estado: conductor?.estado || 'ACTIVO' as EstadoConductor,
        servicios: conductor?.servicios || [],
        serviciosAsignados: conductor?.serviciosAsignados || [],
        motivoInactividad: conductor?.motivoInactividad || '',
        puntosLicencia: conductor?.puntosLicencia || 0,
        calificacionPromedio: conductor?.calificacionPromedio || 5.0,
        totalViajes: conductor?.totalViajes || 0,
        totalKilometros: conductor?.totalKilometros || 0
      });
    } else {
      // Nuevo conductor - formulario limpio
      setFormData({
        dni: '',
        nombreCompleto: '',
        nombres: '',
        apellidos: '',
        fechaNacimiento: '',
        sexo: 'Masculino',
        email: '',
        foto: '',
        fotoUrl: '',
        direccionCompleta: '',
        distrito_nombre: '',
        distrito_id: 0,
        latitud: undefined,
        longitud: undefined,
        celular1: '',
        celular2: '',
        telefono: '',
        telefonoEmergencia: '',
        contactoEmergencia: '',
        celularEmergencia: '',
        numeroBrevete: '',
        licenciaCategoria: 'A2b',
        fechaVencimientoBrevete: '',
        certificacionMedica: false,
        fechaCertificacionMedica: '',
        antecedentesPenales: false,
        fechaAntecedentes: '',
        placaVehiculo: '',
        marcaAuto: '',
        modeloAuto: '',
        añoAuto: undefined,
        colorAuto: '',
        soatVencimiento: '',
        revisionTecnicaVencimiento: '',
        estado: 'ACTIVO' as EstadoConductor,
        servicios: [],
        serviciosAsignados: [],
        motivoInactividad: '',
        puntosLicencia: 0,
        calificacionPromedio: 5.0,
        totalViajes: 0,
        totalKilometros: 0
      });
    }
    setErrors({});
    setSubmitError('');
    setSelectedFoto(null);
    setFotoPreview('');
    setActiveTab(1);
  }, [conductor, isOpen]);

  // ================================
  // VALIDACIONES ALINEADAS
  // ================================
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Campos obligatorios
    if (!formData.dni.trim() || formData.dni.length !== 8) {
      newErrors.dni = 'DNI debe tener 8 dígitos';
    }
    if (!formData.nombreCompleto.trim()) {
      newErrors.nombreCompleto = 'Nombre completo es requerido';
    }
    if (!formData.direccionCompleta.trim()) {
      newErrors.direccionCompleta = 'Dirección completa es requerida';
    }
    if (!formData.distrito_id) {
      newErrors.distrito_id = 'Distrito es requerido';
    }
    if (!formData.celular1.trim()) {
      newErrors.celular1 = 'Número de celular es requerido';
    }

    // ✅ VALIDACIÓN LICENCIA ALINEADA
    if (!formData.numeroBrevete.trim()) {
      newErrors.numeroBrevete = 'Número de licencia es requerido';
    } else if (formData.numeroBrevete.length < 6) {
      newErrors.numeroBrevete = 'Número de licencia debe tener al menos 6 caracteres';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email debe tener formato válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================================
  // HANDLERS OPTIMIZADOS
  // ================================
  const handleInputChange = (field: keyof CrearConductorDTO, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          foto: 'La imagen debe ser menor a 1MB'
        }));
        return;
      }

      setSelectedFoto(file);
      const previewUrl = URL.createObjectURL(file);
      setFotoPreview(previewUrl);
      console.log("📸 [Photo] Archivo seleccionado:", file.name);
      
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.foto;
        return newErrors;
      });
    }
  };

  const triggerFotoUpload = () => {
    fotoInputRef.current?.click();
  };

  const removeFoto = () => {
    setSelectedFoto(null);
    setFotoPreview('');
    if (fotoInputRef.current) {
      fotoInputRef.current.value = '';
    }
  };

  const detectarGPS = () => {
    if (!navigator.geolocation) {
      setErrors(prev => ({
        ...prev,
        gps: 'GPS no disponible en este dispositivo'
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleInputChange('latitud', position.coords.latitude);
        handleInputChange('longitud', position.coords.longitude);
        console.log('📍 GPS detectado:', position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('Error obteniendo GPS:', error);
        setErrors(prev => ({
          ...prev,
          gps: 'Error al obtener ubicación GPS'
        }));
      }
    );
  };

  const handleDistritoChange = (distrito: string) => {
    const distritoId = DISTRITOS_LIMA.indexOf(distrito) + 1;
    handleInputChange('distrito_nombre', distrito);
    handleInputChange('distrito_id', distritoId);
  };
const handleSubmit = async () => {
  console.log('🔍 [Debug] Validating form with data:', {
    dni: formData.dni,
    nombreCompleto: formData.nombreCompleto,
    numeroBrevete: formData.numeroBrevete,
    direccionCompleta: formData.direccionCompleta,
    distrito_id: formData.distrito_id,
    celular1: formData.celular1
  });

  if (!validateForm()) {
    setSubmitError('Por favor corrige los errores antes de continuar');
    return;
  }

  setLoading(true);
  setSubmitError('');

  try {
    // ✅ FIX CRÍTICO: Mapeo de nomenclatura UI → Hook/DB
    const dataForAPI = {
      ...formData,
      
      // ✅ SOLUCIÓN PROBLEMA #2: Hook espera estos nombres de campo
      licencia_numero: formData.numeroBrevete,        // Mapeo crítico
      licencia_categoria: formData.licenciaCategoria, // Mapeo crítico
      
      // ✅ MANTENER campos UI por compatibilidad
      numeroBrevete: formData.numeroBrevete,
      licenciaCategoria: formData.licenciaCategoria,
      
      // ✅ PREVENIR crashes en filtros (null safety)
      placaVehiculo: formData.placaVehiculo || '',
      marcaAuto: formData.marcaAuto || '',
      modeloAuto: formData.modeloAuto || ''
    };

    console.log('🚀 [FIX] Data mapped for API:', {
      original_numeroBrevete: formData.numeroBrevete,
      mapped_licencia_numero: dataForAPI.licencia_numero,
      success: 'Field mapping applied!'
    });

    let result;

    if (conductor?.id) {
      result = await actualizarConductor(conductor.id, dataForAPI);  // ✅ Usar dataForAPI
    } else {
      result = await crearConductor(dataForAPI);                     // ✅ Usar dataForAPI
    }

    if (result.success) {
      console.log('✅ [SUCCESS] Conductor creado/actualizado exitosamente');
      onClose();
      onSuccess?.();
      
      if (fotoPreview) {
        URL.revokeObjectURL(fotoPreview);
      }
    } else {
      console.error('❌ [ERROR] Hook returned error:', result.error);
      setSubmitError(result.error || 'Error al guardar el conductor');
    }
  } catch (error) {
    console.error('❌ [CATCH] Error al guardar conductor:', error);
    setSubmitError('Error al guardar el conductor');
  } finally {
    setLoading(false);
  }
};

  // ================================
  // CLEANUP EFFECT
  // ================================
  useEffect(() => {
    return () => {
      if (fotoPreview) {
        URL.revokeObjectURL(fotoPreview);
      }
    };
  }, [fotoPreview]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl mx-4 max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {conductor ? '✏️ Editar Conductor NEMT' : '🆕 Nuevo Conductor NEMT'}
          </h2>
          <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Error general */}
        {submitError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mx-4 mt-4 rounded">
            ⚠️ {submitError}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b">
          <div className="flex overflow-x-auto">
            {TABS_CONDUCTORES.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={16} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {/* Tab 1: Información Personal */}
          {activeTab === 1 && (
            <div className="space-y-6">
              <h3 className="flex items-center text-lg font-semibold text-blue-600 mb-4">
                <User className="w-5 h-5 mr-2" />
                📋 Información Personal
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">DNI *</label>
                  <input
                    type="text"
                    value={formData.dni}
                    onChange={(e) => handleInputChange('dni', e.target.value)}
                    className={`w-full p-3 border rounded-lg ${errors.dni ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="12345678"
                    maxLength={8}
                  />
                  {errors.dni && <span className="text-red-500 text-sm mt-1 block">{errors.dni}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    value={formData.nombreCompleto}
                    onChange={(e) => handleInputChange('nombreCompleto', e.target.value)}
                    className={`w-full p-3 border rounded-lg ${errors.nombreCompleto ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Juan Pérez García"
                  />
                  {errors.nombreCompleto && <span className="text-red-500 text-sm mt-1 block">{errors.nombreCompleto}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={formData.fechaNacimiento}
                    onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Sexo</label>
                  <select
                    value={formData.sexo}
                    onChange={(e) => handleInputChange('sexo', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Masculino">👨 Masculino</option>
                    <option value="Femenino">👩 Femenino</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full p-3 border rounded-lg ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="conductor@ejemplo.com"
                  />
                  {errors.email && <span className="text-red-500 text-sm mt-1 block">{errors.email}</span>}
                </div>
              </div>

              {/* Foto del Conductor */}
              <div>
                <label className="block text-sm font-medium mb-2">📷 Foto del Conductor</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFotoChange} 
                    className="hidden" 
                    ref={fotoInputRef} 
                  />
                  
                  {fotoPreview ? (
                    <div className="space-y-3">
                      <img 
                        src={fotoPreview} 
                        alt="Preview del conductor" 
                        className="w-32 h-32 object-cover rounded-lg border mx-auto"
                      />
                      <p className="text-sm text-green-600 font-medium">{selectedFoto?.name}</p>
                      <div className="flex justify-center space-x-2">
                        <button
                          type="button"
                          onClick={triggerFotoUpload}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          🔄 Cambiar
                        </button>
                        <button
                          type="button"
                          onClick={removeFoto}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      onClick={triggerFotoUpload} 
                      className="flex flex-col items-center space-y-2 w-full p-4 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <Camera className="w-12 h-12 text-gray-400" />
                      <p className="text-sm text-gray-600 font-medium">Subir foto del conductor</p>
                      <p className="text-xs text-gray-500">PNG, JPG, WEBP hasta 1024KB</p>
                    </button>
                  )}
                  {errors.foto && <span className="text-red-500 text-sm mt-2 block">{errors.foto}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Dirección y GPS */}
          {activeTab === 2 && (
            <div className="space-y-6">
              <h3 className="flex items-center text-lg font-semibold text-blue-600 mb-4">
                <MapPin className="w-5 h-5 mr-2" />
                🗺️ Dirección y GPS
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Dirección Completa *</label>
                  <input
                    type="text"
                    value={formData.direccionCompleta}
                    onChange={(e) => handleInputChange('direccionCompleta', e.target.value)}
                    className={`w-full p-3 border rounded-lg ${errors.direccionCompleta ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Av. Javier Prado 1234, San Isidro"
                  />
                  {errors.direccionCompleta && <span className="text-red-500 text-sm mt-1 block">{errors.direccionCompleta}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Distrito *</label>
                  <select
                    value={formData.distrito_nombre || ''}
                    onChange={(e) => handleDistritoChange(e.target.value)}
                    className={`w-full p-3 border rounded-lg ${errors.distrito_id ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="">🏘️ Seleccionar distrito</option>
                    {DISTRITOS_LIMA.map((distrito) => (
                      <option key={distrito} value={distrito}>
                        {distrito}
                      </option>
                    ))}
                  </select>
                  {errors.distrito_id && <span className="text-red-500 text-sm mt-1 block">{errors.distrito_id}</span>}
                </div>

                <div className="border border-green-300 bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-green-700">📍 Auto-detectar Ubicación por GPS</span>
                    <button
                      type="button"
                      onClick={detectarGPS}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      🎯 Detectar GPS
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Latitud</label>
                      <input
                        type="number"
                        value={formData.latitud || ''}
                        onChange={(e) => handleInputChange('latitud', parseFloat(e.target.value) || undefined)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="-12.0464"
                        step="any"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Longitud</label>
                      <input
                        type="number"
                        value={formData.longitud || ''}
                        onChange={(e) => handleInputChange('longitud', parseFloat(e.target.value) || undefined)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="-77.0428"
                        step="any"
                        readOnly
                      />
                    </div>
                  </div>
                  {errors.gps && <span className="text-red-500 text-sm mt-2 block">{errors.gps}</span>}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Contacto */}
          {activeTab === 3 && (
            <div className="space-y-6">
              <h3 className="flex items-center text-lg font-semibold text-blue-600 mb-4">
                <Phone className="w-5 h-5 mr-2" />
                📞 Información de Contacto
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Celular Principal *</label>
                  <input
                    type="tel"
                    value={formData.celular1}
                    onChange={(e) => handleInputChange('celular1', e.target.value)}
                    className={`w-full p-3 border rounded-lg ${errors.celular1 ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="987654321"
                    maxLength={9}
                  />
                  {errors.celular1 && <span className="text-red-500 text-sm mt-1 block">{errors.celular1}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Celular Secundario</label>
                  <input
                    type="tel"
                    value={formData.celular2}
                    onChange={(e) => handleInputChange('celular2', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="912345678"
                    maxLength={9}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Teléfono Emergencia</label>
                  <input
                    type="tel"
                    value={formData.telefonoEmergencia}
                    onChange={(e) => handleInputChange('telefonoEmergencia', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="998877665"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Contacto de Emergencia</label>
                  <input
                    type="text"
                    value={formData.contactoEmergencia}
                    onChange={(e) => handleInputChange('contactoEmergencia', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="María Pérez (esposa)"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Licencia de Conducir */}
          {activeTab === 4 && (
            <div className="space-y-6">
              <h3 className="flex items-center text-lg font-semibold text-blue-600 mb-4">
                <CreditCard className="w-5 h-5 mr-2" />
                🪪 Licencia de Conducir
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Número de Licencia *</label>
                  <input
                    type="text"
                    value={formData.numeroBrevete}
                    onChange={(e) => handleInputChange('numeroBrevete', e.target.value)}
                    className={`w-full p-3 border rounded-lg ${errors.numeroBrevete ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="A12345678"
                  />
                  {errors.numeroBrevete && <span className="text-red-500 text-sm mt-1 block">{errors.numeroBrevete}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Categoría de Licencia</label>
                  <select
                    value={formData.licenciaCategoria}
                    onChange={(e) => handleInputChange('licenciaCategoria', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="A1">A1 - Motocicletas 🏍️</option>
                    <option value="A2a">A2a - Mototaxis 🛺</option>
                    <option value="A2b">A2b - Automóviles 🚗</option>
                    <option value="A3a">A3a - Camionetas 🚙</option>
                    <option value="A3b">A3b - Buses 🚌</option>
                    <option value="A3c">A3c - Camiones 🚛</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    value={formData.fechaVencimientoBrevete}
                    onChange={(e) => handleInputChange('fechaVencimientoBrevete', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.certificacionMedica}
                      onChange={(e) => handleInputChange('certificacionMedica', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Certificación Médica Vigente</span>
                  </label>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.antecedentesPenales}
                      onChange={(e) => handleInputChange('antecedentesPenales', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">Antecedentes Penales Limpios</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Vehículo */}
          {activeTab === 5 && (
            <div className="space-y-6">
              <h3 className="flex items-center text-lg font-semibold text-blue-600 mb-4">
                <Car className="w-5 h-5 mr-2" />
                🚗 Información del Vehículo
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Placa del Vehículo</label>
                  <input
                    type="text"
                    value={formData.placaVehiculo}
                    onChange={(e) => handleInputChange('placaVehiculo', e.target.value.toUpperCase())}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ABC-123"
                    maxLength={7}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Marca del Vehículo</label>
                  <input
                    type="text"
                    value={formData.marcaAuto}
                    onChange={(e) => handleInputChange('marcaAuto', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Toyota"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Modelo del Vehículo</label>
                  <input
                    type="text"
                    value={formData.modeloAuto}
                    onChange={(e) => handleInputChange('modeloAuto', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Corolla"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Año del Vehículo</label>
                  <input
                    type="number"
                    value={formData.añoAuto || ''}
                    onChange={(e) => handleInputChange('añoAuto', parseInt(e.target.value) || undefined)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2020"
                    min="2000"
                    max="2025"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Color del Vehículo</label>
                  <input
                    type="text"
                    value={formData.colorAuto}
                    onChange={(e) => handleInputChange('colorAuto', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Blanco"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">SOAT Vencimiento</label>
                  <input
                    type="date"
                    value={formData.soatVencimiento}
                    onChange={(e) => handleInputChange('soatVencimiento', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Control y Estado */}
          {activeTab === 6 && (
            <div className="space-y-6">
              <h3 className="flex items-center text-lg font-semibold text-blue-600 mb-4">
                <Shield className="w-5 h-5 mr-2" />
                ⚖️ Control y Estado NEMT
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Estado del Conductor</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ACTIVO">✅ Activo</option>
                    <option value="INACTIVO">🟡 Inactivo</option>
                    <option value="SUSPENDIDO">❌ Suspendido</option>
                    <option value="PENDIENTE">⏳ Pendiente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Puntos de Licencia</label>
                  <input
                    type="number"
                    value={formData.puntosLicencia}
                    onChange={(e) => handleInputChange('puntosLicencia', parseInt(e.target.value) || 0)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="20"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Servicios NEMT Autorizados</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {SERVICIOS_NEMT.map((servicio) => (
                      <label key={servicio.id} className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.servicios.includes(servicio.id)}
                          onChange={(e) => {
                            const servicios = e.target.checked 
                              ? [...formData.servicios, servicio.id]
                              : formData.servicios.filter(s => s !== servicio.id);
                            handleInputChange('servicios', servicios);
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm">
                          {servicio.icon} {servicio.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            ❌ Cancelar
          </button>
          
          <div className="text-sm text-gray-500">
            Tab {activeTab} de {TABS_CONDUCTORES.length} • {conductor ? 'Editando' : 'Creando'} conductor
          </div>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>🔄 Guardando...</>
            ) : conductor ? (
              <>✅ Actualizar Conductor</>
            ) : (
              <>🆕 Crear Conductor</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConductorModalNEMT;