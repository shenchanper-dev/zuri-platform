#!/bin/bash

# Hacer backup
cp src/app/dashboard/gestion-excel/page.tsx src/app/dashboard/gestion-excel/page.tsx.prepatch

# Agregar import al inicio (después de los otros imports)
sed -i "5i import { BotonGenerarProgramacion } from '@/components/BotonGenerarProgramacion';" src/app/dashboard/gestion-excel/page.tsx

# Buscar la línea que tiene "Ver/Editar" y agregar el botón después
# Esto es más seguro que reescribir todo
sed -i 's|<button onClick={() => setModalEdicion(imp)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Ver/Editar</button>|<button onClick={() => setModalEdicion(imp)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Ver/Editar</button>\n                    <BotonGenerarProgramacion importacionId={imp.id} codigoZuri={imp.codigo_zuri} />|' src/app/dashboard/gestion-excel/page.tsx

echo "Gestión Excel parcheada"
