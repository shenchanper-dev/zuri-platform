"use client";

// src/components/export/ExportacionCompleta.tsx
// SISTEMA DE EXPORTACIÓN COMPLETA: PDF, WhatsApp, Email, Impresión

import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  MessageCircle, 
  Mail, 
  Printer, 
  Download,
  Check,
  Loader2,
  Share,
  FileSpreadsheet
} from 'lucide-react';

interface ConductorData {
  id: number;
  dni: string;
  nombreCompleto: string;
  celular1: string;
  email?: string;
  direccionCompleta?: string;
  distrito_nombre?: string;
  marcaVehiculo?: string;
  modeloVehiculo?: string;
  placaVehiculo?: string;
  estado: string;
  calificacionPromedio?: number;
  totalViajes?: number;
  fechaCreacion?: string;
}

interface ExportacionCompletaProps {
  datos: ConductorData[];
  tipo: 'conductores' | 'servicios' | 'reportes';
  onClose: () => void;
}

const FORMATOS_EXPORTACION = [
  {
    id: 'pdf',
    nombre: 'PDF',
    descripcion: 'Documento PDF con formato profesional',
    icon: FileText,
    color: 'red'
  },
  {
    id: 'excel',
    nombre: 'Excel',
    descripcion: 'Hoja de cálculo con datos tabulares',
    icon: FileSpreadsheet,
    color: 'green'
  },
  {
    id: 'whatsapp',
    nombre: 'WhatsApp',
    descripcion: 'Mensaje formateado para WhatsApp',
    icon: MessageCircle,
    color: 'emerald'
  },
  {
    id: 'email',
    nombre: 'Email',
    descripcion: 'Correo electrónico con datos adjuntos',
    icon: Mail,
    color: 'blue'
  },
  {
    id: 'impresion',
    nombre: 'Imprimir',
    descripcion: 'Imprimir directamente',
    icon: Printer,
    color: 'gray'
  }
];

