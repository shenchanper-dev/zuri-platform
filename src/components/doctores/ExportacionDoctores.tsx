'use client';

import React, { useState } from 'react';
import {
  X, FileText, MessageCircle, Printer,
  Download, Loader2, Share, FileSpreadsheet
} from 'lucide-react';

interface DoctorExport {
  id: number;
  cmp: string;
  nombre_completo: string;
  especialidad_nombre: string | null;
  celular: string | null;
  email_profesional: string | null;
  estado: string;
  universidad: string | null;
  anos_experiencia: number | null;
  numero_clinicas: number;
  numero_pacientes: number;
}

interface ExportacionDoctoresProps {
  datos: DoctorExport[];
  total: number;
  onClose: () => void;
}

const FORMATOS = [
  { id: 'pdf',       nombre: 'PDF',       desc: 'Documento PDF profesional',  icon: FileText,       color: 'text-red-600',     bg: 'border-red-500 bg-red-50' },
  { id: 'excel',     nombre: 'Excel',     desc: 'Hoja de cálculo CSV',        icon: FileSpreadsheet, color: 'text-green-600',   bg: 'border-green-500 bg-green-50' },
  { id: 'whatsapp',  nombre: 'WhatsApp',  desc: 'Resumen para WhatsApp',      icon: MessageCircle,  color: 'text-emerald-600', bg: 'border-emerald-500 bg-emerald-50' },
  { id: 'impresion', nombre: 'Imprimir',  desc: 'Imprimir directamente',      icon: Printer,        color: 'text-gray-600',    bg: 'border-gray-500 bg-gray-50' },
];

