'use client';

import { useState } from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import TopBar from './TopBar';
import Sidebar from './Sidebar';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Top Bar */}
      <TopBar 
        onMenuClick={toggleSidebar}
        title="ZURI"
      />

      {/* Contenedor principal */}
      <div style={{ display: 'flex', position: 'relative' }}>
        {/* Sidebar */}
        <Sidebar 
          isOpen={isMobile ? sidebarOpen : true}
          onClose={closeSidebar}
          isMobile={isMobile}
        />

        {/* Contenido principal */}
        <main style={{
          flex: 1,
          minHeight: 'calc(100vh - 72px)',
          padding: isMobile ? '16px' : '24px',
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
