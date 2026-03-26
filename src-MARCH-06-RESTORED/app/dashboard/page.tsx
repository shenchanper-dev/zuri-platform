"use client";

export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-blue-600">25</p>
              <p className="text-gray-600 text-sm">Servicios Hoy</p>
            </div>
            <div className="text-3xl">🚗</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-green-600">18</p>
              <p className="text-gray-600 text-sm">Conductores Activos</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-yellow-600">12</p>
              <p className="text-gray-600 text-sm">En Ruta</p>
            </div>
            <div className="text-3xl">🗺️</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-red-600">3</p>
              <p className="text-gray-600 text-sm">Pendientes</p>
            </div>
            <div className="text-3xl">⏰</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Sistema</h2>
        <p className="text-gray-600">
          Bienvenido al Panel de Administración de ZURI. Selecciona una opción del menú lateral para comenzar.
        </p>
      </div>
    </div>
  );
}