export default function ExportacionDoctores({ datos, total, onClose }: ExportacionDoctoresProps) {
  const [formato, setFormato] = useState('');
  const [exportando, setExportando] = useState(false);
  const [progreso, setProgreso] = useState(0);

  const fecha = new Date().toLocaleDateString('es-PE');
  const fechaArchivo = new Date().toISOString().split('T')[0];

  const exportar = async () => {
    if (!formato) return;
    setExportando(true);
    setProgreso(0);
    try {
      switch (formato) {
        case 'pdf':       await exportarPDF();       break;
        case 'excel':     await exportarExcel();     break;
        case 'whatsapp':  await exportarWhatsApp();  break;
        case 'impresion': await imprimir();          break;
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

  /* ─── PDF ─────────────────────────────────────────────────────────── */
  const exportarPDF = async () => {
    setProgreso(20);
    const { default: jsPDF } = await import('jspdf');
    setProgreso(40);

    const pdf = new jsPDF({ orientation: 'landscape' });
    const pageW = pdf.internal.pageSize.width;
    const pageH = pdf.internal.pageSize.height;

    // Header
    (pdf as any).setFillColor(37, 99, 235);
    pdf.rect(0, 0, pageW, 18, 'F');
    (pdf as any).setFontSize(14);
    (pdf as any).setTextColor(255, 255, 255);
    pdf.text('ZURI Platform — Listado de Doctores', 14, 12);
    (pdf as any).setFontSize(9);
    pdf.text(`Generado: ${new Date().toLocaleString('es-PE')}  |  Total: ${datos.length} doctores`, pageW - 14, 12, { align: 'right' });

    setProgreso(55);

    // Columns
    const cols = [
      { label: 'CMP',          x: 14,  w: 20 },
      { label: 'Nombre Completo', x: 36, w: 60 },
      { label: 'Especialidad', x: 98,  w: 45 },
      { label: 'Celular',      x: 145, w: 30 },
      { label: 'Clínicas',     x: 177, w: 18 },
      { label: 'Pacientes',    x: 197, w: 20 },
      { label: 'Estado',       x: 219, w: 22 },
    ];

    let y = 28;

    // Table header
    (pdf as any).setFillColor(243, 244, 246);
    pdf.rect(12, y - 5, pageW - 24, 8, 'F');
    (pdf as any).setFontSize(8);
    (pdf as any).setTextColor(75, 85, 99);
    cols.forEach(c => pdf.text(c.label, c.x, y));
    y += 5;

    setProgreso(65);

    (pdf as any).setFontSize(8);
    datos.forEach((d, i) => {
      if (y > pageH - 20) {
        pdf.addPage();
        y = 20;
        // Re-print header
        (pdf as any).setFillColor(243, 244, 246);
        pdf.rect(12, y - 5, pageW - 24, 8, 'F');
        (pdf as any).setTextColor(75, 85, 99);
        cols.forEach(c => pdf.text(c.label, c.x, y));
        y += 5;
      }

      if (i % 2 === 0) {
        (pdf as any).setFillColor(249, 250, 251);
        pdf.rect(12, y - 4, pageW - 24, 7, 'F');
      }

      (pdf as any).setTextColor(31, 41, 55);
      pdf.text(d.cmp || '—', cols[0].x, y);
      pdf.text((d.nombre_completo || '—').substring(0, 35), cols[1].x, y);
      pdf.text((d.especialidad_nombre || 'N/A').substring(0, 25), cols[2].x, y);
      pdf.text(d.celular || '—', cols[3].x, y);
      pdf.text(String(d.numero_clinicas || 0), cols[4].x, y);
      pdf.text(String(d.numero_pacientes || 0), cols[5].x, y);

      // Estado badge color
      if (d.estado === 'ACTIVO') (pdf as any).setTextColor(5, 150, 105);
      else (pdf as any).setTextColor(107, 114, 128);
      pdf.text(d.estado || '—', cols[6].x, y);
      (pdf as any).setTextColor(31, 41, 55);

      y += 7;
    });

    // Footer
    const pages = (pdf.internal as any).getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      (pdf as any).setPage(i);
      (pdf as any).setFontSize(7);
      (pdf as any).setTextColor(156, 163, 175);
      pdf.text(`ZURI Platform — admin.zuri.pe | Pág. ${i}/${pages}`, 14, pageH - 6);
    }

    setProgreso(90);
    pdf.save(`doctores_${fechaArchivo}.pdf`);
  };

  /* ─── Excel / CSV ─────────────────────────────────────────────────── */
  const exportarExcel = async () => {
    setProgreso(30);
    const headers = ['#', 'CMP', 'Nombre Completo', 'Especialidad', 'Celular', 'Email', 'Universidad', 'Años Exp.', 'Clínicas', 'Pacientes', 'Estado'];
    const rows = datos.map((d, i) => [
      i + 1,
      d.cmp || '',
      d.nombre_completo || '',
      d.especialidad_nombre || '',
      d.celular || '',
      d.email_profesional || '',
      d.universidad || '',
      d.anos_experiencia ?? '',
      d.numero_clinicas || 0,
      d.numero_pacientes || 0,
      d.estado || '',
    ]);

    setProgreso(65);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `doctores_${fechaArchivo}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setProgreso(95);
  };

  /* ─── WhatsApp ─────────────────────────────────────────────────────── */
  const exportarWhatsApp = async () => {
    setProgreso(30);

    const porEspecialidad: Record<string, number> = {};
    datos.forEach(d => {
      const e = d.especialidad_nombre || 'Sin especialidad';
      porEspecialidad[e] = (porEspecialidad[e] || 0) + 1;
    });

    const top = Object.entries(porEspecialidad).sort((a, b) => b[1] - a[1]).slice(0, 8);

    let msg = `*DOCTORES ZURI — ${fecha}*\n\n`;
    msg += `📋 Total: *${datos.length} doctores*\n\n`;
    msg += `*Por especialidad:*\n`;
    top.forEach(([esp, cant]) => { msg += `  • ${esp}: ${cant}\n`; });
    msg += `\n*Primeros 10 registros:*\n\n`;

    datos.slice(0, 10).forEach((d, i) => {
      msg += `${i + 1}. *${d.nombre_completo || 'N/A'}*\n`;
      msg += `   CMP: ${d.cmp} | ${d.especialidad_nombre || 'Sin esp.'}\n`;
      if (d.celular) msg += `   📱 ${d.celular}\n`;
      msg += `\n`;
    });

    if (datos.length > 10) msg += `_...y ${datos.length - 10} doctores más_\n\n`;
    msg += `_ZURI Platform — admin.zuri.pe_`;

    setProgreso(80);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
    setProgreso(95);
  };

  /* ─── Imprimir ─────────────────────────────────────────────────────── */
  const imprimir = async () => {
    setProgreso(30);

    const html = `<html><head><title>Doctores ZURI - ${fecha}</title>
      <style>
        body{font-family:Arial,sans-serif;margin:20px;color:#1f2937;font-size:12px}
        h1{font-size:18px;border-bottom:2px solid #2563eb;padding-bottom:8px;color:#1e40af;margin-bottom:4px}
        .meta{color:#6b7280;margin-bottom:16px;font-size:11px}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th{background:#dbeafe;color:#1e40af;text-align:left;padding:7px 6px;border:1px solid #bfdbfe;font-size:10px}
        td{padding:5px 6px;border:1px solid #e5e7eb}
        tr:nth-child(even){background:#f9fafb}
        .badge-activo{color:#065f46;background:#d1fae5;padding:1px 6px;border-radius:999px;font-size:10px}
        .badge-otro{color:#374151;background:#f3f4f6;padding:1px 6px;border-radius:999px;font-size:10px}
        .footer{margin-top:20px;text-align:center;font-size:10px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:10px}
      </style></head><body>
      <h1>🩺 Listado de Doctores — ZURI</h1>
      <div class="meta">Fecha: ${fecha} | Total: ${datos.length} doctores | Generado: ${new Date().toLocaleString('es-PE')}</div>
      <table>
        <thead><tr>
          <th>#</th><th>CMP</th><th>Nombre Completo</th><th>Especialidad</th>
          <th>Celular</th><th>Clínicas</th><th>Estado</th>
        </tr></thead>
        <tbody>
          ${datos.map((d, i) => `<tr>
            <td>${i + 1}</td>
            <td><strong>${d.cmp || '—'}</strong></td>
            <td>${d.nombre_completo || '—'}</td>
            <td>${d.especialidad_nombre || 'N/A'}</td>
            <td>${d.celular || '—'}</td>
            <td style="text-align:center">${d.numero_clinicas || 0}</td>
            <td><span class="${d.estado === 'ACTIVO' ? 'badge-activo' : 'badge-otro'}">${d.estado || '—'}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div class="footer">ZURI Platform — Sistema de Gestión de Salud | admin.zuri.pe</div>
      </body></html>`;

    setProgreso(70);
    const w = window.open('', '_blank', 'width=1000,height=750');
    if (!w) throw new Error('Popup bloqueado — permite popups en este sitio');
    w.document.write(html);
    w.document.close();
    w.onload = () => { setTimeout(() => w.print(), 300); };
    setProgreso(95);
  };

  /* ─── RENDER ──────────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Share className="h-5 w-5 text-blue-600" />
              Exportar Doctores
            </h2>
            <p className="text-sm text-gray-500">{datos.length} doctores {total > datos.length ? `(de ${total} en total)` : ''}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Format grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-3 mb-5">
            {FORMATOS.map((f) => {
              const Icon = f.icon;
              const sel = formato === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFormato(f.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${sel ? f.bg + ' ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                >
                  <Icon className={`h-6 w-6 mb-1 ${sel ? f.color : 'text-gray-400'}`} />
                  <div className="font-semibold text-sm text-gray-800">{f.nombre}</div>
                  <div className="text-xs text-gray-500">{f.desc}</div>
                </button>
              );
            })}
          </div>

          {exportando && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-1.5">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Exportando...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progreso}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={exportando}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={exportar}
            disabled={!formato || exportando}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50 transition-colors"
          >
            {exportando
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Download className="h-4 w-4" />
            }
            {exportando ? 'Exportando...' : 'Exportar'}
          </button>
        </div>
      </div>
    </div>
  );
}
