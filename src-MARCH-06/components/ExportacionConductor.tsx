// components/ExportacionConductor.tsx
// Componente de exportación completa clonado EXACTO de clínicas que SÍ funciona
// Con PDF, Excel, WhatsApp, Email, Impresión

import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  Mail, 
  MessageCircle, 
  Printer, 
  Share2,
  FileSpreadsheet,
  ChevronDown,
  ExternalLink,
  Check
} from 'lucide-react';

interface ExportacionConductorProps {
  conductorData: any;
  disabled?: boolean;
  variant?: 'dropdown' | 'buttons';
  className?: string;
}

interface ExportOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  action: () => Promise<void>;
}

export default function ExportacionConductor({
  conductorData,
  disabled = false,
  variant = 'dropdown',
  className = ''
}: ExportacionConductorProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Generar PDF del conductor
  const exportToPDF = async () => {
    setIsExporting('pdf');
    
    try {
      // Crear documento PDF con jsPDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('FICHA DE CONDUCTOR', 105, 20, { align: 'center' });
      doc.text('Sistema ZURI Platform', 105, 30, { align: 'center' });
      
      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);
      
      // Información personal
      let yPos = 50;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN PERSONAL', 20, yPos);
      
      yPos += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      const personalInfo = [
        ['DNI:', conductorData.dni || 'N/A'],
        ['Nombre Completo:', conductorData.nombreCompleto || 'N/A'],
        ['Fecha de Nacimiento:', conductorData.fechaNacimiento || 'N/A'],
        ['Celular 1:', conductorData.celular1 || 'N/A'],
        ['Celular 2:', conductorData.celular2 || 'N/A'],
        ['Domicilio:', conductorData.domicilio || 'N/A'],
        ['Email:', conductorData.email || 'N/A'],
        ['Estado Civil:', conductorData.estadoCivil || 'N/A'],
        ['Número de Hijos:', conductorData.numeroHijos?.toString() || 'N/A']
      ];
      
      personalInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 70, yPos);
        yPos += 8;
      });
      
      // Información vehicular
      yPos += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN VEHICULAR', 20, yPos);
      
      yPos += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      const vehicleInfo = [
        ['Número de Brevete:', conductorData.numeroBrevete || 'N/A'],
        ['Marca de Auto:', conductorData.marcaAuto || 'N/A'],
        ['Modelo:', conductorData.modelo || 'N/A'],
        ['Número de Placa:', conductorData.numeroPlaca || 'N/A'],
        ['Propietario:', conductorData.propietario || 'N/A']
      ];
      
      vehicleInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 70, yPos);
        yPos += 8;
      });
      
      // Contacto de emergencia
      yPos += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('CONTACTO DE EMERGENCIA', 20, yPos);
      
      yPos += 10;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      const contactInfo = [
        ['Nombre de Contacto:', conductorData.nombreContacto || 'N/A'],
        ['Celular de Contacto:', conductorData.celularContacto || 'N/A']
      ];
      
      contactInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 80, yPos);
        yPos += 8;
      });
      
      // Observaciones
      if (conductorData.observaciones) {
        yPos += 10;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('OBSERVACIONES', 20, yPos);
        
        yPos += 10;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        const splitText = doc.splitTextToSize(conductorData.observaciones, 170);
        doc.text(splitText, 20, yPos);
      }
      
      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-PE')} a las ${new Date().toLocaleTimeString('es-PE')}`,
        105, pageHeight - 10, { align: 'center' }
      );
      
      // Guardar PDF
      const fileName = `conductor_${conductorData.dni}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      setExportSuccess('pdf');
      setTimeout(() => setExportSuccess(null), 3000);
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar PDF');
    } finally {
      setIsExporting(null);
    }
  };

  // Generar Excel del conductor
  const exportToExcel = async () => {
    setIsExporting('excel');
    
    try {
      const XLSX = await import('xlsx');
      
      // Crear datos para Excel
      const worksheetData = [
        ['FICHA DE CONDUCTOR - SISTEMA ZURI PLATFORM'],
        [''],
        ['INFORMACIÓN PERSONAL'],
        ['DNI', conductorData.dni || 'N/A'],
        ['Nombre Completo', conductorData.nombreCompleto || 'N/A'],
        ['Fecha de Nacimiento', conductorData.fechaNacimiento || 'N/A'],
        ['Celular 1', conductorData.celular1 || 'N/A'],
        ['Celular 2', conductorData.celular2 || 'N/A'],
        ['Domicilio', conductorData.domicilio || 'N/A'],
        ['Email', conductorData.email || 'N/A'],
        ['Estado Civil', conductorData.estadoCivil || 'N/A'],
        ['Número de Hijos', conductorData.numeroHijos?.toString() || 'N/A'],
        [''],
        ['INFORMACIÓN VEHICULAR'],
        ['Número de Brevete', conductorData.numeroBrevete || 'N/A'],
        ['Marca de Auto', conductorData.marcaAuto || 'N/A'],
        ['Modelo', conductorData.modelo || 'N/A'],
        ['Número de Placa', conductorData.numeroPlaca || 'N/A'],
        ['Propietario', conductorData.propietario || 'N/A'],
        [''],
        ['CONTACTO DE EMERGENCIA'],
        ['Nombre de Contacto', conductorData.nombreContacto || 'N/A'],
        ['Celular de Contacto', conductorData.celularContacto || 'N/A'],
        [''],
        ['OBSERVACIONES'],
        ['', conductorData.observaciones || 'N/A'],
        [''],
        ['INFORMACIÓN DEL SISTEMA'],
        ['Estado', conductorData.estado || 'N/A'],
        ['Fecha de Registro', conductorData.createdAt ? new Date(conductorData.createdAt).toLocaleDateString('es-PE') : 'N/A'],
        ['Última Actualización', conductorData.updatedAt ? new Date(conductorData.updatedAt).toLocaleDateString('es-PE') : 'N/A']
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      
      // Configurar anchos de columna
      worksheet['!cols'] = [
        { width: 25 },
        { width: 50 }
      ];
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Conductor');
      
      const fileName = `conductor_${conductorData.dni}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      setExportSuccess('excel');
      setTimeout(() => setExportSuccess(null), 3000);
      
    } catch (error) {
      console.error('Error generando Excel:', error);
      alert('Error al generar Excel');
    } finally {
      setIsExporting(null);
    }
  };

  // Enviar por WhatsApp
  const shareWhatsApp = async () => {
    setIsExporting('whatsapp');
    
    try {
      const message = `
*CONDUCTOR REGISTRADO - ZURI PLATFORM*

📋 *INFORMACIÓN PERSONAL*
• DNI: ${conductorData.dni || 'N/A'}
• Nombre: ${conductorData.nombreCompleto || 'N/A'}
• Celular: ${conductorData.celular1 || 'N/A'}
• Email: ${conductorData.email || 'N/A'}

🚗 *INFORMACIÓN VEHICULAR*
• Brevete: ${conductorData.numeroBrevete || 'N/A'}
• Marca: ${conductorData.marcaAuto || 'N/A'}
• Modelo: ${conductorData.modelo || 'N/A'}
• Placa: ${conductorData.numeroPlaca || 'N/A'}

📱 *CONTACTO EMERGENCIA*
• Nombre: ${conductorData.nombreContacto || 'N/A'}
• Celular: ${conductorData.celularContacto || 'N/A'}

✅ Estado: ${conductorData.estado || 'N/A'}

_Generado desde admin.zuri.pe_
      `.trim();
      
      const whatsappURL = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappURL, '_blank');
      
      setExportSuccess('whatsapp');
      setTimeout(() => setExportSuccess(null), 3000);
      
    } catch (error) {
      console.error('Error compartiendo por WhatsApp:', error);
      alert('Error al compartir por WhatsApp');
    } finally {
      setIsExporting(null);
    }
  };

  // Enviar por Email
  const shareEmail = async () => {
    setIsExporting('email');
    
    try {
      const subject = `Ficha de Conductor - ${conductorData.nombreCompleto} (DNI: ${conductorData.dni})`;
      const body = `
CONDUCTOR REGISTRADO - ZURI PLATFORM

INFORMACIÓN PERSONAL:
• DNI: ${conductorData.dni || 'N/A'}
• Nombre Completo: ${conductorData.nombreCompleto || 'N/A'}
• Fecha de Nacimiento: ${conductorData.fechaNacimiento || 'N/A'}
• Celular 1: ${conductorData.celular1 || 'N/A'}
• Celular 2: ${conductorData.celular2 || 'N/A'}
• Domicilio: ${conductorData.domicilio || 'N/A'}
• Email: ${conductorData.email || 'N/A'}

INFORMACIÓN VEHICULAR:
• Número de Brevete: ${conductorData.numeroBrevete || 'N/A'}
• Marca de Auto: ${conductorData.marcaAuto || 'N/A'}
• Modelo: ${conductorData.modelo || 'N/A'}
• Número de Placa: ${conductorData.numeroPlaca || 'N/A'}
• Propietario: ${conductorData.propietario || 'N/A'}

CONTACTO DE EMERGENCIA:
• Nombre de Contacto: ${conductorData.nombreContacto || 'N/A'}
• Celular de Contacto: ${conductorData.celularContacto || 'N/A'}

OBSERVACIONES:
${conductorData.observaciones || 'N/A'}

Estado: ${conductorData.estado || 'N/A'}
Fecha de Registro: ${conductorData.createdAt ? new Date(conductorData.createdAt).toLocaleDateString('es-PE') : 'N/A'}

Generado desde admin.zuri.pe
      `.trim();
      
      const mailtoURL = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoURL;
      
      setExportSuccess('email');
      setTimeout(() => setExportSuccess(null), 3000);
      
    } catch (error) {
      console.error('Error enviando email:', error);
      alert('Error al enviar email');
    } finally {
      setIsExporting(null);
    }
  };

  // Imprimir
  const handlePrint = async () => {
    setIsExporting('print');
    
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('No se pudo abrir ventana de impresión');
      }
      
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Ficha de Conductor - ${conductorData.nombreCompleto}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .section h3 { background: #f5f5f5; padding: 10px; margin: 0 0 10px 0; }
            .field { margin: 5px 0; }
            .label { font-weight: bold; display: inline-block; width: 150px; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>FICHA DE CONDUCTOR</h1>
            <h2>Sistema ZURI Platform</h2>
          </div>
          
          <div class="section">
            <h3>INFORMACIÓN PERSONAL</h3>
            <div class="field"><span class="label">DNI:</span> ${conductorData.dni || 'N/A'}</div>
            <div class="field"><span class="label">Nombre Completo:</span> ${conductorData.nombreCompleto || 'N/A'}</div>
            <div class="field"><span class="label">Fecha de Nacimiento:</span> ${conductorData.fechaNacimiento || 'N/A'}</div>
            <div class="field"><span class="label">Celular 1:</span> ${conductorData.celular1 || 'N/A'}</div>
            <div class="field"><span class="label">Celular 2:</span> ${conductorData.celular2 || 'N/A'}</div>
            <div class="field"><span class="label">Domicilio:</span> ${conductorData.domicilio || 'N/A'}</div>
            <div class="field"><span class="label">Email:</span> ${conductorData.email || 'N/A'}</div>
          </div>
          
          <div class="section">
            <h3>INFORMACIÓN VEHICULAR</h3>
            <div class="field"><span class="label">Número de Brevete:</span> ${conductorData.numeroBrevete || 'N/A'}</div>
            <div class="field"><span class="label">Marca de Auto:</span> ${conductorData.marcaAuto || 'N/A'}</div>
            <div class="field"><span class="label">Modelo:</span> ${conductorData.modelo || 'N/A'}</div>
            <div class="field"><span class="label">Número de Placa:</span> ${conductorData.numeroPlaca || 'N/A'}</div>
            <div class="field"><span class="label">Propietario:</span> ${conductorData.propietario || 'N/A'}</div>
          </div>
          
          <div class="section">
            <h3>CONTACTO DE EMERGENCIA</h3>
            <div class="field"><span class="label">Nombre de Contacto:</span> ${conductorData.nombreContacto || 'N/A'}</div>
            <div class="field"><span class="label">Celular de Contacto:</span> ${conductorData.celularContacto || 'N/A'}</div>
          </div>
          
          <div class="section">
            <h3>OBSERVACIONES</h3>
            <p>${conductorData.observaciones || 'N/A'}</p>
          </div>
          
          <div class="footer">
            Generado el ${new Date().toLocaleDateString('es-PE')} a las ${new Date().toLocaleTimeString('es-PE')}
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
      
      setExportSuccess('print');
      setTimeout(() => setExportSuccess(null), 3000);
      
    } catch (error) {
      console.error('Error imprimiendo:', error);
      alert('Error al imprimir');
    } finally {
      setIsExporting(null);
    }
  };

  const exportOptions: ExportOption[] = [
    {
      id: 'pdf',
      label: 'Descargar PDF',
      icon: <FileText size={16} />,
      color: 'text-red-600',
      description: 'Ficha completa en PDF',
      action: exportToPDF
    },
    {
      id: 'excel',
      label: 'Descargar Excel',
      icon: <FileSpreadsheet size={16} />,
      color: 'text-green-600',
      description: 'Datos en formato Excel',
      action: exportToExcel
    },
    {
      id: 'whatsapp',
      label: 'Compartir WhatsApp',
      icon: <MessageCircle size={16} />,
      color: 'text-green-500',
      description: 'Enviar por WhatsApp',
      action: shareWhatsApp
    },
    {
      id: 'email',
      label: 'Enviar Email',
      icon: <Mail size={16} />,
      color: 'text-blue-600',
      description: 'Enviar por correo',
      action: shareEmail
    },
    {
      id: 'print',
      label: 'Imprimir',
      icon: <Printer size={16} />,
      color: 'text-gray-600',
      description: 'Imprimir ficha',
      action: handlePrint
    }
  ];

  if (variant === 'dropdown') {
    return (
      <div className={`relative inline-block ${className}`}>
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={disabled}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download size={16} />
          <span>Exportar</span>
          <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="p-2">
              {exportOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    option.action();
                    setShowDropdown(false);
                  }}
                  disabled={isExporting !== null}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50"
                >
                  <span className={option.color}>
                    {isExporting === option.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : exportSuccess === option.id ? (
                      <Check size={16} />
                    ) : (
                      option.icon
                    )}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Variant: buttons
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {exportOptions.map((option) => (
        <button
          key={option.id}
          onClick={option.action}
          disabled={disabled || isExporting !== null}
          className={`
            flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg
            hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors text-sm
          `}
          title={option.description}
        >
          <span className={option.color}>
            {isExporting === option.id ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : exportSuccess === option.id ? (
              <Check size={16} />
            ) : (
              option.icon
            )}
          </span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}