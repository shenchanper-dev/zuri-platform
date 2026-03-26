/**
 * UTILIDAD GLOBAL: Exportación a Excel
 * Reutilizable para todos los módulos (clínicas, doctores, pacientes, etc.)
 */

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  format?: (value: any) => string;
}

export interface ExcelExportOptions {
  filename: string;
  sheetName: string;
  columns: ExcelColumn[];
  data: any[];
  title?: string;
  subtitle?: string;
}

/**
 * Exportar datos a Excel usando SheetJS
 */
export const exportToExcel = async (options: ExcelExportOptions) => {
  try {
    // Importar SheetJS dinámicamente
    const XLSX = await import('xlsx');
    
    const { filename, sheetName, columns, data, title, subtitle } = options;

    // Preparar datos
    const worksheetData: any[] = [];
    
    // Agregar título si existe
    if (title) {
      worksheetData.push([title]);
      worksheetData.push([]);
    }
    
    if (subtitle) {
      worksheetData.push([subtitle]);
      worksheetData.push([]);
    }

    // Headers
    const headers = columns.map(col => col.header);
    worksheetData.push(headers);

    // Datos
    data.forEach(row => {
      const rowData = columns.map(col => {
        const value = row[col.key];
        return col.format ? col.format(value) : value;
      });
      worksheetData.push(rowData);
    });

    // Crear workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Aplicar anchos de columna
    ws['!cols'] = columns.map(col => ({ wch: col.width || 15 }));

    // Agregar worksheet
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Descargar
    XLSX.writeFile(wb, `${filename}.xlsx`);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error exportando a Excel:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Exportar datos filtrados directamente desde la página
 */
export const exportFilteredToExcel = async (
  moduleName: string,
  data: any[],
  columns: ExcelColumn[]
) => {
  const fecha = new Date().toLocaleDateString('es-PE').replace(/\//g, '-');
  
  // Truncar nombre de hoja a máximo 31 caracteres (límite de Excel)
  const safeSheetName = moduleName.length > 31 
    ? moduleName.substring(0, 31) 
    : moduleName;
  
  return exportToExcel({
    filename: `${moduleName}_${fecha}`,
    sheetName: safeSheetName,  // ← CAMBIADO: usar nombre truncado
    columns,
    data,
    title: `Reporte de ${moduleName}`,
    subtitle: `Generado: ${new Date().toLocaleString('es-PE')}`
  });
};
