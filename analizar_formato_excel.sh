#!/bin/bash
echo "=== ANÁLISIS DE FORMATO EXCEL ==="

# Leer estructura de los archivos Excel adjuntos
node << 'EOFNODE'
const XLSX = require('xlsx');
const fs = require('fs');

// Archivos adjuntados
const archivos = [
  '07072025  Lunes.xlsx',
  '08072025  Martes.xlsx',
  '09072025  Miercoles.xlsx'
];

archivos.forEach(archivo => {
  console.log(`\n=== ANÁLISIS: ${archivo} ===`);
  
  try {
    const workbook = XLSX.readFile(archivo);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Obtener rango de datos
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    console.log(`Rango: ${range.s.r} a ${range.e.r} filas, ${range.s.c} a ${range.e.c} columnas`);
    
    // Leer primeras 10 filas para ver estructura
    console.log('\nPrimeras filas:');
    for (let R = range.s.r; R <= Math.min(range.s.r + 10, range.e.r); ++R) {
      let fila = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellAddress];
        fila.push(cell ? cell.v : '');
      }
      console.log(`Fila ${R}:`, fila.join(' | '));
    }
    
    // Ver si hay estilos, merged cells, etc
    if (worksheet['!merges']) {
      console.log('\nCeldas combinadas:', worksheet['!merges'].length);
    }
    
    if (worksheet['!cols']) {
      console.log('\nAnchos de columna definidos');
    }
    
  } catch (error) {
    console.log(`Error leyendo ${archivo}:`, error.message);
  }
});
EOFNODE

echo -e "\n=== FIN ANÁLISIS ==="
