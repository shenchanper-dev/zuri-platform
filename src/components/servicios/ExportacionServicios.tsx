'use client';

import React, { useState } from 'react';
import {
  X,
  FileText,
  MessageCircle,
  Printer,
  Download,
  Loader2,
  Share,
  FileSpreadsheet
} from 'lucide-react';

interface ServicioExport {
  id: number;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  doctor_nombre: string;
  paciente_nombre: string | null;
  tipo_servicio: string | null;
  distrito: string | null;
  direccion_recojo: string | null;
  direccion_destino: string | null;
  conductor_nombre: string | null;
  placa: string | null;
  estado: string | null;
}

interface ExportacionServiciosProps {
  datos: ServicioExport[];
  fecha: string;
  onClose: () => void;
}

const FORMATOS = [
  { id: 'pdf', nombre: 'PDF', desc: 'Documento PDF profesional', icon: FileText, color: 'text-red-600', bg: 'border-red-500 bg-red-50' },
  { id: 'excel', nombre: 'Excel', desc: 'Hoja de cálculo CSV', icon: FileSpreadsheet, color: 'text-green-600', bg: 'border-green-500 bg-green-50' },
  { id: 'whatsapp', nombre: 'WhatsApp', desc: 'Resumen para WhatsApp', icon: MessageCircle, color: 'text-emerald-600', bg: 'border-emerald-500 bg-emerald-50' },
  { id: 'impresion', nombre: 'Imprimir', desc: 'Imprimir directamente', icon: Printer, color: 'text-gray-600', bg: 'border-gray-500 bg-gray-50' },
];

