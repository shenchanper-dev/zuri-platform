import { NextResponse } from 'next/server';
import { Client } from 'pg';

const DB_CONFIG = { connectionString: 'postgresql://postgres@localhost:5432/zuri_db' };

// ============================================================================
// GET /api/catalogos
// Returns all lookup tables in a single call for dropdown population
// ============================================================================
export async function GET() {
    const client = new Client(DB_CONFIG);
    try {
        await client.connect();

        const [
            areasRes,
            tiposRes,
            calificacionesRes,
            clientesRes,
            especialidadesRes,
            distritosRes,
            conductoresRes,
            doctoresRes,
        ] = await Promise.all([
            client.query("SELECT id, codigo, nombre FROM areas_servicio WHERE activo = true ORDER BY orden"),
            client.query("SELECT id, codigo, nombre, descripcion FROM tipos_servicio WHERE activo = true ORDER BY id"),
            client.query("SELECT id, codigo, descripcion, tipo, color FROM calificaciones WHERE activo = true ORDER BY id"),
            client.query("SELECT id, codigo, nombre, nombre_completo FROM clientes_especiales WHERE activo = true ORDER BY orden"),
            client.query("SELECT id, codigo, nombre, tipo FROM especialidades_medicas WHERE activo = true ORDER BY orden"),
            client.query("SELECT id, nombre FROM distritos ORDER BY nombre"),
            client.query(`SELECT id, "nombreCompleto", dni, placa, estado FROM conductores WHERE estado = 'ACTIVO' ORDER BY "nombreCompleto"`),
            client.query("SELECT id, nombres, apellido_paterno, apellido_materno, dni, cmp FROM doctores WHERE estado = 'ACTIVO' ORDER BY apellido_paterno, nombres"),
        ]);

        await client.end();

        return NextResponse.json({
            areas: areasRes.rows,
            tipos: tiposRes.rows,
            calificaciones: calificacionesRes.rows,
            clientes: clientesRes.rows,
            especialidades: especialidadesRes.rows,
            distritos: distritosRes.rows,
            conductores: conductoresRes.rows,
            doctores: doctoresRes.rows.map((d: any) => ({
                id: d.id,
                nombre: `${d.apellido_paterno || ''} ${d.apellido_materno || ''} ${d.nombres || ''}`.replace(/\s+/g, ' ').trim(),
                dni: d.dni,
                cmp: d.cmp
            })),
        });
    } catch (error: any) {
        try { await client.end(); } catch { }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
