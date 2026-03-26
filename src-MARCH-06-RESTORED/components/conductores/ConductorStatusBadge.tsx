'use client';

/**
 * ConductorStatusBadge
 * Muestra el estado visual del conductor:
 *  - ACTIVO → badge verde
 *  - INACTIVO + < 7 días → badge rojo "NUEVO"
 *  - INACTIVO + >= 7 días → badge gris "Inactivo"
 *  - PENDIENTE / EN_PROCESO → badge amarillo "En revisión"
 */

interface ConductorStatusBadgeProps {
    estado: string;
    creadoEn?: string | Date | null;
    estadoRegistro?: string | null;
}

function daysSince(date: string | Date | null | undefined): number {
    if (!date) return 9999;
    const created = new Date(date);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

export function ConductorStatusBadge({
    estado,
    creadoEn,
    estadoRegistro,
}: ConductorStatusBadgeProps) {
    const estadoUpper = (estado || '').toUpperCase();
    const regUpper = (estadoRegistro || '').toUpperCase();
    const dias = daysSince(creadoEn);

    // --- Pendiente de aprobación (viene del driver app) ---
    if (regUpper === 'PENDIENTE' || regUpper === 'EN_PROCESO') {
        return (
            <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide"
                style={{ background: '#FEF9C3', color: '#92400E', border: '1px solid #FDE68A' }}
            >
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse inline-block" />
                En revisión
            </span>
        );
    }

    // --- WhatsApp Auto (pendiente verificación) ---
    if (estadoUpper === 'PENDIENTE_VERIFICACION') {
        return (
            <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide"
                style={{ background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}
            >
                <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ background: '#F97316' }} />
                WhatsApp Auto
            </span>
        );
    }

    // --- Activo ---
    if (estadoUpper === 'ACTIVO') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-100 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Activo
            </span>
        );
    }

    // --- Inactivo nuevo (< 7 días) ---
    if (estadoUpper === 'INACTIVO' && dias < 7) {
        return (
            <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide"
                style={{ background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA' }}
            >
                <span
                    className="w-1.5 h-1.5 rounded-full inline-block animate-pulse"
                    style={{ background: '#EF4444' }}
                />
                Nuevo
            </span>
        );
    }

    // --- Inactivo antiguo ---
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-slate-100 text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
            Inactivo
        </span>
    );
}
