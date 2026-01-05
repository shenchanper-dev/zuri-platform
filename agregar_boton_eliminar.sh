#!/bin/bash
echo "Agregando botón Eliminar..."

# Reemplazar solo la sección del botón Abrir para incluir Eliminar
sed -i '226,232s|<td className="px-6 py-4">.*</td>|<td className="px-6 py-4">\
                    <div className="flex gap-2">\
                      <button\
                        onClick={() => cargarProgramacion(prog.id)}\
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"\
                      >\
                        Abrir\
                      </button>\
                      <button\
                        onClick={() => eliminarProgramacion(prog.id, prog.codigo_programacion)}\
                        className="text-red-600 hover:text-red-800 text-sm font-medium"\
                      >\
                        Eliminar\
                      </button>\
                    </div>\
                  </td>|' src/components/EditorProgramacionContent.tsx

# Verificar que quedó bien
grep -A 10 "Abrir" src/components/EditorProgramacionContent.tsx | head -15

npm run build && pm2 restart zuri-dev
