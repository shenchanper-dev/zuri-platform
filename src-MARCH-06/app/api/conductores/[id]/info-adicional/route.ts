import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/conductores/[id]/info-adicional
 * VERSIÓN FINAL que funciona con campos REALES de la BD (incluyendo NEMT avanzado)
 */
export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const { Client } = await import('pg');
    const conductorId = parseInt(params.id);
    
    // Configuración de la base de datos (se asume que se lee de un .env en un entorno real)
    const client = new Client({
      connectionString: 'postgresql://postgres@localhost:5432/zuri_db'
    });
    
    await client.connect();
    
    // Consulta extendida que usa campos REALES de todas las tablas relacionadas
    const query = `
      SELECT 
        -- Información básica del conductor (campos REALES)
        c.id as conductor_id,
        c.dni,
        c."nombreCompleto" as "nombreCompleto",
        c.nombres,
        c.apellidos,
        c.celular1,
        c.celular2,
        c.email,
        c.estado,
        c.estado_servicio,
        c.domicilio,
        c."fechaNacimiento",
        c."numeroBrevete",
        c."marcaVehiculo",
        c.modelo,
        c.placa,
        c.propietario,
        c.estado_civil,
        c."numeroHijos",
        c."nombreContacto",
        c.celular_contacto,
        c.observaciones,
        c.latitud,
        c.longitud,
        c.ultima_ubicacion,
        c.foto_url,
        c.created_at,
        c.updated_at,

        -- NEMT AVANZADO (Nuevos campos de la tabla CONDUCTORES)
        c.certificaciones,
        c.fecha_certificacion_cpr as "fechaCertificacionCpr",
        c.fecha_vencimiento_cpr as "fechaVencimientoCpr",
        c.certificacion_primeros_auxilios as "certificacionPrimerosAuxilios",
        c.fecha_vencimiento_primeros_auxilios as "fechaVencimientoPrimerosAuxilios",
        c.licencia_medicamentos_controlados as "licenciaMedicamentosControlados",
        c.numero_licencia_medicamentos as "numeroLicenciaMedicamentos",
        c.documentos_vencidos as "documentosVencidos",
        c.transporte_silla_ruedas as "transporteSillaRuedas",
        c.transporte_camilla as "transporteCamilla",
        c.transporte_equipos_medicos as "transporteEquiposMedicos",
        c.transporte_oxigeno as "transporteOxigeno",
        c.transporte_dialisis as "transporteDialisis",
        c.transporte_quimioterapia as "transporteQuimioterapia",
        c.transporte_psiquiatrico as "transportePsiquiatrico",
        c.transporte_pediatrico as "transportePediatrico",
        c.transporte_geriatrico as "transporteGeriatrico",
        c.vehiculo_modificado as "vehiculoModificado",
        c.rampa_acceso as "rampaAcceso",
        c.espacio_silla_ruedas as "espacioSillaRuedas",
        c.camillas_disponibles as "camillasDisponibles",
        c.equipo_oxigeno as "equipoOxigeno",
        c.equipo_succiona as "equipoSucciona",
        c.equipo_monitor_signos as "equipoMonitorSignos",
        c.climatizacion_especial as "climatizacionEspecial",
        c.experiencia_nemt_anios as "experienciaNemtAnios",
        c.calificacion_promedio as "calificacionPromedioConductor", -- Renombrado para no chocar con la calificación de evaluaciones
        c.numero_viajes_completados as "numeroViajesCompletados",
        c.idiomas_adicionales as "idiomasAdicionales",
        
        -- Información adicional (puede estar NULL si no existe)
        ci.turno_preferido,
        ci.disponible_feriados,
        ci.disponible_fines_semana,
        ci.disponible_emergencias,
        ci.horario_inicio,
        ci.horario_fin,
        ci.radio_operacion_km,
        ci.zonas_trabajo,
        ci.dispositivo_gps_asignado,
        ci.ultima_sincronizacion_gps,
        ci.velocidad_promedio,
        ci.kilometraje_mensual,
        ci.consumo_combustible,
        ci.foto_perfil,
        ci.foto_perfil_filename,
        ci.fecha_actualizacion_foto,
        ci.certificacion_primeros_auxilios as "ci_certificacion_primeros_auxilios", -- Posible campo duplicado, se mantiene por si es de tabla antigua
        ci.fecha_cert_primeros_auxilios,
        ci.certificacion_cpr as "ci_certificacion_cpr", -- Posible campo duplicado, se mantiene por si es de tabla antigua
        ci.fecha_cert_cpr,
        ci.autorizado_silla_ruedas,
        ci.autorizado_camilla,
        ci.autorizado_oxigeno,
        
        -- Vehículo info (puede estar NULL)
        vi.placa as vehiculo_placa,
        vi.marca as vehiculo_marca,
        vi.modelo as vehiculo_modelo,
        vi.año as vehiculo_año,
        vi.color as vehiculo_color,
        vi.estado_vehiculo,
        vi.capacidad_pasajeros,
        vi.tiene_aire_acondicionado,
        vi.adaptado_discapacidad,
        vi.fecha_venc_soat,
        vi.fecha_venc_seguro,
        vi.kilometraje_actual,
        
        -- Última evaluación (puede estar NULL)
        eq.calificacion_general,
        eq.fecha_evaluacion,
        eq.tipo_evaluacion,
        eq.evaluador,
        eq.puntualidad,
        eq.presentacion_personal,
        eq.trato_paciente,
        eq.conocimiento_rutas,
        eq.manejo_vehicular
        
      FROM conductores c
      LEFT JOIN conductor_info_adicional ci ON c.id = ci.conductor_id
      LEFT JOIN vehiculo_info vi ON c.id = vi.conductor_id
      LEFT JOIN evaluaciones_calidad eq ON c.id = eq.conductor_id 
        AND eq.fecha_evaluacion = (
          SELECT MAX(fecha_evaluacion) 
          FROM evaluaciones_calidad eq2 
          WHERE eq2.conductor_id = c.id
        )
      WHERE c.id = $1
    `;
    
    const result = await client.query(query, [conductorId]);
    
    if (result.rows.length === 0) {
      await client.end();
      return NextResponse.json(
        { error: 'Conductor no encontrado' }, 
        { status: 404 }
      );
    }

    // Se asume que el procesamiento de fechas/tipos de datos se hace en el frontend
    // o se maneja directamente con los tipos de la BD.

    await client.end();
    return NextResponse.json(result.rows[0]);

  } catch (error) {
    console.error('Error al obtener información adicional del conductor:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al consultar la base de datos' },
      { status: 500 }
    );
  }
}