export default function ExportacionCompleta({ datos, tipo, onClose }: ExportacionCompletaProps) {
  const [formatoSeleccionado, setFormatoSeleccionado] = useState<string>('');
  const [exportando, setExportando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [emailData, setEmailData] = useState({
    destinatario: '',
    asunto: `Reporte de ${tipo} - ${new Date().toLocaleDateString()}`,
    mensaje: ''
  });

  // Función principal de exportación
  const ejecutarExportacion = async () => {
    if (!formatoSeleccionado) {
      alert('Selecciona un formato de exportación');
      return;
    }

    setExportando(true);
    setProgreso(0);

    try {
      switch (formatoSeleccionado) {
        case 'pdf':
          await exportarPDF();
          break;
        case 'excel':
          await exportarExcel();
          break;
        case 'whatsapp':
          await exportarWhatsApp();
          break;
        case 'email':
          await exportarEmail();
          break;
        case 'impresion':
          await imprimirDirecto();
          break;
        default:
          throw new Error('Formato no soportado');
      }

      setProgreso(100);
      setTimeout(() => {
        setExportando(false);
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Error en exportación:', error);
      alert('Error al exportar. Inténtalo de nuevo.');
      setExportando(false);
      setProgreso(0);
    }
  };

  // Exportar a PDF con jsPDF
  const exportarPDF = async () => {
    setProgreso(20);
    
    try {
      const { default: jsPDF } = await import('jspdf');
      
      setProgreso(40);
      
      const pdf = new jsPDF();
      
      // Header del PDF
      (pdf as any).setFontSize(20);
      pdf.text(`Reporte de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`, 20, 30);
      
      (pdf as any).setFontSize(12);
      pdf.text(`Generado: ${new Date().toLocaleString()}`, 20, 45);
      pdf.text(`Total de registros: ${datos.length}`, 20, 55);
      
      setProgreso(60);
      
      // Datos de conductores
      let y = 75;
      const pageHeight = pdf.internal.pageSize.height;
      
      datos.forEach((conductor, index) => {
        if (y > pageHeight - 40) {
          pdf.addPage();
          y = 30;
        }
        
        (pdf as any).setFontSize(14);
        pdf.text(`${index + 1}. ${conductor.nombreCompleto}`, 20, y);
        
        (pdf as any).setFontSize(10);
        y += 10;
        pdf.text(`DNI: ${conductor.dni}`, 25, y);
        y += 8;
        pdf.text(`Teléfono: ${conductor.celular1}`, 25, y);
        y += 8;
        
        if (conductor.placaVehiculo) {
          pdf.text(`Vehículo: ${conductor.marcaVehiculo} ${conductor.modeloVehiculo} - ${conductor.placaVehiculo}`, 25, y);
          y += 8;
        }
        
        pdf.text(`Estado: ${conductor.estado}`, 25, y);
        y += 8;
        
        if (conductor.distrito_nombre) {
          pdf.text(`Distrito: ${conductor.distrito_nombre}`, 25, y);
          y += 8;
        }
        
        y += 5; // Espacio entre registros
      });
      
      setProgreso(80);
      
      // Footer
      const totalPages = (pdf.internal as any).getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        (pdf as any).setPage(i);
        (pdf as any).setFontSize(8);
        pdf.text(
          `ZURI Platform - Sistema NEMT | Página ${i} de ${totalPages}`,
          20,
          pageHeight - 20
        );
      }
      
      setProgreso(90);
      
      // Descargar PDF
      const nombreArchivo = `${tipo}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(nombreArchivo);
      
    } catch (error) {
      throw new Error(`Error al generar PDF: ${error}`);
    }
  };

  // Exportar a Excel
  const exportarExcel = async () => {
    setProgreso(20);
    
    try {
      // Preparar datos para Excel
      const datosExcel = datos.map(conductor => ({
        'DNI': conductor.dni,
        'Nombre Completo': conductor.nombreCompleto,
        'Teléfono': conductor.celular1,
        'Email': conductor.email || '',
        'Dirección': conductor.direccionCompleta || '',
        'Distrito': conductor.distrito_nombre || '',
        'Marca Vehículo': conductor.marcaVehiculo || '',
        'Modelo Vehículo': conductor.modeloVehiculo || '',
        'Placa': conductor.placaVehiculo || '',
        'Estado': conductor.estado,
        'Calificación': conductor.calificacionPromedio || 0,
        'Total Viajes': conductor.totalViajes || 0,
        'Fecha Creación': conductor.fechaCreacion || ''
      }));
      
      setProgreso(60);
      
      // Convertir a CSV (compatible con Excel)
      const headers = Object.keys(datosExcel[0] || {});
      const csvContent = [
        headers.join(','),
        ...datosExcel.map(row => 
          headers.map(header => `"${(row as any)[header] || ''}"`).join(',')
        )
      ].join('\n');
      
      setProgreso(80);
      
      // Crear blob y descargar
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const nombreArchivo = `${tipo}_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', nombreArchivo);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setProgreso(90);
      
    } catch (error) {
      throw new Error(`Error al generar Excel: ${error}`);
    }
  };

  // Exportar a WhatsApp
  const exportarWhatsApp = async () => {
    setProgreso(30);
    
    try {
      const resumen = `🚗 *REPORTE ZURI - ${tipo.toUpperCase()}*\n\n`;
      const fecha = `📅 *Fecha:* ${new Date().toLocaleDateString()}\n`;
      const total = `📊 *Total:* ${datos.length} registros\n\n`;
      
      setProgreso(60);
      
      let mensaje = resumen + fecha + total;
      
      // Agregar top 5 conductores
      mensaje += `🏆 *TOP ${Math.min(5, datos.length)} CONDUCTORES:*\n\n`;
      
      datos.slice(0, 5).forEach((conductor, index) => {
        mensaje += `${index + 1}️⃣ *${conductor.nombreCompleto}*\n`;
        mensaje += `   📱 ${conductor.celular1}\n`;
        mensaje += `   🚗 ${conductor.placaVehiculo || 'Sin placa'}\n`;
        mensaje += `   📍 ${conductor.distrito_nombre || 'Sin distrito'}\n`;
        mensaje += `   ⭐ ${Number(conductor.calificacionPromedio || 0).toFixed(1)}/5\n\n`;
      });
      
      setProgreso(80);
      
      if (datos.length > 5) {
        mensaje += `➕ *Y ${datos.length - 5} conductores más...*\n\n`;
      }
      
      mensaje += `📱 _Generado por ZURI Platform_\n`;
      mensaje += `🌐 admin.zuri.pe`;
      
      setProgreso(90);
      
      // Abrir WhatsApp Web con mensaje
      const mensajeCodificado = encodeURIComponent(mensaje);
      const urlWhatsApp = `https://wa.me/?text=${mensajeCodificado}`;
      
      window.open(urlWhatsApp, '_blank');
      
    } catch (error) {
      throw new Error(`Error al generar mensaje WhatsApp: ${error}`);
    }
  };

  // Exportar por Email
  const exportarEmail = async () => {
    if (!emailData.destinatario) {
      alert('Ingresa un destinatario para el email');
      return;
    }
    
    setProgreso(30);
    
    try {
      // Crear contenido del email en HTML
      let contenidoHTML = `
        <h2>Reporte de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</h2>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total de registros:</strong> ${datos.length}</p>
        
        <table border="1" style="border-collapse: collapse; width: 100%; margin-top: 20px;">
          <thead style="background-color: #f3f4f6;">
            <tr>
              <th style="padding: 8px;">Nombre</th>
              <th style="padding: 8px;">DNI</th>
              <th style="padding: 8px;">Teléfono</th>
              <th style="padding: 8px;">Vehículo</th>
              <th style="padding: 8px;">Estado</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      setProgreso(60);
      
      datos.forEach(conductor => {
        contenidoHTML += `
          <tr>
            <td style="padding: 8px;">${conductor.nombreCompleto}</td>
            <td style="padding: 8px;">${conductor.dni}</td>
            <td style="padding: 8px;">${conductor.celular1}</td>
            <td style="padding: 8px;">${conductor.marcaVehiculo || ''} ${conductor.modeloVehiculo || ''}</td>
            <td style="padding: 8px;">${conductor.estado}</td>
          </tr>
        `;
      });
      
      contenidoHTML += `
          </tbody>
        </table>
        
        <p style="margin-top: 20px; font-size: 12px; color: #666;">
          <em>Generado por ZURI Platform - Sistema NEMT</em><br>
          <a href="https://admin.zuri.pe">admin.zuri.pe</a>
        </p>
      `;
      
      setProgreso(80);
      
      // Crear mailto link
      const asunto = encodeURIComponent(emailData.asunto);
      const cuerpo = encodeURIComponent(`${emailData.mensaje}\n\nVer datos adjuntos en el reporte HTML.`);
      const mailtoURL = `mailto:${emailData.destinatario}?subject=${asunto}&body=${cuerpo}`;
      
      setProgreso(90);
      
      // Abrir cliente de email
      window.open(mailtoURL);
      
      // También descargar HTML como backup
      const blob = new Blob([contenidoHTML], { type: 'text/html' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `${tipo}_reporte.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      throw new Error(`Error al enviar email: ${error}`);
    }
  };

  // Imprimir directamente
  const imprimirDirecto = async () => {
    setProgreso(20);
    
    try {
      // Crear contenido para impresión
      const contenido = `
        <html>
          <head>
            <title>Reporte de ${tipo}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
              .header { margin-bottom: 30px; }
              .conductor { margin-bottom: 20px; padding: 15px; border: 1px solid #d1d5db; border-radius: 8px; }
              .nombre { font-weight: bold; font-size: 16px; color: #1f2937; }
              .detalle { margin: 5px 0; font-size: 14px; color: #4b5563; }
              .estado { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
              .activo { background-color: #d1fae5; color: #065f46; }
              .inactivo { background-color: #fee2e2; color: #991b1b; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Reporte de ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}</h1>
              <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Total de registros:</strong> ${datos.length}</p>
            </div>
            
            <div class="contenido">
              ${datos.map(conductor => `
                <div class="conductor">
                  <div class="nombre">${conductor.nombreCompleto}</div>
                  <div class="detalle">DNI: ${conductor.dni}</div>
                  <div class="detalle">Teléfono: ${conductor.celular1}</div>
                  ${conductor.placaVehiculo ? `<div class="detalle">Vehículo: ${conductor.marcaVehiculo || ''} ${conductor.modeloVehiculo || ''} - ${conductor.placaVehiculo}</div>` : ''}
                  <div class="detalle">
                    Estado: <span class="estado ${conductor.estado}">${conductor.estado}</span>
                  </div>
                  ${conductor.distrito_nombre ? `<div class="detalle">Distrito: ${conductor.distrito_nombre}</div>` : ''}
                  ${conductor.calificacionPromedio ? `<div class="detalle">Calificación: ⭐ ${Number(conductor.calificacionPromedio).toFixed(1)}/5</div>` : ''}
                </div>
              `).join('')}
            </div>
            
            <div class="footer">
              <p>ZURI Platform - Sistema NEMT | admin.zuri.pe</p>
            </div>
          </body>
        </html>
      `;
      
      setProgreso(60);
      
      // Crear ventana de impresión
      const ventanaImpresion = window.open('', '_blank', 'width=800,height=600');
      if (!ventanaImpresion) {
        throw new Error('No se pudo abrir ventana de impresión');
      }
      
      setProgreso(80);
      
      ventanaImpresion.document.write(contenido);
      ventanaImpresion.document.close();
      
      setProgreso(90);
      
      // Esperar a que se cargue y luego imprimir
      ventanaImpresion.onload = () => {
        ventanaImpresion.print();
      };
      
    } catch (error) {
      throw new Error(`Error al imprimir: ${error}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Share className="h-6 w-6 text-blue-600" />
              Exportar Datos
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {datos.length} registros de {tipo} listos para exportar
          </p>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto">
          
          {/* Selección de formato */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Selecciona el formato de exportación
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {FORMATOS_EXPORTACION.map((formato) => {
                const Icon = formato.icon;
                const isSelected = formatoSeleccionado === formato.id;
                
                return (
                  <button
                    key={formato.id}
                    onClick={() => setFormatoSeleccionado(formato.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                      isSelected 
                        ? `border-${formato.color}-500 bg-${formato.color}-50 ring-2 ring-${formato.color}-200`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`h-6 w-6 ${isSelected ? `text-${formato.color}-600` : 'text-gray-500'}`} />
                      <span className={`font-semibold ${isSelected ? `text-${formato.color}-700` : 'text-gray-700'}`}>
                        {formato.nombre}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formato.descripcion}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configuraciones específicas */}
          {formatoSeleccionado === 'email' && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-3">Configuración de Email</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Destinatario *
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="ejemplo@empresa.com"
                    value={emailData.destinatario}
                    onChange={(e) => setEmailData({...emailData, destinatario: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Asunto
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={emailData.asunto}
                    onChange={(e) => setEmailData({...emailData, asunto: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-1">
                    Mensaje (opcional)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Mensaje adicional..."
                    value={emailData.mensaje}
                    onChange={(e) => setEmailData({...emailData, mensaje: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Barra de progreso durante exportación */}
          {exportando && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="font-medium">Procesando exportación...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progreso}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {progreso}% completado
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {datos.length} registros seleccionados
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={exportando}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              
              <button
                onClick={ejecutarExportacion}
                disabled={!formatoSeleccionado || exportando}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {exportando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Exportar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}