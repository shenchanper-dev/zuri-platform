'use client';

import dynamic from 'next/dynamic';

const ServiciosJPSAC = dynamic(() => import('@/components/servicios/ServiciosJPSAC'), { ssr: false });

export default function ServiciosPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">🏥 Servicios Hoy</h1>
        <p className="text-gray-600 text-sm mt-1">
          Sistema de gestión de servicios médicos a domicilio con seguimiento de flota en tiempo real
        </p>
      </div>
      <ServiciosJPSAC />
    </div>
  );
}
