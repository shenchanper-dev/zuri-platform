#!/bin/bash
echo "=== FASE 1: Integración Gestión Excel → Programación ==="

# 1. Agregar solo el botón y lógica de generación (sin reescribir todo)
cat > src/components/BotonGenerarProgramacion.tsx << 'EOFBOTON'
"use client";
import { useState } from 'react';

interface Props {
  importacionId: number;
  codigoZuri: string;
  onSuccess?: () => void;
}

export function BotonGenerarProgramacion({ importacionId, codigoZuri, onSuccess }: Props) {
  const [generando, setGenerando] = useState(false);

  const generarProgramacion = async () => {
    if (!confirm(`¿Generar programación desde ${codigoZuri}?`)) return;
    
    setGenerando(true);
    try {
      const response = await fetch('/api/programaciones/desde-importacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ importacionId })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`Programación ${data.programacion.codigo_programacion} creada`);
        window.location.href = `/dashboard/programacion?id=${data.programacion.id}`;
        onSuccess?.();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setGenerando(false);
    }
  };

  return (
    <button 
      onClick={generarProgramacion}
      disabled={generando}
      className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50"
    >
      {generando ? 'Generando...' : '📋 Programar'}
    </button>
  );
}
EOFBOTON

echo "✓ Componente BotonGenerarProgramacion creado"

# 2. Actualizar Gestión Excel SOLO agregando el import y usando el componente
# (manteniendo todo el código existente)
cat > patch_gestion_excel.sh << 'EOFPATCH'
#!/bin/bash

# Hacer backup
cp src/app/dashboard/gestion-excel/page.tsx src/app/dashboard/gestion-excel/page.tsx.prepatch

# Agregar import al inicio (después de los otros imports)
sed -i "5i import { BotonGenerarProgramacion } from '@/components/BotonGenerarProgramacion';" src/app/dashboard/gestion-excel/page.tsx

# Buscar la línea que tiene "Ver/Editar" y agregar el botón después
# Esto es más seguro que reescribir todo
sed -i 's|<button onClick={() => setModalEdicion(imp)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Ver/Editar</button>|<button onClick={() => setModalEdicion(imp)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Ver/Editar</button>\n                    <BotonGenerarProgramacion importacionId={imp.id} codigoZuri={imp.codigo_zuri} />|' src/app/dashboard/gestion-excel/page.tsx

echo "Gestión Excel parcheada"
EOFPATCH

chmod +x patch_gestion_excel.sh
./patch_gestion_excel.sh

echo "✓ Gestión Excel integrada"

npm run build
if [ $? -eq 0 ]; then
    pm2 restart zuri-dev
    echo ""
    echo "✅ FASE 1 COMPLETADA"
    echo "Ve a Gestión Excel y verás el botón 'Programar'"
else
    echo "❌ Error en compilación. Restaurando backup..."
    cp src/app/dashboard/gestion-excel/page.tsx.prepatch src/app/dashboard/gestion-excel/page.tsx
fi
