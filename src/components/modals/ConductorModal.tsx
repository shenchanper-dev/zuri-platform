"use client";
import { useState, useEffect } from 'react';
import { MapPin, Camera, User } from 'lucide-react';

interface ConductorModalProps {
  conductor: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  distritos: any[];
}

export default function ConductorModal({ conductor, isOpen, onClose, onSave, distritos }: ConductorModalProps) {
  // Estado completo del formulario
  const [formData, setFormData] = useState({
    // Información Personal
    dni: '',
    nombres: '',
    apellidos: '',
    fechaNacimiento: '',
    estadoCivil: 'SOLTERO',
    numeroHijos: 0,
    
    // Contacto
    celular1: '',
    celular2: '',
    email: '',
    domicilio: '',
    nombreContacto: '',
    celularContacto: '',
    
    // Vehículo
    numeroBrevete: '',
    marcaAuto: '',
    modelo: '',
    numeroPlaca: '',
    propietario: 'PROPIO',
    
    // Información Adicional
    estado: 'ACTIVO',
    estadoServicio: 'DISPONIBLE',
    distrito: '',
    latitud: -12.0464,
    longitud: -77.0428,
    observaciones: '',
    fotoUrl: ''
  });

  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Cargar datos del conductor cuando el modal se abre - CORREGIDO
  useEffect(() => {
    if (isOpen && conductor) {
      console.log('Cargando datos del conductor:', conductor);
      setFormData({
        dni: conductor.dni || '',
        nombres: conductor.nombres || '',
        apellidos: conductor.apellidos || '',
        fechaNacimiento: conductor.fechaNacimiento || '',
        estadoCivil: conductor.estadoCivil || 'SOLTERO',
        numeroHijos: conductor.numeroHijos || 0,
        celular1: conductor.celular1 || '',
        celular2: conductor.celular2 || '',
        email: conductor.email || '',
        domicilio: conductor.domicilio || '',
        nombreContacto: conductor.nombreContacto || '',
        celularContacto: conductor.celularContacto || '',
        numeroBrevete: conductor.numeroBrevete || '',
        marcaAuto: conductor.marcaAuto || '',
        modelo: conductor.modelo || '',
        numeroPlaca: conductor.numeroPlaca || '',
        propietario: conductor.propietario || 'PROPIO',
        estado: conductor.estado || 'ACTIVO',
        estadoServicio: conductor.estadoServicio || 'DISPONIBLE',
        distrito: conductor.distrito || '',
        latitud: conductor.latitud || -12.0464,
        longitud: conductor.longitud || -77.0428,
        observaciones: conductor.observaciones || '',
        fotoUrl: conductor.fotoUrl || ''
      });
      
      if (conductor.fotoUrl) {
        setImagePreview(conductor.fotoUrl);
      }
    } else if (isOpen) {
      // Reset para nuevo conductor
      setFormData({
        dni: '',
        nombres: '',
        apellidos: '',
        fechaNacimiento: '',
        estadoCivil: 'SOLTERO',
        numeroHijos: 0,
        celular1: '',
        celular2: '',
        email: '',
        domicilio: '',
        nombreContacto: '',
        celularContacto: '',
        numeroBrevete: '',
        marcaAuto: '',
        modelo: '',
        numeroPlaca: '',
        propietario: 'PROPIO',
        estado: 'ACTIVO',
        estadoServicio: 'DISPONIBLE',
        distrito: '',
        latitud: -12.0464,
        longitud: -77.0428,
        observaciones: '',
        fotoUrl: ''
      });
      setImagePreview(null);
    }
  }, [isOpen, conductor]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        handleInputChange('fotoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const obtenerUbicacionActual = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitud: position.coords.latitude,
            longitud: position.coords.longitude
          }));
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
          alert('Error al obtener la ubicación');
        }
      );
    } else {
      alert('La geolocalización no es soportada por este navegador');
    }
  };

  const validarFormulario = () => {
    const { dni, nombres, apellidos, celular1, numeroBrevete } = formData;

    if (!dni.trim()) {
      alert('El DNI es requerido');
      return false;
    }
    if (!nombres.trim()) {
      alert('Los nombres son requeridos');
      return false;
    }
    if (!apellidos.trim()) {
      alert('Los apellidos son requeridos');
      return false;
    }
    if (!celular1.trim()) {
      alert('El celular principal es requerido');
      return false;
    }
    if (!numeroBrevete.trim()) {
      alert('El número de brevete es requerido');
      return false;
    }
    if (dni.length !== 8) {
      alert('El DNI debe tener 8 dígitos');
      return false;
    }
    if (celular1.length !== 9) {
      alert('El celular debe tener 9 dígitos');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validarFormulario()) {
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error guardando conductor:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-green-600 text-white p-4 rounded-t-lg flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {conductor ? 'Editar Conductor' : 'Nuevo Conductor'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs de Navegación */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {['general', 'vehiculo', 'horarios', 'evaluaciones'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-6 text-sm font-medium border-b-2 ${
                  activeTab === tab
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'general' && 'General'}
                {tab === 'vehiculo' && 'Vehículo'}
                {tab === 'horarios' && 'Horarios'}
                {tab === 'evaluaciones' && 'Evaluaciones'}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* TAB GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Foto de Perfil */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-24 h-24 rounded-full object-cover border-4 border-green-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-green-200 flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <label htmlFor="foto-upload" className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full cursor-pointer">
                    <Camera className="w-4 h-4" />
                    <input
                      id="foto-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Foto de Perfil</h3>
                  <p className="text-sm text-gray-600">Suba una foto para el perfil del conductor</p>
                </div>
              </div>

              {/* Información Personal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DNI *
                  </label>
                  <input
                    type="text"
                    value={formData.dni}
                    onChange={(e) => handleInputChange('dni', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    maxLength={8}
                    placeholder="Ingrese DNI"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    value={formData.nombres}
                    onChange={(e) => handleInputChange('nombres', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ingrese nombres"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    value={formData.apellidos}
                    onChange={(e) => handleInputChange('apellidos', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ingrese apellidos"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={formData.fechaNacimiento}
                    onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado Civil
                  </label>
                  <select
                    value={formData.estadoCivil}
                    onChange={(e) => handleInputChange('estadoCivil', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="SOLTERO">Soltero</option>
                    <option value="CASADO">Casado</option>
                    <option value="VIUDO">Viudo</option>
                    <option value="DIVORCIADO">Divorciado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Hijos
                  </label>
                  <input
                    type="number"
                    value={formData.numeroHijos}
                    onChange={(e) => handleInputChange('numeroHijos', parseInt(e.target.value) || 0)}
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Información de Contacto */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Información de Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Celular Principal *
                    </label>
                    <input
                      type="text"
                      value={formData.celular1}
                      onChange={(e) => handleInputChange('celular1', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      maxLength={9}
                      placeholder="Ingrese celular"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Celular Secundario
                    </label>
                    <input
                      type="text"
                      value={formData.celular2}
                      onChange={(e) => handleInputChange('celular2', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      maxLength={9}
                      placeholder="Celular opcional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Ingrese email"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Domicilio
                    </label>
                    <input
                      type="text"
                      value={formData.domicilio}
                      onChange={(e) => handleInputChange('domicilio', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Ingrese domicilio"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contacto de Emergencia
                    </label>
                    <input
                      type="text"
                      value={formData.nombreContacto}
                      onChange={(e) => handleInputChange('nombreContacto', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Nombre de contacto"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Celular de Emergencia
                    </label>
                    <input
                      type="text"
                      value={formData.celularContacto}
                      onChange={(e) => handleInputChange('celularContacto', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      maxLength={9}
                      placeholder="Celular de emergencia"
                    />
                  </div>
                </div>
              </div>

              {/* Información de Ubicación */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Ubicación y Estado</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Distrito
                    </label>
                    <select
                      value={formData.distrito}
                      onChange={(e) => handleInputChange('distrito', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar distrito</option>
                      {distritos.map((distrito) => (
                        <option key={distrito.id} value={distrito.nombre}>
                          {distrito.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={formData.estado}
                      onChange={(e) => handleInputChange('estado', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="ACTIVO">Activo</option>
                      <option value="INACTIVO">Inactivo</option>
                      <option value="SUSPENDIDO">Suspendido</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado de Servicio
                    </label>
                    <select
                      value={formData.estadoServicio}
                      onChange={(e) => handleInputChange('estadoServicio', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="DISPONIBLE">Disponible</option>
                      <option value="OCUPADO">Ocupado</option>
                      <option value="DESCANSO">En Descanso</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Coordenadas GPS
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.latitud}
                        onChange={(e) => handleInputChange('latitud', parseFloat(e.target.value))}
                        placeholder="Latitud"
                        step="any"
                        className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        value={formData.longitud}
                        onChange={(e) => handleInputChange('longitud', parseFloat(e.target.value))}
                        placeholder="Longitud"
                        step="any"
                        className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={obtenerUbicacionActual}
                        className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                        title="Obtener ubicación actual"
                      >
                        <MapPin className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => handleInputChange('observaciones', e.target.value)}
                  placeholder="Observaciones adicionales"
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* TAB VEHÍCULO */}
          {activeTab === 'vehiculo' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Brevete *
                  </label>
                  <input
                    type="text"
                    value={formData.numeroBrevete}
                    onChange={(e) => handleInputChange('numeroBrevete', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Número de licencia"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marca del Auto
                  </label>
                  <input
                    type="text"
                    value={formData.marcaAuto}
                    onChange={(e) => handleInputChange('marcaAuto', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Marca del vehículo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={formData.modelo}
                    onChange={(e) => handleInputChange('modelo', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Modelo del vehículo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Placa
                  </label>
                  <input
                    type="text"
                    value={formData.numeroPlaca}
                    onChange={(e) => handleInputChange('numeroPlaca', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Placa del vehículo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Propietario del Vehículo
                  </label>
                  <select
                    value={formData.propietario}
                    onChange={(e) => handleInputChange('propietario', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="PROPIO">Propio</option>
                    <option value="ALQUILADO">Alquilado</option>
                    <option value="EMPRESA">Empresa</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB HORARIOS */}
          {activeTab === 'horarios' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Turno Preferido
                  </label>
                  <select className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="VARIADO">Variado</option>
                    <option value="MAÑANA">Mañana</option>
                    <option value="TARDE">Tarde</option>
                    <option value="NOCHE">Noche</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horario Inicio
                  </label>
                  <input
                    type="time"
                    defaultValue="06:00"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horario Fin
                  </label>
                  <input
                    type="time"
                    defaultValue="22:00"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="feriados" className="rounded" />
                  <label htmlFor="feriados" className="text-sm text-gray-700">
                    Disponible feriados
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="fines_semana" className="rounded" defaultChecked />
                  <label htmlFor="fines_semana" className="text-sm text-gray-700">
                    Fines de semana
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="emergencias" className="rounded" />
                  <label htmlFor="emergencias" className="text-sm text-gray-700">
                    Emergencias
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB EVALUACIONES */}
          {activeTab === 'evaluaciones' && (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <User className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Evaluaciones de Calidad
              </h3>
              <p className="text-gray-500">
                No hay evaluaciones registradas
              </p>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                conductor ? 'Actualizar' : 'Crear Conductor'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}