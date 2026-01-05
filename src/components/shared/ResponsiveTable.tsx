'use client';

import { useIsMobile } from '@/hooks/useMediaQuery';

interface Column {
  header: string;
  key: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface ResponsiveTableProps {
  columns: Column[];
  data: any[];
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  emptyMessage?: string;
}

export default function ResponsiveTable({
  columns,
  data,
  onEdit,
  onDelete,
  emptyMessage = 'No hay datos'
}: ResponsiveTableProps) {
  const isMobile = useIsMobile();

  if (data.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#6b7280',
        backgroundColor: 'white',
        borderRadius: '8px'
      }}>
        {emptyMessage}
      </div>
    );
  }

  // VISTA MÓVIL: Cards
  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.map((row, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}
          >
            {/* Datos del card */}
            {columns.map((col) => {
              // Saltar columna de acciones en el listado
              if (col.key === 'actions') return null;
              
              const value = row[col.key];
              return (
                <div
                  key={col.key}
                  style={{
                    marginBottom: '8px',
                    paddingBottom: '8px',
                    borderBottom: '1px dotted #e5e7eb'
                  }}
                >
                  <div style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    {col.header}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#1f2937'
                  }}>
                    {col.render ? col.render(value, row) : value || '-'}
                  </div>
                </div>
              );
            })}

            {/* Botones de acción */}
            {(onEdit || onDelete) && (
              <div style={{
                display: 'flex',
                gap: '8px',
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid #e5e7eb'
              }}>
                {onEdit && (
                  <button
                    onClick={() => onEdit(row)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    ✏️ Editar
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(row)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    🗑️ Eliminar
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // VISTA DESKTOP: Tabla normal
  return (
    <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#6b7280',
                  textTransform: 'uppercase'
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              style={{
                borderBottom: '1px solid #e5e7eb',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: '12px 16px',
                    fontSize: '14px',
                    color: '#1f2937'
                  }}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key] || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
