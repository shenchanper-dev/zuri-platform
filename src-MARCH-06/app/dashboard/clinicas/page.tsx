"use client";
import ResponsiveTable from '@/components/shared/ResponsiveTable';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useState, useEffect } from 'react';
import ExportActions from '@/components/shared/export/ExportActions';
import ClinicaModal from '@/components/modals/ClinicaModal';

interface Clinica {
  id: number;
  nombre: string;
  tipo: string;
  direccion: string;
  distrito: string;
  latitud: number;
  longitud: number;
  telefono: string;
  email: string;
  contacto: string;
  estado: string;
  servicios24h: boolean;
  emergencia: boolean;
  uci: boolean;
  segurosAceptados: string;
  numeroConsultorios: number;
  numeroCamas: number;
}

interface Estadisticas {
  total: number;
  activas: number;
  conEmergencia: number;
  atienden24h: number;
  conUci: number;
  porTipo: {
    clinicas: number;
    hospitales: number;
    centros: number;
  };
}

interface Distrito {
  id: number;
  nombre: string;
  provincia: string;
  latitud: number;
  longitud: number;
}

export default function ClinicasPage() {
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const isMobile = useIsMobile();
  const [distritos, setDistritos] = useState<Distrito[]>([]);
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    total: 0,
    activas: 0,
    conEmergencia: 0,
    atienden24h: 0,
    conUci: 0,
    porTipo: { clinicas: 0, hospitales: 0, centros: 0 }
  });
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('Todos');
  const [distritoFilter, setDistritoFilter] = useState('Todos');
  const [selectedClinica, setSelectedClinica] = useState<Clinica | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    fetchClinicas();
    fetchDistritos();
  }, []);

  const fetchClinicas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clinicas');
      const data = await response.json();
      
      if (response.ok) {
        setClinicas(data.clinicas);
        setEstadisticas(data.estadisticas);
      } else {
        console.error('Error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching clinicas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistritos = async () => {
    console.log('🔍 [Frontend] Cargando distritos...');
    try {
      const response = await fetch('/api/distritos');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        console.log(`✅ [Frontend] ${result.data.length} distritos (${result.metadata.lima} Lima, ${result.metadata.callao} Callao)`);
        setDistritos(result.data);
      } else {
        console.error('❌ [Frontend] Formato inválido:', result);
        setDistritos([]);
      }
    } catch (error) {
      console.error('❌ [Frontend] Error:', error);
      setDistritos([]);
    }
  };

  const handleSaveClinica = async (formData: any) => {
    try {
      const url = selectedClinica ? `/api/clinicas/${selectedClinica.id}` : '/api/clinicas';
      const method = selectedClinica ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchClinicas();
        setIsModalOpen(false);
        setSelectedClinica(null);
        alert(selectedClinica ? 'Clínica actualizada exitosamente' : 'Clínica creada exitosamente');
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      alert('Error de conexión');
    }
  };