export default function ExportacionServicios({ datos, fecha, onClose }: ExportacionServiciosProps) {
  const [formato, setFormato] = useState('');
  const [exportando, setExportando] = useState(false);
  const [progreso, setProgreso] = useState(0);

  const exportar = async () => {
    if (!formato) return;
    setExportando(true);
    setProgreso(0);

    try {
      switch (formato) {
        case 'pdf': await exportarPDF(); break;
        case 'excel': await exportarExcel(); break;
        case 'whatsapp': await exportarWhatsApp(); break;
        case 'impresion': await imprimir(); break;
      }
      setProgreso(100);
      setTimeout(() => { setExportando(false); onClose(); }, 800);
    } catch (err) {
      console.error('Error exportación:', err);
      alert('Error al exportar. Inténtalo de nuevo.');
      setExportando(false);
      setProgreso(0);
    }
  };

  const exportarPDF = async () => {
    setProgreso(20);
    const { default: jsPDF } = await import('jspdf');
    setProgreso(40);

    const pdf = new jsPDF();
    (pdf as any).setFontSize(18);
    pdf.text('Servicios JPSAC', 20, 25);
    (pdf as any).setFontSize(11);
    pdf.text(`Fecha: ${fecha}  |  Total: ${datos.length} servicios`, 20, 35);
    pdf.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 20, 42);

    setProgreso(60);

    let y = 58;
    const pageH = pdf.internal.pageSize.height;

    datos.forEach((s, i) => {
      if (y > pageH - 35) { pdf.addPage(); y = 25; }
      (pdf as any).setFontSize(12);
      pdf.text(`${i + 1}. ${s.paciente_nombre || 'Sin paciente'} - ${s.tipo_servicio || 'N/A'}`, 20, y);
      (pdf as any).setFontSize(9);
      y += 8;
      pdf.text(`Doctor: ${s.doctor_nombre}  |  Hora: ${s.hora_inicio || '--'}`, 25, y);
      y += 7;
      pdf.text(`Recojo: ${s.direccion_recojo || s.distrito || '--'}`, 25, y);
      y += 7;
      if (s.conductor_nombre) {
        pdf.text(`Conductor: ${s.conductor_nombre} (${s.placa || '--'})`, 25, y);
        y += 7;
      }
      pdf.text(`Estado: ${s.estado || 'pendiente'}`, 25, y);
      y += 10;
    });

    setProgreso(85);
    const pages = (pdf.internal as any).getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      (pdf as any).setPage(i);
      (pdf as any).setFontSize(8);
      pdf.text(`ZURI Platform - JPSAC | Pag ${i}/${pages}`, 20, pageH - 15);
    }

    pdf.save(`servicios_jpsac_${fecha}.pdf`);
    setProgreso(95);
  };

  const exportarExcel = async () => {
    setProgreso(30);

    const headers = ['#', 'Fecha', 'Hora', 'Paciente', 'Doctor', 'Tipo Servicio', 'Distrito', 'Dir. Recojo', 'Dir. Destino', 'Conductor', 'Placa', 'Estado'];
    const rows = datos.map((s, i) => [
      i + 1, s.fecha, s.hora_inicio || '', s.paciente_nombre || '', s.doctor_nombre,
      s.tipo_servicio || '', s.distrito || '', s.direccion_recojo || '',
      s.direccion_destino || '', s.conductor_nombre || '', s.placa || '', s.estado || 'pendiente'
    ]);

    setProgreso(60);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `servicios_jpsac_${fecha}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setProgreso(95);
  };

  const exportarWhatsApp = async () => {
    setProgreso(30);

    const porTipo: Record<string, number> = {};
    datos.forEach(s => {
      const t = s.tipo_servicio || 'Sin tipo';
      porTipo[t] = (porTipo[t] || 0) + 1;
    });

    let msg = `*SERVICIOS JPSAC - ${fecha}*\n\n`;
    msg += `Total: ${datos.length} servicios\n\n`;
    msg += `*Por tipo:*\n`;
    Object.entries(porTipo).forEach(([tipo, cant]) => {
      msg += `  - ${tipo}: ${cant}\n`;
    });
    msg += `\n*Detalle (primeros 10):*\n\n`;

    datos.slice(0, 10).forEach((s, i) => {
      msg += `${i + 1}. *${s.paciente_nombre || 'N/A'}*\n`;
      msg += `   ${s.tipo_servicio || 'N/A'} | Dr. ${s.doctor_nombre}\n`;
      msg += `   ${s.hora_inicio || '--'} | ${s.distrito || ''}\n`;
      if (s.conductor_nombre) msg += `   Conductor: ${s.conductor_nombre}\n`;
      msg += `\n`;
    });

    if (datos.length > 10) msg += `... y ${datos.length - 10} más\n\n`;
    msg += `_ZURI Platform - admin.zuri.pe_`;

    setProgreso(80);
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    setProgreso(95);
  };

  const imprimir = async () => {
    setProgreso(30);

    const html = `<html><head><title>Servicios JPSAC - ${fecha}</title>
      <style>
        body{font-family:Arial,sans-serif;margin:20px;color:#1f2937}
        h1{font-size:20px;border-bottom:2px solid #3b82f6;padding-bottom:8px}
        .meta{color:#6b7280;margin-bottom:16px;font-size:13px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th{background:#f3f4f6;text-align:left;padding:8px;border:1px solid #d1d5db}
        td{padding:6px 8px;border:1px solid #e5e7eb}
        tr:nth-child(even){background:#f9fafb}
        .footer{margin-top:20px;text-align:center;font-size:10px;color:#9ca3af}
      </style></head><body>
      <h1>Servicios JPSAC</h1>
      <div class="meta">Fecha: ${fecha} | Total: ${datos.length} servicios | Generado: ${new Date().toLocaleString('es-PE')}</div>
      <table><thead><tr>
        <th>#</th><th>Hora</th><th>Paciente</th><th>Doctor</th><th>Tipo</th><th>Distrito</th><th>Conductor</th><th>Estado</th>
      </tr></thead><tbody>
      ${datos.map((s, i) => `<tr>
        <td>${i + 1}</td><td>${s.hora_inicio || '--'}</td><td>${s.paciente_nombre || '--'}</td>
        <td>${s.doctor_nombre}</td><td>${s.tipo_servicio || '--'}</td><td>${s.distrito || '--'}</td>
        <td>${s.conductor_nombre || '--'}</td><td>${s.estado || 'pendiente'}</td>
      </tr>`).join('')}
      </tbody></table>
      <div class="footer">ZURI Platform - Sistema de Gestión de Salud | admin.zuri.pe</div>
      </body></html>`;

    setProgreso(70);
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) throw new Error('Popup bloqueado');
    w.document.write(html);
    w.document.close();
    w.onload = () => w.print();
    setProgreso(95);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Share className="h-5 w-5 text-blue-600" />
              Exportar Servicios
            </h2>
            <p className="text-sm text-gray-500">{datos.length} servicios del {fecha}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        {/* Format selection */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-3 mb-5">
            {FORMATOS.map((f) => {
              const Icon = f.icon;
              const sel = formato === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFormato(f.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${sel ? f.bg + ' ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <Icon className={`h-6 w-6 mb-1 ${sel ? f.color : 'text-gray-400'}`} />
                  <div className="font-semibold text-sm text-gray-800">{f.nombre}</div>
                  <div className="text-xs text-gray-500">{f.desc}</div>
                </button>
              );
            })}
          </div>

          {exportando && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-1.5">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium">Exportando...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progreso}%` }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t flex justify-end gap-3">
          <button onClick={onClose} disabled={exportando} className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-100 text-sm disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={exportar} disabled={!formato || exportando} className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50">
            {exportando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exportando ? 'Exportando...' : 'Exportar'}
          </button>
        </div>
      </div>
    </div>
  );
}
