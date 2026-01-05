"use client";
import { useState, useEffect } from 'react';
import ExportActions from '@/components/shared/export/ExportActions';

interface ClinicaModalProps {
  clinica: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  distritos: any[];
}

export default function ClinicaModal({ clinica, isOpen, onClose, onSave, distritos }: ClinicaModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'CLINICA_PRIVADA',
    direccion: '',
    distrito: '',
    latitud: -12.0464,
    longitud: -77.0428,
    telefono: '',
    email: '',
    contacto: '',
    estado: 'ACTIVA',
    servicios24h: false,
    emergencia: false,
    uci: false,
    laboratorio: false,
    farmacia: false,
    radiologia: false,
    ambulancia: false,
    bancoSangre: false,
    dialisis: false,
    segurosAceptados: '',
    numeroConsultorios: 0,
    numeroCamas: 0,
    ascensor: false,
    estacionamiento: false,
    rampasAcceso: false
  });

  const [sectionsOpen, setSectionsOpen] = useState({
    basica: true,
    servicios: true,
    infraestructura: false,
    adicional: false
  });

  const [loading, setLoading] = useState(false);
  const [detectandoDistrito, setDetectandoDistrito] = useState(false);

  useEffect(() => {
    if (clinica) {
      setFormData({
        nombre: clinica.nombre || '',
        tipo: clinica.tipo || 'CLINICA_PRIVADA',
        direccion: clinica.direccion || '',
        distrito: clinica.distrito || '',
        latitud: clinica.latitud || -12.0464,
        longitud: clinica.longitud || -77.0428,
        telefono: clinica.telefono || '',
        email: clinica.email || '',
        contacto: clinica.contacto || '',
        estado: clinica.estado || 'ACTIVA',
        servicios24h: clinica.servicios24h || false,
        emergencia: clinica.emergencia || false,
        uci: clinica.uci || false,
        laboratorio: clinica.laboratorio || false,
        farmacia: clinica.farmacia || false,
        radiologia: clinica.radiologia || false,
        ambulancia: clinica.ambulancia || false,
        bancoSangre: clinica.bancoSangre || false,
        dialisis: clinica.dialisis || false,
        segurosAceptados: clinica.segurosAceptados || '',
        numeroConsultorios: clinica.numeroConsultorios || 0,
        numeroCamas: clinica.numeroCamas || 0,
        ascensor: clinica.ascensor || false,
        estacionamiento: clinica.estacionamiento || false,
        rampasAcceso: clinica.rampasAcceso || false
      });
    } else {
      setFormData({
        nombre: '',
        tipo: 'CLINICA_PRIVADA',
        direccion: '',
        distrito: '',
        latitud: -12.0464,
        longitud: -77.0428,
        telefono: '',
        email: '',
        contacto: '',
        estado: 'ACTIVA',
        servicios24h: false,
        emergencia: false,
        uci: false,
        laboratorio: false,
        farmacia: false,
        radiologia: false,
        ambulancia: false,
        bancoSangre: false,
        dialisis: false,
        segurosAceptados: '',
        numeroConsultorios: 0,
        numeroCamas: 0,
        ascensor: false,
        estacionamiento: false,
        rampasAcceso: false
      });
    }
  }, [clinica]);

  const detectarDistrito = async () => {
    if (!formData.latitud || !formData.longitud) {
      alert('Por favor ingresa coordenadas válidas primero');
      return;
    }

    setDetectandoDistrito(true);
    try {
      const response = await fetch('/api/distritos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitud: formData.latitud, longitud: formData.longitud })
      });
      const data = await response.json();
      
      if (data.distrito) {
        setFormData(prev => ({ ...prev, distrito: data.distrito.nombre }));
        alert(`✅ Distrito detectado: ${data.distrito.nombre}`);
      } else {
        alert('No se pudo detectar el distrito. Por favor selecciónalo manualmente.');
      }
    } catch (error) {
      console.error('Error detectando distrito:', error);
      alert('Error al detectar distrito');
    } finally {
      setDetectandoDistrito(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error guardando clínica:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!isOpen) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 1000 
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        width: '90%', 
        maxWidth: '800px', 
        maxHeight: '90vh', 
        overflow: 'auto', 
        padding: '20px' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            {clinica ? 'Editar Clínica' : 'Nueva Clínica'}
          </h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '24px', 
              cursor: 'pointer', 
              color: '#666' 
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* SECCIÓN: Información Básica */}
          <div style={{ marginBottom: '20px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => toggleSection('basica')}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#f9fafb',
                borderBottom: sectionsOpen.basica ? '1px solid #e5e7eb' : 'none',
                border: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              📋 Información Básica
              <span>{sectionsOpen.basica ? '▼' : '▶'}</span>
            </button>
            
            {sectionsOpen.basica && (
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      style={{ 
                        width: '100%', 
                        padding: '8px 12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '4px' 
                      }}
                      required
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                      Tipo
                    </label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                      style={{ 
                        width: '100%', 
                        padding: '8px 12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '4px' 
                      }}
                    >
                      <option value="CLINICA_PRIVADA">Clínica Privada</option>
                      <option value="HOSPITAL_PUBLICO">Hospital Público</option>
                      <option value="HOSPITAL_PRIVADO">Hospital Privado</option>
                      <option value="HOSPITAL_ESSALUD">Hospital EsSalud</option>
                      <option value="HOSPITAL_MINSA">Hospital MINSA</option>
                      <option value="CENTRO_SALUD">Centro de Salud</option>
                      <option value="POSTA_MEDICA">Posta Médica</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                    Dirección *
                  </label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                    style={{ 
                      width: '100%', 
                      padding: '8px 12px', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '4px' 
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                      Distrito
                    </label>
                    <select
                      value={formData.distrito}
                      onChange={(e) => setFormData({...formData, distrito: e.target.value})}
                      style={{ 
                        width: '100%', 
                        padding: '8px 12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '4px' 
                      }}
                    >
                      <option value="">Seleccionar distrito</option>
                      {distritos && distritos.length > 0 ? (
                        distritos.map((d) => (
                          <option key={d.id} value={d.nombre}>
                            {d.nombre} ({d.provincia})
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>No hay distritos cargados</option>
                      )}
                    </select>
                    <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                      {distritos?.length || 0} distritos disponibles
                    </p>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                      Latitud
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.latitud}
                      onChange={(e) => setFormData({...formData, latitud: parseFloat(e.target.value) || 0})}
                      style={{ 
                        width: '100%', 
                        padding: '8px 12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '4px' 
                      }}
                      placeholder="-12.0464"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                      Longitud
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={formData.longitud}
                      onChange={(e) => setFormData({...formData, longitud: parseFloat(e.target.value) || 0})}
                      style={{ 
                        width: '100%', 
                        padding: '8px 12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '4px' 
                      }}
                      placeholder="-77.0428"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <button
                    type="button"
                    onClick={detectarDistrito}
                    disabled={detectandoDistrito}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: detectandoDistrito ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      opacity: detectandoDistrito ? 0.6 : 1
                    }}
                  >
                    {detectandoDistrito ? '🔍 Detectando...' : '📍 Auto-detectar Distrito por GPS'}
                  </button>
                  <span style={{ marginLeft: '8px', fontSize: '12px', color: '#6b7280' }}>
                    (Opcional: detecta el distrito más cercano según coordenadas)
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                      style={{ 
                        width: '100%', 
                        padding: '8px 12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '4px' 
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      style={{ 
                        width: '100%', 
                        padding: '8px 12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '4px' 
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                      Estado
                    </label>
                    <select
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      style={{ 
                        width: '100%', 
                        padding: '8px 12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '4px' 
                      }}
                    >
                      <option value="ACTIVA">Activa</option>
                      <option value="INACTIVA">Inactiva</option>
                      <option value="MANTENIMIENTO">Mantenimiento</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN: Servicios Médicos */}
          <div style={{ marginBottom: '20px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => toggleSection('servicios')}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#f9fafb',
                borderBottom: sectionsOpen.servicios ? '1px solid #e5e7eb' : 'none',
                border: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🏥 Servicios Médicos
              <span>{sectionsOpen.servicios ? '▼' : '▶'}</span>
            </button>
            
            {sectionsOpen.servicios && (
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {[
                    { key: 'emergencia', label: '🚨 Emergencias' },
                    { key: 'servicios24h', label: '🕐 Atención 24H' },
                    { key: 'uci', label: '🏥 UCI' },
                    { key: 'laboratorio', label: '🔬 Laboratorio' },
                    { key: 'farmacia', label: '💊 Farmacia' },
                    { key: 'radiologia', label: '📷 Radiología' },
                    { key: 'ambulancia', label: '🚑 Ambulancia' },
                    { key: 'bancoSangre', label: '🩸 Banco de Sangre' },
                    { key: 'dialisis', label: '💧 Diálisis' }
                  ].map(service => (
                    <label key={service.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={formData[service.key as keyof typeof formData] as boolean}
                        onChange={(e) => setFormData({...formData, [service.key]: e.target.checked})}
                      />
                      <span>{service.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN: Infraestructura */}
          <div style={{ marginBottom: '20px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => toggleSection('infraestructura')}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#f9fafb',
                borderBottom: sectionsOpen.infraestructura ? '1px solid #e5e7eb' : 'none',
                border: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🏢 Infraestructura y Capacidad
              <span>{sectionsOpen.infraestructura ? '▼' : '▶'}</span>
            </button>
            
            {sectionsOpen.infraestructura && (
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                      Número de Consultorios
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.numeroConsultorios}
                      onChange={(e) => setFormData({...formData, numeroConsultorios: parseInt(e.target.value) || 0})}
                      style={{ 
                        width: '100%', 
                        padding: '8px 12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '4px' 
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                      Número de Camas
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.numeroCamas}
                      onChange={(e) => setFormData({...formData, numeroCamas: parseInt(e.target.value) || 0})}
                      style={{ 
                        width: '100%', 
                        padding: '8px 12px', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '4px' 
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {[
                    { key: 'ascensor', label: '🛗 Ascensor' },
                    { key: 'estacionamiento', label: '🚗 Estacionamiento' },
                    { key: 'rampasAcceso', label: '♿ Rampas de Acceso' }
                  ].map(feature => (
                    <label key={feature.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        checked={formData[feature.key as keyof typeof formData] as boolean}
                        onChange={(e) => setFormData({...formData, [feature.key]: e.target.checked})}
                      />
                      <span>{feature.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN: Información Adicional */}
          <div style={{ marginBottom: '20px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => toggleSection('adicional')}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#f9fafb',
                borderBottom: sectionsOpen.adicional ? '1px solid #e5e7eb' : 'none',
                border: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              📝 Información Adicional
              <span>{sectionsOpen.adicional ? '▼' : '▶'}</span>
            </button>
            
            {sectionsOpen.adicional && (
              <div style={{ padding: '16px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                    Persona de Contacto
                  </label>
                  <input
                    type="text"
                    value={formData.contacto}
                    onChange={(e) => setFormData({...formData, contacto: e.target.value})}
                    style={{ 
                      width: '100%', 
                      padding: '8px 12px', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '4px' 
                    }}
                    placeholder="Nombre del responsable o persona de contacto"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                    Seguros Aceptados
                  </label>
                  <input
                    type="text"
                    value={formData.segurosAceptados}
                    onChange={(e) => setFormData({...formData, segurosAceptados: e.target.value})}
                    style={{ 
                      width: '100%', 
                      padding: '8px 12px', 
                      border: '1px solid #d1d5db', 
                      borderRadius: '4px' 
                    }}
                    placeholder="Ej: SIS, EsSalud, Particular, Rimac, Pacífico"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          paddingTop: '20px',
          borderTop: '1px solid #e5e7eb'
        }}>
          {/* Botones de Exportación - Solo en modo edición */}
          {clinica && (
            <ExportActions
              config={{
                moduleName: `Clinica_${formData.nombre?.replace(/\s+/g, '_')}`,
                title: formData.nombre || 'Clínica',
                data: [],
                columns: [],
                singleItem: {
                  title: `${formData.nombre || 'Clínica'} - Ficha Completa`,
                  fields: [
                    { label: 'Nombre', value: formData.nombre },
                    { label: 'Tipo', value: formData.tipo?.replace('_', ' ') },
                    { label: 'Dirección', value: formData.direccion },
                    { label: 'Distrito', value: formData.distrito },
                    { label: 'Teléfono', value: formData.telefono },
                    { label: 'Email', value: formData.email },
                    { label: 'Contacto', value: formData.contacto },
                    { label: 'Estado', value: formData.estado },
                    { label: 'Servicios 24H', value: formData.servicios24h ? 'Sí' : 'No' },
                    { label: 'Emergencia', value: formData.emergencia ? 'Sí' : 'No' },
                    { label: 'UCI', value: formData.uci ? 'Sí' : 'No' },
                    { label: 'Laboratorio', value: formData.laboratorio ? 'Sí' : 'No' },
                    { label: 'Farmacia', value: formData.farmacia ? 'Sí' : 'No' },
                    { label: 'Radiología', value: formData.radiologia ? 'Sí' : 'No' },
                    { label: 'Ambulancia', value: formData.ambulancia ? 'Sí' : 'No' },
                    { label: 'Banco de Sangre', value: formData.bancoSangre ? 'Sí' : 'No' },
                    { label: 'Diálisis', value: formData.dialisis ? 'Sí' : 'No' },
                    { label: 'Seguros Aceptados', value: formData.segurosAceptados },
                    { label: 'Nro. Consultorios', value: String(formData.numeroConsultorios || 0) },
                    { label: 'Nro. Camas', value: String(formData.numeroCamas || 0) },
                    { label: 'Ascensor', value: formData.ascensor ? 'Sí' : 'No' },
                    { label: 'Estacionamiento', value: formData.estacionamiento ? 'Sí' : 'No' },
                    { label: 'Rampas de Acceso', value: formData.rampasAcceso ? 'Sí' : 'No' }
                  ].filter(f => f.value !== undefined && f.value !== null)
                }
              }}
              variant="compact"
            />
          )}

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
        </form>
      </div>
    </div>
  );
}