/**
 * UTILIDAD GLOBAL: Exportación a PDF
 * Usa jsPDF + autoTable
 */

export interface PDFColumn {
  header: string;
  dataKey: string;
}

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  columns: PDFColumn[];
  data: any[];
  filename: string;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Exportar a PDF
 */
export const exportToPDF = async (options: PDFExportOptions) => {
  try {
    // Importar dinámicamente
    const { jsPDF } = await import('jspdf');
    const autoTable = (await import('jspdf-autotable')).default;

    const { title, subtitle, columns, data, filename, orientation = 'portrait' } = options;

    // Crear documento
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4'
    });

    // Título
    doc.setFontSize(18);
    doc.text(title, 14, 20);

    // Subtítulo
    if (subtitle) {
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(subtitle, 14, 28);
    }

    // Tabla
    autoTable(doc, {
      startY: subtitle ? 35 : 28,
      head: [columns.map(col => col.header)],
      body: data.map(row => columns.map(col => row[col.dataKey] || '')),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { top: 35 }
    });

    // Fecha de generación
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Generado: ${new Date().toLocaleString('es-PE')} | Página ${i} de ${pageCount}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }

    // Descargar
    doc.save(`${filename}.pdf`);
    
    return { success: true };
  } catch (error: any) {
    console.error('Error exportando a PDF:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Exportar registro individual a PDF (Ficha)
 */
export const exportSingleToPDF = async (
  title: string,
  data: { label: string; value: string }[],
  filename: string
) => {
  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    // Título
    doc.setFontSize(16);
    doc.text(title, 14, 20);

    // Línea
    doc.setLineWidth(0.5);
    doc.line(14, 25, 196, 25);

    // Datos
    let y = 35;
    doc.setFontSize(10);
    
    data.forEach(item => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${item.label}:`, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(item.value || 'N/A', 60, y);
      y += 8;
      
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Generado: ${new Date().toLocaleString('es-PE')}`,
      14,
      doc.internal.pageSize.height - 10
    );

    doc.save(`${filename}.pdf`);
    return { success: true };
  } catch (error: any) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  }
};
