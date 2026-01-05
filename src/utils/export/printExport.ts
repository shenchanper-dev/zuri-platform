/**
 * UTILIDAD GLOBAL: Impresión Profesional
 * Usa window.print() + @media print (Mejores prácticas 2025)
 */

export interface PrintOptions {
  title: string;
  content: string;
  orientation?: 'portrait' | 'landscape';
  includeDate?: boolean;
}

/**
 * Imprimir contenido HTML optimizado
 */
export const printHTML = (options: PrintOptions) => {
  const { title, content, orientation = 'portrait', includeDate = true } = options;

  try {
    // Crear iframe invisible
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      throw new Error('No se pudo acceder al documento de impresión');
    }

    // Generar HTML con estilos optimizados para impresión
    const fecha = includeDate ? new Date().toLocaleString('es-PE') : '';
    
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          @media print {
            @page {
              size: ${orientation === 'landscape' ? 'landscape' : 'portrait'};
              margin: 2cm;
            }
            
            body {
              font-family: 'Arial', 'Helvetica', sans-serif;
              font-size: 11pt;
              line-height: 1.5;
              color: #000;
            }
            
            h1 {
              font-size: 20pt;
              color: #1f2937;
              margin-bottom: 10px;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 8px;
            }
            
            h2 {
              font-size: 16pt;
              color: #374151;
              margin-top: 15px;
              margin-bottom: 8px;
            }
            
            h3 {
              font-size: 13pt;
              color: #4b5563;
              margin-top: 10px;
              margin-bottom: 6px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              page-break-inside: auto;
            }
            
            thead {
              display: table-header-group;
              background-color: #f3f4f6;
            }
            
            tbody tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            
            th {
              background-color: #e5e7eb;
              padding: 10px 8px;
              text-align: left;
              font-weight: bold;
              border: 1px solid #d1d5db;
              font-size: 10pt;
            }
            
            td {
              padding: 8px;
              border: 1px solid #d1d5db;
              font-size: 10pt;
            }
            
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            
            .header-info {
              margin-bottom: 20px;
              padding: 10px;
              background-color: #f3f4f6;
              border-radius: 4px;
            }
            
            .header-info p {
              margin: 5px 0;
              font-size: 10pt;
              color: #6b7280;
            }
            
            .section {
              margin: 20px 0;
            }
            
            .field-row {
              display: flex;
              margin: 8px 0;
              padding: 6px 0;
              border-bottom: 1px dotted #d1d5db;
            }
            
            .field-label {
              font-weight: bold;
              width: 150px;
              color: #374151;
            }
            
            .field-value {
              flex: 1;
              color: #1f2937;
            }
            
            .footer {
              margin-top: 30px;
              padding-top: 10px;
              border-top: 1px solid #d1d5db;
              font-size: 9pt;
              color: #6b7280;
              text-align: center;
            }
            
            /* Ocultar elementos que no deben imprimirse */
            .no-print,
            button,
            input[type="button"],
            input[type="submit"],
            .btn,
            nav,
            .navigation {
              display: none !important;
            }
            
            /* Evitar saltos de página en elementos clave */
            h1, h2, h3 {
              page-break-after: avoid;
            }
            
            /* Logo o marca (si se agrega) */
            .print-logo {
              text-align: center;
              margin-bottom: 20px;
            }
          }
          
          @media screen {
            body {
              padding: 20px;
              background: #f9fafb;
            }
          }
        </style>
      </head>
      <body>
        <div class="header-info">
          <h1>${title}</h1>
          ${fecha ? `<p><strong>Fecha de impresión:</strong> ${fecha}</p>` : ''}
          <p><strong>Sistema:</strong> ZURI - Gestión de Salud</p>
        </div>
        
        ${content}
        
        <div class="footer">
          <p>Documento generado por ZURI - Sistema de Gestión de Salud</p>
          <p>© ${new Date().getFullYear()} - Todos los derechos reservados</p>
        </div>
      </body>
      </html>
    `);
    doc.close();

    // Esperar a que cargue el contenido
    iframe.contentWindow?.focus();
    
    // Pequeño delay para asegurar que el contenido esté listo
    setTimeout(() => {
      iframe.contentWindow?.print();
      
      // Limpiar después de imprimir
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 100);
    }, 250);

    return { success: true };
  } catch (error: any) {
    console.error('Error al imprimir:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Imprimir tabla de datos
 */
export const printTable = (
  title: string,
  columns: { header: string; key: string }[],
  data: any[]
) => {
  const tableHTML = `
    <div class="section">
      <h2>Listado</h2>
      <table>
        <thead>
          <tr>
            ${columns.map(col => `<th>${col.header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(row => `
            <tr>
              ${columns.map(col => `<td>${row[col.key] || '-'}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p style="margin-top: 10px; font-size: 10pt; color: #6b7280;">
        <strong>Total de registros:</strong> ${data.length}
      </p>
    </div>
  `;

  return printHTML({
    title,
    content: tableHTML,
    orientation: columns.length > 5 ? 'landscape' : 'portrait'
  });
};

/**
 * Imprimir ficha individual (registro detallado)
 */
export const printRecord = (
  title: string,
  fields: { label: string; value: string }[]
) => {
  const fieldsHTML = `
    <div class="section">
      <h2>Información Detallada</h2>
      ${fields.map(field => `
        <div class="field-row">
          <div class="field-label">${field.label}:</div>
          <div class="field-value">${field.value || 'N/A'}</div>
        </div>
      `).join('')}
    </div>
  `;

  return printHTML({
    title,
    content: fieldsHTML,
    orientation: 'portrait'
  });
};
