/**
 * COMPONENTE LISTA DE CONDUCTORES
 * Tabla responsiva con filtros, búsqueda y acciones
 */

import React, { useState } from 'react';
import { 
  Conductor, 
  ConductorListProps, 
  ConductorFilters,
  EstadoConductor,
  TipoServicio,
  SERVICIOS_DISPONIBLES,
  formatPhoneNumber,
  formatDni,
  getInitials
} from '@/domain/entities/Conductor.entity';

export const ConductorList: React.FC<ConductorListProps> = ({
  conductores,
  onEdit,
  onDelete,
  onView
}) => {
  
  const [filters, setFilters] = useState<ConductorFilters>({
    search: '',
    estado: undefined,
    servicios: [],
    marcaAuto: ''
  });
  
  const [sortField, setSortField] = useState<keyof Conductor>('nombres');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedConductores, setSelectedConductores] = useState<number[]>([]);

  // ========================================
  // FILTRADO Y ORDENAMIENTO
  // ========================================

  const filteredConductores = conductores.filter(conductor => {
    // Filtro de búsqueda (nombres, apellidos, DNI, celular)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchFields = [
        conductor.nombres,
        conductor.apellidos,
        conductor.dni,
        conductor.celular1,
        conductor.email
      ].join(' ').toLowerCase();
      
      if (!searchFields.includes(searchTerm)) return false;
    }

    // Filtro de estado
    if (filters.estado && conductor.estado !== filters.estado) {
      return false;
    }

    // Filtro de servicios
    if (filters.servicios && filters.servicios.length > 0) {
      const hasServiceMatch = filters.servicios.some(servicio => 
        conductor.serviciosAsignados?.includes(servicio)
      );
      if (!hasServiceMatch) return false;
    }

    // Filtro de marca de auto
    if (filters.marcaAuto && conductor.marcaAuto !== filters.marcaAuto) {
      return false;
    }

    return true;
  });

  const sortedConductores = [...filteredConductores].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    // Manejar valores undefined/null
    if (aValue === undefined || aValue === null) aValue = '';
    if (bValue === undefined || bValue === null) bValue = '';

    // Convertir a string para comparación
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();

    if (sortDirection === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });

  // ========================================
  // HANDLERS
  // ========================================

  const handleSort = (field: keyof Conductor) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleFilterChange = (key: keyof ConductorFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSelectConductor = (id: number) => {
    setSelectedConductores(prev => 
      prev.includes(id) 
        ? prev.filter(cId => cId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedConductores.length === sortedConductores.length) {
      setSelectedConductores([]);
    } else {
      setSelectedConductores(sortedConductores.map(c => c.id!));
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      estado: undefined,
      servicios: [],
      marcaAuto: ''
    });
  };

  // Obtener marcas únicas para el filtro
  const marcasUnicas = Array.from(new Set(
    conductores
      .map(c => c.marcaAuto)
      .filter(marca => marca && marca.trim() !== '')
  )).sort();

  return (
    <div style={{ padding: '20px' }}>
      
      {/* Header con estadísticas */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1F2937',
            margin: 0,
            marginBottom: '4px'
          }}>
            Conductores
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            margin: 0
          }}>
            {filteredConductores.length} de {conductores.length} conductores
            {selectedConductores.length > 0 && ` (${selectedConductores.length} seleccionados)`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {selectedConductores.length > 0 && (
            <button
              onClick={() => {
                // Aquí iría la lógica para acciones masivas
                console.log('Acciones masivas para:', selectedConductores);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#F59E0B',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Acciones ({selectedConductores.length})
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div style={{
        backgroundColor: '#F9FAFB',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '24px',
        border: '1px solid #E5E7EB'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '16px'
        }}>
          {/* Búsqueda */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Buscar
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Nombre, DNI, celular..."
              autoComplete="off"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          {/* Estado */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Estado
            </label>
            <select
              value={filters.estado || ''}
              onChange={(e) => handleFilterChange('estado', e.target.value || undefined)}
              autoComplete="off"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="">Todos</option>
              <option value={EstadoConductor.ACTIVO}>Activo</option>
              <option value={EstadoConductor.INACTIVO}>Inactivo</option>
            </select>
          </div>

          {/* Marca */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Marca Vehículo
            </label>
            <select
              value={filters.marcaAuto || ''}
              onChange={(e) => handleFilterChange('marcaAuto', e.target.value || undefined)}
              autoComplete="off"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #D1D5DB',
                borderRadius: '4px',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="">Todas</option>
              {marcasUnicas.map(marca => (
                <option key={marca} value={marca}>{marca}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Botones de filtro */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={clearFilters}
            style={{
              padding: '6px 12px',
              backgroundColor: 'white',
              color: '#6B7280',
              border: '1px solid #D1D5DB',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Limpiar filtros
          </button>
          
          <div style={{
            fontSize: '12px',
            color: '#6B7280'
          }}>
            {Object.values(filters).some(v => v && (Array.isArray(v) ? v.length > 0 : true)) && 
              'Filtros activos'
            }
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        {sortedConductores.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center' as const,
            color: '#6B7280'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              No se encontraron conductores
            </div>
            <div style={{ fontSize: '14px' }}>
              {conductores.length === 0 
                ? 'Agrega tu primer conductor para comenzar'
                : 'Intenta ajustar los filtros de búsqueda'
              }
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse' as const
            }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB' }}>
                  <th style={{
                    padding: '12px',
                    textAlign: 'center' as const,
                    borderBottom: '1px solid #E5E7EB',
                    width: '40px'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedConductores.length === sortedConductores.length && sortedConductores.length > 0}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <SortableHeader
                    title="Conductor"
                    field="nombres"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    title="DNI"
                    field="dni"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    title="Contacto"
                    field="celular1"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    title="Estado"
                    field="estado"
                    currentField={sortField}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <th style={{
                    padding: '12px',
                    textAlign: 'left' as const,
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #E5E7EB'
                  }}>
                    Servicios
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left' as const,
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #E5E7EB'
                  }}>
                    Vehículo
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'center' as const,
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#374151',
                    borderBottom: '1px solid #E5E7EB',
                    width: '120px'
                  }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedConductores.map((conductor, index) => (
                  <tr
                    key={conductor.id}
                    style={{
                      backgroundColor: index % 2 === 0 ? 'white' : '#F9FAFB',
                      borderBottom: '1px solid #E5E7EB'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#F9FAFB'}
                  >
                    <td style={{
                      padding: '12px',
                      textAlign: 'center' as const
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedConductores.includes(conductor.id!)}
                        onChange={() => handleSelectConductor(conductor.id!)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    
                    {/* Conductor */}
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Avatar */}
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: conductor.foto ? 'transparent' : '#E5E7EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          flexShrink: 0
                        }}>
                          {conductor.foto ? (
                            <img
                              src={conductor.foto}
                              alt="Avatar"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover' as const
                              }}
                            />
                          ) : (
                            <span style={{
                              fontSize: '14px',
                              fontWeight: 'bold',
                              color: '#6B7280'
                            }}>
                              {getInitials(conductor.nombres, conductor.apellidos)}
                            </span>
                          )}
                        </div>
                        
                        {/* Nombre */}
                        <div>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#1F2937'
                          }}>
                            {conductor.nombres} {conductor.apellidos}
                          </div>
                          {conductor.email && (
                            <div style={{
                              fontSize: '12px',
                              color: '#6B7280'
                            }}>
                              {conductor.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* DNI */}
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151',
                      fontFamily: 'monospace'
                    }}>
                      {formatDni(conductor.dni)}
                    </td>

                    {/* Contacto */}
                    <td style={{ padding: '12px' }}>
                      <div style={{
                        fontSize: '14px',
                        color: '#374151',
                        fontFamily: 'monospace'
                      }}>
                        {formatPhoneNumber(conductor.celular1)}
                      </div>
                      {conductor.celular2 && (
                        <div style={{
                          fontSize: '12px',
                          color: '#6B7280',
                          fontFamily: 'monospace'
                        }}>
                          {formatPhoneNumber(conductor.celular2)}
                        </div>
                      )}
                    </td>

                    {/* Estado */}
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: conductor.estado === EstadoConductor.ACTIVO ? '#D1FAE5' : '#FEE2E2',
                        color: conductor.estado === EstadoConductor.ACTIVO ? '#065F46' : '#991B1B'
                      }}>
                        {conductor.estado === EstadoConductor.ACTIVO ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    {/* Servicios */}
                    <td style={{ padding: '12px' }}>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap' as const,
                        gap: '4px'
                      }}>
                        {conductor.serviciosAsignados?.slice(0, 2).map(servicio => {
                          const servicioInfo = SERVICIOS_DISPONIBLES.find(s => s.value === servicio);
                          return (
                            <span
                              key={servicio}
                              style={{
                                padding: '2px 6px',
                                borderRadius: '8px',
                                fontSize: '10px',
                                fontWeight: '600',
                                backgroundColor: servicioInfo?.color || '#6B7280',
                                color: 'white'
                              }}
                            >
                              {servicioInfo?.label.substring(0, 3) || servicio.substring(0, 3)}
                            </span>
                          );
                        })}
                        {(conductor.serviciosAsignados?.length || 0) > 2 && (
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: '600',
                            backgroundColor: '#6B7280',
                            color: 'white'
                          }}>
                            +{(conductor.serviciosAsignados?.length || 0) - 2}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Vehículo */}
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#374151'
                    }}>
                      {conductor.marcaAuto && conductor.modeloAuto ? (
                        <div>
                          <div>{conductor.marcaAuto} {conductor.modeloAuto}</div>
                          {conductor.numeroPlaca && (
                            <div style={{
                              fontSize: '12px',
                              color: '#6B7280',
                              fontFamily: 'monospace'
                            }}>
                              {conductor.numeroPlaca}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#9CA3AF', fontSize: '12px' }}>
                          Sin registrar
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td style={{
                      padding: '12px',
                      textAlign: 'center' as const
                    }}>
                      <div style={{
                        display: 'flex',
                        gap: '4px',
                        justifyContent: 'center'
                      }}>
                        <button
                          onClick={() => onView(conductor)}
                          title="Ver detalles"
                          style={{
                            padding: '6px',
                            backgroundColor: '#3B82F6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => onEdit(conductor)}
                          title="Editar"
                          style={{
                            padding: '6px',
                            backgroundColor: '#F59E0B',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => onDelete(conductor.id!)}
                          title="Eliminar"
                          style={{
                            padding: '6px',
                            backgroundColor: '#EF4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ========================================
// COMPONENTES AUXILIARES
// ========================================

interface SortableHeaderProps {
  title: string;
  field: keyof Conductor;
  currentField: keyof Conductor;
  direction: 'asc' | 'desc';
  onSort: (field: keyof Conductor) => void;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  title,
  field,
  currentField,
  direction,
  onSort
}) => (
  <th
    onClick={() => onSort(field)}
    style={{
      padding: '12px',
      textAlign: 'left' as const,
      fontSize: '12px',
      fontWeight: '600',
      color: '#374151',
      borderBottom: '1px solid #E5E7EB',
      cursor: 'pointer',
      userSelect: 'none' as const,
      position: 'relative'
    }}
  >
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    }}>
      {title}
      <span style={{
        fontSize: '10px',
        color: currentField === field ? '#3B82F6' : '#9CA3AF'
      }}>
        {currentField === field ? (direction === 'asc' ? '▲' : '▼') : '▲▼'}
      </span>
    </div>
  </th>
);

export default ConductorList;