// Función para editar clínica
  const handleEdit = (clinica: any) => {
    setSelectedClinica(clinica);
    setIsModalOpen(true);
  };

  // Función para eliminar clínica
  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta clínica?')) {
      return;
    }

    try {
      const response = await fetch(`/api/clinicas/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('✅ Clínica eliminada correctamente');
        fetchClinicas();
      } else {
        alert('❌ Error al eliminar la clínica');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al eliminar la clínica');
    }
  };
  const handleDeleteClinica = async (id: number) => {
    if (confirm('¿Está seguro de eliminar esta clínica?')) {
      try {
        const response = await fetch(`/api/clinicas/${id}`, { method: 'DELETE' });
        if (response.ok) {
          await fetchClinicas();
          alert('Clínica eliminada exitosamente');
        } else {
          alert('Error al eliminar la clínica');
        }
      } catch (error) {
        alert('Error de conexión');
      }
    }
  };

  // Filtrar clínicas
  const clinicasFiltradas = clinicas.filter(clinica => {
    const matchesSearch = 
      clinica.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinica.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinica.distrito?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = tipoFilter === 'Todos' || clinica.tipo === tipoFilter;
    const matchesDistrito = distritoFilter === 'Todos' || clinica.distrito === distritoFilter;
    
    return matchesSearch && matchesTipo && matchesDistrito;
  });

  // Obtener distritos únicos de las clínicas
  const distritosUnicos = Array.from(new Set(clinicas.map(c => c.distrito).filter(Boolean)));

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div style={{ fontSize: '18px' }}>Cargando clínicas...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
            Clínicas y Hospitales
          </h1>
          <p style={{ color: '#6b7280', marginTop: '4px' }}>
            Gestiona los establecimientos de salud del sistema
          </p>
        </div>
        <ExportActions
            config={{
              moduleName: 'Clinicas',
              title: 'Listado de Clínicas y Hospitales',
              data: clinicasFiltradas.map(c => ({
                nombre: c.nombre,
                tipo: c.tipo?.replace(/_/g, ' '),
                distrito: c.distrito,
                direccion: c.direccion,
                telefono: c.telefono || '',
                email: c.email || '',
                estado: c.estado
              })),
              columns: [
                { header: 'Nombre', key: 'nombre', width: 30 },
                { header: 'Tipo', key: 'tipo', width: 20 },
                { header: 'Distrito', key: 'distrito', width: 20 },
                { header: 'Dirección', key: 'direccion', width: 35 },
                { header: 'Teléfono', key: 'telefono', width: 15 },
                { header: 'Email', key: 'email', width: 25 },
                { header: 'Estado', key: 'estado', width: 12 }
              ]
            }}
            variant="compact"
          />
        <button
          onClick={() => {
            setSelectedClinica(null);
            setIsModalOpen(true);
          }}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          + Nueva Clínica
        </button>
      </div>

      {/* Estadísticas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>{estadisticas.total}</div>
          <div style={{ color: '#6b7280', fontSize: '14px' }}>Total Clínicas</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{estadisticas.activas}</div>
          <div style={{ color: '#6b7280', fontSize: '14px' }}>Activas</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{estadisticas.conEmergencia}</div>
          <div style={{ color: '#6b7280', fontSize: '14px' }}>Con Emergencia</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>{estadisticas.atienden24h}</div>
          <div style={{ color: '#6b7280', fontSize: '14px' }}>Atención 24H</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{estadisticas.conUci}</div>
          <div style={{ color: '#6b7280', fontSize: '14px' }}>Con UCI</div>
        </div>
      </div>

      {/* Filtros */}
      {/* Filtros */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: isMobile ? '16px' : '20px', 
        borderRadius: '8px', 
        border: '1px solid #e5e7eb', 
        marginBottom: '24px' 
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr', 
          gap: '12px' 
        }}>
          <div>
            <input
              type="text"
              placeholder="Buscar por nombre, dirección o distrito..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div>
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="Todos">Todos los tipos</option>
              <option value="CLINICA_PRIVADA">Clínica Privada</option>
              <option value="HOSPITAL_PUBLICO">Hospital Público</option>
              <option value="HOSPITAL_PRIVADO">Hospital Privado</option>
              <option value="HOSPITAL_ESSALUD">Hospital EsSalud</option>
              <option value="HOSPITAL_MINSA">Hospital MINSA</option>
              <option value="CENTRO_SALUD">Centro de Salud</option>
              <option value="POSTA_MEDICA">Posta Médica</option>
            </select>
          </div>

          <div>
            <select
              value={distritoFilter}
              onChange={(e) => setDistritoFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="Todos">Todos los distritos</option>
              {distritos.map(d => (
                <option key={d.id} value={d.nombre}>{d.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de clínicas */}
      {/* Tabla Responsive */}
      <ResponsiveTable
        columns={[
          { 
            header: 'CLÍNICA/HOSPITAL', 
            key: 'nombre',
            render: (value, row) => (
              <div>
                <div style={{ fontWeight: '600', color: '#1f2937' }}>{row.nombre}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{row.tipo?.replace(/_/g, ' ')}</div>
                <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                  {row.numero_consultorios} consultorios • {row.numero_camas} camas
                </div>
              </div>
            )
          },
          { 
            header: 'UBICACIÓN', 
            key: 'direccion',
            render: (value, row) => (
              <div>
                <div>{row.direccion}</div>
                {row.distrito && (
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    📍 {row.distrito}
                  </div>
                )}
              </div>
            )
          },
          { 
            header: 'CONTACTO', 
            key: 'telefono',
            render: (value, row) => (
              <div style={{ fontSize: '13px' }}>
                {row.telefono && <div>☎ {row.telefono}</div>}
                {row.email && <div style={{ fontSize: '12px', color: '#6b7280' }}>✉ {row.email}</div>}
                {row.contacto && <div style={{ fontSize: '11px', color: '#9ca3af' }}>👤 {row.contacto}</div>}
              </div>
            )
          },
          { 
            header: 'SERVICIOS', 
            key: 'servicios',
            render: (value, row) => (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {row.emergencia && <span style={{ fontSize: '11px', padding: '2px 6px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '4px' }}>🚨 Emergencia</span>}
                {row.servicios_24h && <span style={{ fontSize: '11px', padding: '2px 6px', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '4px' }}>🕐 24H</span>}
                {row.uci && <span style={{ fontSize: '11px', padding: '2px 6px', backgroundColor: '#fce7f3', color: '#9f1239', borderRadius: '4px' }}>🏥 UCI</span>}
              </div>
            )
          },
          { 
            header: 'ESTADO', 
            key: 'estado',
            render: (value) => (
              <span style={{
                padding: '4px 12px',
                backgroundColor: value === 'ACTIVA' ? '#dcfce7' : '#fee2e2',
                color: value === 'ACTIVA' ? '#166534' : '#991b1b',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {value}
              </span>
            )
          },
          { 
            header: 'ACCIONES', 
            key: 'actions',
            render: (value, row) => (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleEdit(row)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => handleDelete(row.id)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🗑️ Eliminar
                </button>
              </div>
            )
          }
        ]}
        data={clinicasFiltradas}
        onEdit={handleEdit}
        onDelete={(row) => handleDelete(row.id)}
        emptyMessage="No se encontraron clínicas"
      />

      {/* Modal */}
      <ClinicaModal
        clinica={selectedClinica}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedClinica(null);
        }}
        onSave={handleSaveClinica}
        distritos={distritos}
      />
    </div>
  );
}
