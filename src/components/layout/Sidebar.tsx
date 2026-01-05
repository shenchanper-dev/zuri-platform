'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  isMobile: boolean;
}

interface MenuItem {
  icon: string;
  label: string;
  href: string;
}

const menuItems: MenuItem[] = [
  { icon: '📊', label: 'Dashboard', href: '/dashboard' },
  { icon: '📅', label: 'Servicios Hoy', href: '/dashboard/servicios' },
  { icon: '📁', label: 'Gestión Excel', href: '/dashboard/excel' },
  { icon: '🗓️', label: 'Programación', href: '/dashboard/programacion' },
  { icon: '🚗', label: 'Conductores', href: '/dashboard/conductores' },
  { icon: '🏥', label: 'Clínicas y Hospitales', href: '/dashboard/clinicas' },
  { icon: '👨‍⚕️', label: 'Doctores y Técnicos', href: '/dashboard/doctores' },
  { icon: '🤒', label: 'Pacientes', href: '/dashboard/pacientes' },
  { icon: '🛣️', label: 'Rutas', href: '/dashboard/rutas' },
  { icon: '📈', label: 'Reportes', href: '/dashboard/reportes' },
  { icon: '⚙️', label: 'Varios', href: '/dashboard/varios' },
];

export default function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const pathname = usePathname();

  const sidebarStyle: React.CSSProperties = {
    position: isMobile ? 'fixed' : 'sticky',
    top: isMobile ? 0 : '72px',
    left: 0,
    height: isMobile ? '100vh' : 'calc(100vh - 72px)',
    width: isMobile ? '280px' : '240px',
    backgroundColor: '#f9fafb',
    borderRight: '1px solid #e5e7eb',
    transform: isMobile && !isOpen ? 'translateX(-100%)' : 'translateX(0)',
    transition: 'transform 0.3s ease',
    zIndex: isMobile ? 999 : 100,
    overflowY: 'auto',
    paddingTop: isMobile ? '72px' : '0'
  };

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
    display: isMobile && isOpen ? 'block' : 'none',
    transition: 'opacity 0.3s ease'
  };

  return (
    <>
      {/* Overlay para cerrar en móvil */}
      <div style={overlayStyle} onClick={onClose} />

      {/* Sidebar */}
      <div style={sidebarStyle}>
        <nav style={{ padding: '16px 0' }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && onClose?.()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px',
                  margin: '4px 8px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: isActive ? '#1f2937' : '#6b7280',
                  backgroundColor: isActive ? '#e0e7ff' : 'transparent',
                  fontWeight: isActive ? '600' : '400',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer del sidebar */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            <span>🔒</span>
            <span>Admin ZURI</span>
          </div>
        </div>
      </div>
    </>
  );
}
