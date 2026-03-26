'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Download, Search, Filter } from 'lucide-react';
import useConductores from '@/hooks/useConductores';
import ConductorModalNEMT from '../modals/ConductorModalNEMT';
import ExportacionCompleta from '../export/ExportacionCompleta';

// URL base del backend para las imágenes
const API_ASSETS_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zuri.pe';

export default function ConductoresList() {
  const { conductores, loading, obtenerConductores } = useConductores();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedConductor, setSelectedConductor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [distritoFilter, setDistritoFilter] = useState('');
  const [distritos, setDistritos] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/distritos?activo=true')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.distritos) setDistritos(data.distritos);
      })
      .catch(err => console.error('Error loading districts:', err));
  }, []);

  // Helper para resolver la URL de la imagen
  const getImageUrl = (path: string) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('data:')) return path;

    // Si ya empieza con /api/uploads (nuevo estándar) return path
    if (path.startsWith('/api/uploads')) return path;

    // Si ya empieza con /uploads no agregar prefijo
    if (path.startsWith('/uploads')) return path;

    return `/uploads/${path}`;
  };

  const filteredConductores = conductores.filter((c: any) => {
    const matchesSearch = !searchTerm ||
      c.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.dni?.includes(searchTerm) ||
      c.placa?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && (!distritoFilter || String(c.distritoId) === distritoFilter);
  });

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen font-sans">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-600 tracking-tight">Gestión de Flota NEMT</h1>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">Identidad y Documentación</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsExportOpen(true)} className="flex items-center gap-2 px-5 py-3 border-2 border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-white transition-all shadow-sm"><Download size={18} /> Exportar</button>
          <button onClick={() => { setSelectedConductor(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black shadow-lg shadow-blue-200 hover:shadow-xl transition-all active:scale-95"><Plus size={20} /> NUEVO CONDUCTOR</button>
        </div>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-400 transition-all font-medium" />
        </div>
        <div className="relative min-w-[250px]">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <select value={distritoFilter} onChange={(e) => setDistritoFilter(e.target.value)} className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-700 bg-white appearance-none cursor-pointer">
            <option value="">Todos los Distritos</option>
            {distritos.map((d: any) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white border-2 border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b-2 border-slate-200">
            <tr>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Conductor</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Teléfono</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Vehículo</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Placa</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Distrito</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Calificación</th>
              <th className="px-6 py-5">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredConductores.map((c: any) => (
              <tr key={c.id} className="hover:bg-blue-50/30 transition-all duration-200 group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-100 shadow-sm bg-slate-100 flex items-center justify-center">
                      {c.foto ? (
                        <img
                          src={getImageUrl(c.foto)}
                          className="w-full h-full object-cover"
                          alt={c.nombreCompleto}
                          onError={(e: any) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div className={`${c.foto ? 'hidden' : 'flex'} w-full h-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-xs`}>
                        {c.nombreCompleto?.split(' ').map((n: any) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{c.nombreCompleto}</div>
                      <div className="text-xs text-slate-400">DNI: {c.dni}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${c.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {c.estado}
                  </span>
                </td>
                <td className="px-6 py-5 text-sm text-slate-600">{c.celular1 || '—'}</td>
                <td className="px-6 py-5 text-sm text-slate-600">{c.marcaVehiculo || '—'} {c.modeloVehiculo || ''}</td>
                <td className="px-6 py-5 text-sm font-mono text-slate-700">{c.placa || '—'}</td>
                <td className="px-6 py-5 text-sm text-slate-600">{c.distrito_nombre || '—'}</td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400">⭐</span>
                    <span className="text-sm font-bold">{(c.calificacionPromedio || 0).toFixed(1)}</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <button onClick={() => { setSelectedConductor(c); setIsModalOpen(true); }} className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all border-2 border-transparent hover:border-blue-600">
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConductorModalNEMT isOpen={isModalOpen} conductor={selectedConductor} onClose={() => setIsModalOpen(false)} onSuccess={obtenerConductores} />
      {isExportOpen && <ExportacionCompleta datos={conductores} tipo="conductores" onClose={() => setIsExportOpen(false)} />}
    </div>
  );
}