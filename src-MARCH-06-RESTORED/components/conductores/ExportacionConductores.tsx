'use client';

import React, { useState } from 'react';
import {
  X, FileText, MessageCircle, Printer,
  Download, Loader2, Share, FileSpreadsheet
} from 'lucide-react';
interface ConductorExport {
  id: number;
  dni: string;
  nombre_completo: string;
  placa: string | null;
  telefono: string | null;
  distrito: string | null;
  estado: string;
  servicios: string;
  calificacion: number | null;
}

interface ExportacionConductoresProps {
  datos: ConductorExport[];
  total: number;
  onClose: () => void;
}

const FORMATOS = [
  { id: 'pdf', nombre: 'PDF', desc: 'Documento PDF profesional', icon: FileText, color: 'text-red-600', bg: 'border-red-500 bg-red-50' },
  { id: 'excel', nombre: 'Excel', desc: 'Hoja de cálculo CSV', icon: FileSpreadsheet, color: 'text-green-600', bg: 'border-green-500 bg-green-50' },
  { id: 'whatsapp', nombre: 'WhatsApp', desc: 'Resumen para WhatsApp', icon: MessageCircle, color: 'text-emerald-600', bg: 'border-emerald-500 bg-emerald-50' },
  { id: 'impresion', nombre: 'Imprimir', desc: 'Imprimir directamente', icon: Printer, color: 'text-gray-600', bg: 'border-gray-500 bg-gray-50' },
];

/** Convierte Conductor (o objeto API) a ConductorExport para exportación */
export function conductorToExport(c: any): ConductorExport {
  if (!c) return { id: 0, dni: '', nombre_completo: '—', placa: null, telefono: null, distrito: null, estado: 'N/A', servicios: '', calificacion: null };

  const cx = c as any;

  // Mapeo robusto de nombre
  const nombre = cx.nombreCompleto || cx.nombre_completo || cx.nombre || '';
  const fallbackNombre = `${cx.nombres || ''} ${cx.apellidos || ''}`.trim();

  // Mapeo robusto de teléfono
  const tel = cx.celular1 || cx.telefono || cx.celular || cx.celular_1 || null;

  // Mapeo de vehículo (placa o marca/modelo si no hay placa)
  let vehiculo = cx.placa || cx.placaVehiculo || cx.vehiculo_placa || null;
  if (!vehiculo && (cx.marcaVehiculo || cx.modeloVehiculo)) {
    vehiculo = `${cx.marcaVehiculo || ''} ${cx.modeloVehiculo || ''}`.trim();
  }

  // Mapeo de estado
  let status = cx.estado || 'INACTIVO';
  if (cx.activo === true) status = 'ACTIVO';
  if (cx.activo === false) status = 'INACTIVO';

  // Mapeo de servicios
  let servs = '';
  if (Array.isArray(cx.servicios)) {
    servs = cx.servicios.join(', ');
  } else if (cx.categoria_display) {
    servs = cx.categoria_display;
  } else if (cx.servicios) {
    servs = String(cx.servicios);
  }

  return {
    id: Number(cx.id) || 0,
    dni: String(cx.dni || ''),
    nombre_completo: nombre || fallbackNombre || '—',
    placa: vehiculo,
    telefono: tel,
    distrito: cx.distrito_nombre || cx.distrito || null,
    estado: String(status).toUpperCase(),
    servicios: servs,
    calificacion: cx.calificacionPromedio != null ? Number(cx.calificacionPromedio) : null,
  };
}

