#!/bin/bash
echo "Extrayendo formato del Excel adjuntado..."

# Buscar el archivo recién adjuntado
ARCHIVO=$(find . -name "*03072025*.xlsx" -o -name "*Jueves*.xlsx" 2>/dev/null | head -1)

if [ -z "$ARCHIVO" ]; then
    echo "Buscando en otros directorios..."
    ARCHIVO=$(find ~ -name "*03072025*.xlsx" -mtime -1 2>/dev/null | head -1)
fi

if [ -z "$ARCHIVO" ]; then
    echo "❌ No se encontró el archivo"
    echo ""
    echo "Por favor copia el archivo a:"
    echo "cp '03072025  Jueves.xlsx' ~/zuri-platform/"
    echo ""
    echo "O dime:"
    echo "1. ¿Qué columnas tiene? (orden exacto)"
    echo "2. ¿Qué colores usan los títulos? (hex o nombre)"
    echo "3. ¿Hay celdas combinadas en el encabezado?"
    echo "4. ¿Qué información va en las primeras filas antes de los datos?"
    exit 1
fi

echo "Archivo encontrado: $ARCHIVO"

node << EOFNODE
const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('$ARCHIVO');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  console.log('\n=== ESTRUCTURA DEL EXCEL ===\n');
  
  // Leer todas las filas para ver estructura completa
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  console.log('Rango total:', worksheet['!ref']);
  console.log('Filas:', range.e.r + 1);
  console.log('Columnas:', range.e.c + 1);
  
  // Mostrar primeras 15 filas
  console.log('\n--- PRIMERAS 15 FILAS ---\n');
  for (let R = 0; R <= Math.min(15, range.e.r); R++) {
    let fila = [];
    for (let C = 0; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = worksheet[addr];
      
      if (cell) {
        // Mostrar valor y estilo si existe
        let info = String(cell.v);
        if (cell.s) info += ' [CON ESTILO]';
        fila.push(info);
      } else {
        fila.push('');
      }
    }
    console.log(`Fila ${R + 1}:`, fila.join(' | '));
  }
  
  // Celdas combinadas
  if (worksheet['!merges']) {
    console.log('\n--- CELDAS COMBINADAS ---');
    worksheet['!merges'].forEach(merge => {
      console.log(XLSX.utils.encode_range(merge));
    });
  }
  
  // Anchos de columna
  if (worksheet['!cols']) {
    console.log('\n--- ANCHOS DE COLUMNA ---');
    worksheet['!cols'].forEach((col, i) => {
      if (col.wch) console.log(\`Columna \${i}: \${col.wch} caracteres\`);
    });
  }
  
  // Información de estilos (si están disponibles)
  console.log('\n--- ANALIZANDO ESTILOS ---');
  
  // Verificar celda A1 para ver si tiene estilos
  const a1 = worksheet['A1'];
  if (a1 && a1.s) {
    console.log('Celda A1 tiene estilos:', JSON.stringify(a1.s, null, 2));
  }
  
} catch (error) {
  console.error('Error:', error.message);
}
EOFNODE

