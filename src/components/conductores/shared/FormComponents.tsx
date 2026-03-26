import React from 'react';

export const TabButton = ({ active, onClick, label, icon: Icon }: any) => (
    <button
        type="button"
        onClick={onClick}
        className={`relative flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all duration-300 border-b-3 whitespace-nowrap group ${active
            ? 'border-blue-600 text-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50/30 shadow-sm'
            : 'border-transparent text-slate-400 hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100/50 hover:text-slate-600'
            }`}
    >
        <Icon size={16} className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-105'}`} />
        {label}
        {active && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse" />
        )}
    </button>
);

export const InputField = ({ label, value, onChange, type = "text", placeholder, disabled = false, error, maxLength }: any) => (
    <div className="flex flex-col gap-1 w-full">
        <div className="flex justify-between">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{label}</label>
            {error && <span className="text-[10px] text-red-500 font-bold uppercase animate-pulse">{error}</span>}
        </div>
        <input
            type={type}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            className={`w-full p-3 bg-white border rounded-lg outline-none transition-all text-sm font-medium text-slate-700 shadow-sm
        ${error ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-red-50/10' : 'border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}
        ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}
      `}
        />
    </div>
);

export const SelectField = ({ label, value, onChange, options, disabled = false, placeholder = "Seleccionar..." }: any) => (
    <div className="flex flex-col gap-1 w-full">
        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{label}</label>
        <select
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm font-medium text-slate-700 shadow-sm"
        >
            <option value="">{placeholder}</option>
            {options.map((opt: any) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);