export default function ExportacionConductores({ datos, total, onClose }: ExportacionConductoresProps) {
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

  /* ─── PDF ─────────────────────────────────────────────────────────── */
  const exportarPDF = async () => {
    setProgreso(20);
    const { default: jsPDF } = await import('jspdf');
    setProgreso(40);

    const pdf = new jsPDF({ orientation: 'landscape' });
    const pageW = pdf.internal.pageSize.width;
    const pageH = pdf.internal.pageSize.height;

    (pdf as any).setFillColor(37, 99, 235);
    pdf.rect(0, 0, pageW, 18, 'F');
    (pdf as any).setFontSize(14);
    (pdf as any).setTextColor(255, 255, 255);
    pdf.text('ZURI Platform — Listado de Conductores', 14, 12);
    (pdf as any).setFontSize(9);
    pdf.text(`Generado: ${new Date().toLocaleString('es-PE')}  |  Total: ${datos.length} conductores`, pageW - 14, 12, { align: 'right' });

    setProgreso(55);

    const cols = [
      { label: 'DNI', x: 14, w: 22 },
      { label: 'Nombre', x: 38, w: 55 },
      { label: 'Placa', x: 95, w: 25 },
      { label: 'Teléfono', x: 122, w: 30 },
      { label: 'Distrito', x: 154, w: 40 },
      { label: 'Servicios', x: 196, w: 45 },
      { label: 'Estado', x: 243, w: 22 },
    ];

    let y = 28;

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
      pdf.text(d.dni || '—', cols[0].x, y);
      pdf.text((d.nombre_completo || '—').substring(0, 30), cols[1].x, y);
      pdf.text(d.placa || '—', cols[2].x, y);
      pdf.text((d.telefono || '—').substring(0, 14), cols[3].x, y);
      pdf.text((d.distrito || 'N/A').substring(0, 18), cols[4].x, y);
      pdf.text((d.servicios || '—').substring(0, 22), cols[5].x, y);

      if (d.estado === 'ACTIVO') (pdf as any).setTextColor(5, 150, 105);
      else (pdf as any).setTextColor(107, 114, 128);
      pdf.text(d.estado || '—', cols[6].x, y);
      (pdf as any).setTextColor(31, 41, 55);

      y += 7;
    });

    const pages = (pdf.internal as any).getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      (pdf as any).setPage(i);
      (pdf as any).setFontSize(7);
      (pdf as any).setTextColor(156, 163, 175);
      pdf.text(`ZURI Platform — admin.zuri.pe | Pág. ${i}/${pages}`, 14, pageH - 6);
    }

    setProgreso(90);
    pdf.save(`conductores_${fechaArchivo}.pdf`);
  };

  /* ─── Excel / CSV ─────────────────────────────────────────────────── */
  const exportarExcel = async () => {
    setProgreso(30);
    const headers = ['#', 'DNI', 'Nombre Completo', 'Placa', 'Teléfono', 'Distrito', 'Servicios', 'Calificación', 'Estado'];
    const rows = datos.map((d, i) => [
      i + 1,
      d.dni || '',
      d.nombre_completo || '',
      d.placa || '',
      d.telefono || '',
      d.distrito || '',
      d.servicios || '',
      d.calificacion ?? '',
      d.estado || '',
    ]);

    setProgreso(65);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v)}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `conductores_${fechaArchivo}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setProgreso(95);
  };

  /* ─── WhatsApp ─────────────────────────────────────────────────────── */
  const exportarWhatsApp = async () => {
    setProgreso(30);

    const porEstado: Record<string, number> = {};
    datos.forEach(d => {
      porEstado[d.estado] = (porEstado[d.estado] || 0) + 1;
    });
    const estadosStr = Object.entries(porEstado).map(([e, c]) => `${e}: ${c}`).join(', ');

    let msg = `*CONDUCTORES ZURI — ${fecha}*\n\n`;
    msg += `📋 Total: *${datos.length} conductores*\n\n`;
    msg += `*Por estado:* ${estadosStr}\n\n`;
    msg += `*Primeros 10 registros:*\n\n`;

    datos.slice(0, 10).forEach((d, i) => {
      msg += `${i + 1}. *${d.nombre_completo || 'N/A'}*\n`;
      msg += `   DNI: ${d.dni} | Placa: ${d.placa || 'N/A'}\n`;
      if (d.telefono) msg += `   📱 ${d.telefono}\n`;
      msg += `\n`;
    });

    if (datos.length > 10) msg += `_...y ${datos.length - 10} conductores más_\n\n`;
    msg += `_ZURI Platform — admin.zuri.pe_`;

    setProgreso(80);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
    setProgreso(95);
  };

  /* ─── Imprimir ─────────────────────────────────────────────────────── */
  const imprimir = async () => {
    setProgreso(30);

    const html = `<html><head><title>Conductores ZURI - ${fecha}</title>
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
      <h1>🚗 Listado de Conductores — ZURI</h1>
      <div class="meta">Fecha: ${fecha} | Total: ${datos.length} conductores | Generado: ${new Date().toLocaleString('es-PE')}</div>
      <table>
        <thead><tr>
          <th>#</th><th>DNI</th><th>Nombre Completo</th><th>Placa</th><th>Teléfono</th><th>Distrito</th><th>Estado</th>
        </tr></thead>
        <tbody>
          ${datos.map((d, i) => `<tr>
            <td>${i + 1}</td>
            <td><strong>${d.dni || '—'}</strong></td>
            <td>${d.nombre_completo || '—'}</td>
            <td>${d.placa || '—'}</td>
            <td>${d.telefono || '—'}</td>
            <td>${d.distrito || 'N/A'}</td>
            <td><span class="${d.estado === 'ACTIVO' ? 'badge-activo' : 'badge-otro'}">${d.estado || '—'}</span></td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div class="footer">ZURI Platform — Sistema de Gestión de Conductores | admin.zuri.pe</div>
      </body></html>`;

    setProgreso(70);
    const w = window.open('', '_blank', 'width=1000,height=750');
    if (!w) throw new Error('Popup bloqueado — permite popups en este sitio');
    w.document.write(html);
    w.document.close();
    w.onload = () => { setTimeout(() => w.print(), 300); };
    setProgreso(95);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999]" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-xl max-w-lg w-full overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>

        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Share className="h-5 w-5 text-blue-600" />
              Exportar Conductores
            </h2>
            <p className="text-sm text-gray-500">{datos.length} conductores {total > datos.length ? `(de ${total} en total)` : ''}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

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
