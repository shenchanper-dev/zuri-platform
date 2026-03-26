/**
 * COMPONENTE SERVICIOS SELECTOR
 * Selector múltiple de servicios con validación y límites
 */

import React from 'react';
import { TipoServicio, SERVICIOS_DISPONIBLES, ServiciosSelectorProps } from '@/domain/entities/Conductor.entity';

export const ServiciosSelector: React.FC<ServiciosSelectorProps> = ({
  selectedServicios = [],
  onChange,
  maxSelections = 5
}) => {
  
  const handleServiceToggle = (servicio: TipoServicio) => {
    const isSelected = selectedServicios.includes(servicio);
    
    if (isSelected) {
      // Remover servicio
      const newServicios = selectedServicios.filter(s => s !== servicio);
      onChange(newServicios);
    } else {
      // Agregar servicio (si no se excede el límite)
      if (selectedServicios.length < maxSelections) {
        const newServicios = [...selectedServicios, servicio];
        onChange(newServicios);
      }
    }
  };

  const isMaxReached = selectedServicios.length >= maxSelections;
  const selectedCount = selectedServicios.length;

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '4px'
        }}>
          Servicios Asignados
        </label>
        <div style={{
          fontSize: '12px',
          color: '#6B7280'
        }}>
          {selectedCount} de {maxSelections} servicios seleccionados
        </div>
      </div>

      {/* Grid de Servicios */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '12px'
      }}>
        {SERVICIOS_DISPONIBLES.map((servicio) => {
          const isSelected = selectedServicios.includes(servicio.value);
          const isDisabled = !isSelected && isMaxReached;

          return (
            <button
              key={servicio.value}
              type="button"
              onClick={() => handleServiceToggle(servicio.value)}
              disabled={isDisabled}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                borderRadius: '8px',
                border: isSelected 
                  ? `2px solid ${servicio.color}` 
                  : '2px solid #E5E7EB',
                backgroundColor: isSelected 
                  ? `${servicio.color}15` 
                  : isDisabled 
                    ? '#F9FAFB' 
                    : 'white',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isDisabled ? 0.5 : 1,
                textAlign: 'left' as const
              }}
              onMouseOver={(e) => {
                if (!isDisabled) {
                  e.currentTarget.style.borderColor = servicio.color;
                  e.currentTarget.style.backgroundColor = `${servicio.color}10`;
                }
              }}
              onMouseOut={(e) => {
                if (!isSelected && !isDisabled) {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              {/* Checkbox visual */}
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                border: `2px solid ${isSelected ? servicio.color : '#D1D5DB'}`,
                backgroundColor: isSelected ? servicio.color : 'transparent',
                marginRight: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {isSelected && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 3L4.5 8.5L2 6"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>

              {/* Contenido del servicio */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isSelected ? servicio.color : '#374151',
                  marginBottom: '2px'
                }}>
                  {servicio.label}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6B7280'
                }}>
                  {getServicioDescription(servicio.value)}
                </div>
              </div>

              {/* Badge de color */}
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: servicio.color,
                marginLeft: '8px',
                flexShrink: 0
              }} />
            </button>
          );
        })}
      </div>

      {/* Mensaje de límite */}
      {isMaxReached && (
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#FEF3C7',
          border: '1px solid #F59E0B',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#92400E',
          display: 'flex',
          alignItems: 'center'
        }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ marginRight: '6px', flexShrink: 0 }}
          >
            <path
              d="M8 1.33334C4.32 1.33334 1.33334 4.32 1.33334 8C1.33334 11.68 4.32 14.6667 8 14.6667C11.68 14.6667 14.6667 11.68 14.6667 8C14.6667 4.32 11.68 1.33334 8 1.33334ZM7.33334 5.33334H8.66668V9.33334H7.33334V5.33334ZM7.33334 10.6667H8.66668V12H7.33334V10.6667Z"
              fill="#92400E"
            />
          </svg>
          Has alcanzado el límite de {maxSelections} servicios. Deselecciona uno para agregar otro.
        </div>
      )}

      {/* Servicios seleccionados (resumen) */}
      {selectedServicios.length > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#F3F4F6',
          borderRadius: '6px'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Servicios Seleccionados:
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: '6px'
          }}>
            {selectedServicios.map((servicioValue) => {
              const servicio = SERVICIOS_DISPONIBLES.find(s => s.value === servicioValue);
              if (!servicio) return null;

              return (
                <span
                  key={servicioValue}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: servicio.color,
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {servicio.label}
                  <button
                    type="button"
                    onClick={() => handleServiceToggle(servicioValue as TipoServicio)}
                    style={{
                      marginLeft: '4px',
                      background: 'none',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      padding: '0',
                      fontSize: '12px',
                      lineHeight: '1'
                    }}
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function para obtener descripción del servicio
const getServicioDescription = (servicio: TipoServicio): string => {
  const descriptions: Record<TipoServicio, string> = {
    MEDICINA_GENERAL: 'Atención médica general',
    PEDIATRIA: 'Atención especializada en niños',
    LABORATORIO: 'Toma de muestras y análisis',
    PHD: 'Programa hospitalización domiciliaria',
    PRECISA: 'Atención médica especializada',
    CRONICO: 'Pacientes con enfermedades crónicas',
    OTROS: 'Otros servicios médicos especializados'
  };

  return descriptions[servicio] || 'Servicio especializado';
};

export default ServiciosSelector;