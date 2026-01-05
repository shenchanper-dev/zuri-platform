import re

with open('src/components/EditorProgramacionContent.tsx', 'r') as f:
    content = f.read()

# Buscar los botones actuales y reemplazarlos
old_buttons = '''        <div className="px-8 py-6 bg-gray-50 border-t flex justify-between items-center">
          <button onClick={onVolver} className="px-4 py-2 border rounded-lg hover:bg-white">Volver</button>
          
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">PDF</button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">WhatsApp</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Email</button>
          </div>
        </div>'''

new_buttons = '''        <div className="px-8 py-6 bg-gray-50 border-t flex justify-between items-center">
          <button onClick={onVolver} className="px-4 py-2 border rounded-lg hover:bg-white">Volver</button>
          
          <div className="flex gap-3">
            <button 
              onClick={async () => {
                try {
                  const res = await fetch('/api/programaciones/exportar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ programacionId: programacion.id })
                  });
                  
                  if (res.ok) {
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${programacion.codigo_programacion}.xlsx`;
                    a.click();
                  }
                } catch (error) {
                  alert('Error exportando Excel');
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              📊 Excel
            </button>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">PDF</button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">WhatsApp</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Email</button>
          </div>
        </div>'''

content = content.replace(old_buttons, new_buttons)

with open('src/components/EditorProgramacionContent.tsx', 'w') as f:
    f.write(content)

print("✓ Botón Excel funcional agregado")
