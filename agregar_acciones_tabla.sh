#!/bin/bash
echo "Agregando acciones en tabla de programaciones..."

# Actualizar solo la sección de la tabla en el componente
cat > /tmp/update_tabla.tsx << 'EOFTABLA'
// Insertar esto en EditorProgramacionContent.tsx reemplazando la tabla actual

const eliminarProgramacion = async (id: number, codigo: string) => {
  if (!confirm(`¿Eliminar programación ${codigo}?`)) return;
  
  try {
    const res = await fetch(`/api/programaciones/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert('Programación eliminada');
      cargarProgramaciones();
    } else {
      alert('Error al eliminar');
    }
  } catch (error) {
    alert('Error de conexión');
  }
};

// Tabla actualizada:
<table className="w-full">
  <thead className="bg-gray-50">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
    </tr>
  </thead>
  <tbody className="divide-y">
    {programaciones.map(prog => (
      <tr key={prog.id} className="hover:bg-gray-50">
        <td className="px-6 py-4">
          <span className="font-mono text-sm font-semibold text-blue-600">
            {prog.codigo_programacion}
          </span>
        </td>
        <td className="px-6 py-4 text-sm">
          {new Date(prog.fecha_programacion).toLocaleDateString('es-PE')}
        </td>
        <td className="px-6 py-4 text-sm">{prog.cliente_nombre}</td>
        <td className="px-6 py-4">
          <span className={`px-2 py-1 text-xs rounded-full ${
            prog.estado === 'COMPLETADO' ? 'bg-green-100 text-green-800' :
            prog.estado === 'CONFIRMADO' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {prog.estado}
          </span>
        </td>
        <td className="px-6 py-4">
          <div className="flex gap-2">
            <button
              onClick={() => cargarProgramacion(prog.id)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Abrir
            </button>
            <button
              onClick={() => eliminarProgramacion(prog.id, prog.codigo_programacion)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Eliminar
            </button>
          </div>
        </td>
      </tr>
    ))}
  </tbody>
</table>
EOFTABLA

echo "Referencia creada en /tmp/update_tabla.tsx"
echo "Ahora actualizo el componente completo..."
