'use client';

import { useState } from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface TopBarProps {
  onMenuClick?: () => void;
  title?: string;
}

export default function TopBar({ onMenuClick, title = 'ZURI' }: TopBarProps) {
  const isMobile = useIsMobile();

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backgroundColor: '#1f2937',
      color: 'white',
      padding: isMobile ? '12px 16px' : '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {/* Lado izquierdo: Menú + Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {isMobile && (
          <button
            onClick={onMenuClick}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Menú"
          >
            ☰
          </button>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: isMobile ? '32px' : '40px',
            height: isMobile ? '32px' : '40px',
            backgroundColor: '#3b82f6',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '18px' : '22px',
            fontWeight: 'bold'
          }}>
            Z
          </div>
          {!isMobile && (
            <div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{title}</div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>Sistema de Gestión de Salud</div>
            </div>
          )}
        </div>
      </div>

      {/* Lado derecho: Notificaciones + Usuario */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px' }}>
        {/* Notificaciones */}
        <button
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: isMobile ? '20px' : '24px',
            cursor: 'pointer',
            position: 'relative',
            padding: '8px'
          }}
          aria-label="Notificaciones"
        >
          🔔
          <span style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            3
          </span>
        </button>

        {/* Usuario */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '8px',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <div style={{
            width: isMobile ? '32px' : '36px',
            height: isMobile ? '32px' : '36px',
            backgroundColor: '#3b82f6',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: 'bold'
          }}>
            ZU
          </div>
          {!isMobile && (
            <div style={{ fontSize: '14px' }}>
              Admin ZURI
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
