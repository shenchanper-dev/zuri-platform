-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."EstadoConductor" AS ENUM ('ACTIVO', 'INACTIVO', 'EN_PERMISO', 'RETIRADO', 'SUSPENDIDO', 'VACACIONES', 'LICENCIA_MEDICA');

-- CreateEnum
CREATE TYPE "public"."EstadoTracking" AS ENUM ('DESCONECTADO', 'DISPONIBLE', 'EN_CAMINO', 'EN_ORIGEN', 'EN_TRANSPORTE', 'EN_DESTINO', 'RETORNANDO', 'NO_DISPONIBLE', 'EMERGENCIA');

-- CreateEnum
CREATE TYPE "public"."EstadoServicio" AS ENUM ('PENDIENTE', 'ASIGNADO', 'ACEPTADO', 'EN_CAMINO', 'EN_ORIGEN', 'EN_TRANSPORTE', 'EN_DESTINO', 'COMPLETADO', 'CANCELADO', 'INCIDENTE');

-- CreateEnum
CREATE TYPE "public"."TipoServicio" AS ENUM ('CONSULTA_MEDICA', 'EMERGENCIA', 'LABORATORIO', 'RADIOLOGIA', 'CIRUGIA', 'TERAPIA', 'DIALISIS', 'QUIMIOTERAPIA', 'OTROS');

-- CreateEnum
CREATE TYPE "public"."Prioridad" AS ENUM ('BAJA', 'NORMAL', 'ALTA', 'URGENTE', 'EMERGENCIA');

-- CreateEnum
CREATE TYPE "public"."EstadoClinica" AS ENUM ('ACTIVA', 'INACTIVA', 'MANTENIMIENTO');

-- CreateTable
CREATE TABLE "public"."conductores" (
    "id" SERIAL NOT NULL,
    "dni" VARCHAR(8) NOT NULL,
    "nombres" VARCHAR(100),
    "apellidos" VARCHAR(100),
    "nombreCompleto" VARCHAR(200),
    "fecha_nacimiento" DATE,
    "edad" INTEGER,
    "sexo" VARCHAR(10),
    "telefono" VARCHAR(15),
    "celular1" VARCHAR(15),
    "celular2" VARCHAR(15),
    "telefono_emergencia" VARCHAR(15),
    "email" VARCHAR(100),
    "direccion" TEXT,
    "distrito" VARCHAR(100),
    "distritoId" INTEGER,
    "latitud" DECIMAL(10,8),
    "longitud" DECIMAL(11,8),
    "latitud_actual" DOUBLE PRECISION,
    "longitud_actual" DOUBLE PRECISION,
    "ultimaUbicacion" TIMESTAMP(3),
    "precision" DOUBLE PRECISION,
    "velocidad" DOUBLE PRECISION,
    "rumbo" DOUBLE PRECISION,
    "bateria" INTEGER,
    "licencia_numero" VARCHAR(20),
    "numeroBrevete" VARCHAR(20),
    "licencia_categoria" VARCHAR(10),
    "fecha_emision_licencia" DATE,
    "fecha_vencimiento_licencia" DATE,
    "puntos_licencia" INTEGER DEFAULT 100,
    "certificado_transporte" BOOLEAN NOT NULL DEFAULT false,
    "cert_transporte_numero" VARCHAR(50),
    "cert_transporte_venc" DATE,
    "tecnico_emergencias" BOOLEAN NOT NULL DEFAULT false,
    "tes_numero" VARCHAR(50),
    "tes_vencimiento" DATE,
    "certificado_medico" BOOLEAN NOT NULL DEFAULT false,
    "cert_medico_numero" VARCHAR(50),
    "fecha_vencimiento_medico" DATE,
    "antecedentes_penales" BOOLEAN NOT NULL DEFAULT false,
    "cert_penales_fecha" DATE,
    "cert_penales_vigente" BOOLEAN NOT NULL DEFAULT false,
    "antecedentes_policiales" BOOLEAN NOT NULL DEFAULT false,
    "cert_policiales_fecha" DATE,
    "cert_policiales_vigente" BOOLEAN NOT NULL DEFAULT false,
    "primeros_auxilios" BOOLEAN NOT NULL DEFAULT false,
    "cert_auxilios_fecha" DATE,
    "cert_auxilios_vigente" BOOLEAN NOT NULL DEFAULT false,
    "soporte_vital_basico" BOOLEAN NOT NULL DEFAULT false,
    "svb_fecha" DATE,
    "svb_vigente" BOOLEAN NOT NULL DEFAULT false,
    "soporte_vital_avanzado" BOOLEAN NOT NULL DEFAULT false,
    "sva_fecha" DATE,
    "sva_vigente" BOOLEAN NOT NULL DEFAULT false,
    "curso_covid" BOOLEAN NOT NULL DEFAULT false,
    "curso_pacientes_especiales" BOOLEAN NOT NULL DEFAULT false,
    "curso_manejo_defensivo" BOOLEAN NOT NULL DEFAULT false,
    "vehiculo_asignado_id" INTEGER,
    "vehiculo_placa" VARCHAR(10),
    "placa" VARCHAR(10),
    "tipo_vehiculo" VARCHAR(50),
    "marcaAuto" VARCHAR(50),
    "modelo" VARCHAR(50),
    "propietario" VARCHAR(100),
    "fecha_asignacion" DATE,
    "distrito_operacion" VARCHAR(100),
    "distrito_operacion_id" INTEGER,
    "disponibilidad" JSONB,
    "estado" "public"."EstadoConductor" NOT NULL DEFAULT 'ACTIVO',
    "estadoServicio" "public"."EstadoTracking" NOT NULL DEFAULT 'DESCONECTADO',
    "estado_texto" VARCHAR(20) DEFAULT 'ACTIVO',
    "motivo_inactividad" TEXT,
    "fecha_ultima_actualizacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_servicios" INTEGER NOT NULL DEFAULT 0,
    "total_kilometros" DECIMAL(10,2),
    "calificacion_promedio" DECIMAL(3,2) DEFAULT 0.00,
    "total_evaluaciones" INTEGER NOT NULL DEFAULT 0,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultima_evaluacion" DATE,
    "proxima_evaluacion" DATE,
    "total_incidentes" INTEGER NOT NULL DEFAULT 0,
    "total_accidentes" INTEGER NOT NULL DEFAULT 0,
    "ultima_sancion" DATE,
    "foto_url" VARCHAR(255),
    "observaciones" TEXT,
    "estadoCivil" VARCHAR(20),
    "numeroHijos" INTEGER,
    "contacto_emergencia_nombre" VARCHAR(100),
    "contacto_emergencia_telefono" VARCHAR(15),
    "nombreContacto" VARCHAR(100),
    "celularContacto" VARCHAR(15),
    "tipo_sangre" VARCHAR(5),
    "alergias" TEXT,
    "condiciones_medicas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creadoPor" VARCHAR(100),
    "modificadoPor" VARCHAR(100),

    CONSTRAINT "conductores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ubicaciones_conductor" (
    "id" SERIAL NOT NULL,
    "conductorId" INTEGER NOT NULL,
    "latitud" DOUBLE PRECISION NOT NULL,
    "longitud" DOUBLE PRECISION NOT NULL,
    "precision" DOUBLE PRECISION,
    "altitud" DOUBLE PRECISION,
    "velocidad" DOUBLE PRECISION,
    "rumbo" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fuente" TEXT,
    "bateria" INTEGER,
    "enServicio" BOOLEAN NOT NULL DEFAULT false,
    "servicioId" INTEGER,
    "distanciaRecorrida" DOUBLE PRECISION,

    CONSTRAINT "ubicaciones_conductor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."servicios" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "pacienteNombre" TEXT NOT NULL,
    "pacienteDni" TEXT,
    "pacienteTelefono" TEXT,
    "pacienteObservaciones" TEXT,
    "origenDireccion" TEXT NOT NULL,
    "origenLatitud" DOUBLE PRECISION NOT NULL,
    "origenLongitud" DOUBLE PRECISION NOT NULL,
    "origenReferencia" TEXT,
    "destinoDireccion" TEXT NOT NULL,
    "destinoLatitud" DOUBLE PRECISION NOT NULL,
    "destinoLongitud" DOUBLE PRECISION NOT NULL,
    "destinoReferencia" TEXT,
    "fechaHora" TIMESTAMP(3) NOT NULL,
    "fechaHoraLlegada" TIMESTAMP(3),
    "fechaHoraRecojo" TIMESTAMP(3),
    "fechaHoraEntrega" TIMESTAMP(3),
    "tiempoEstimado" INTEGER,
    "distanciaEstimada" DOUBLE PRECISION,
    "distanciaReal" DOUBLE PRECISION,
    "estado" "public"."EstadoServicio" NOT NULL DEFAULT 'PENDIENTE',
    "tipoServicio" "public"."TipoServicio" NOT NULL,
    "prioridad" "public"."Prioridad" NOT NULL DEFAULT 'NORMAL',
    "conductorId" INTEGER,
    "fechaAsignacion" TIMESTAMP(3),
    "fechaAceptacion" TIMESTAMP(3),
    "fechaInicio" TIMESTAMP(3),
    "fechaFinalizacion" TIMESTAMP(3),
    "clinicaId" INTEGER NOT NULL,
    "rutaOptimizada" JSONB,
    "rutaReal" JSONB,
    "puntoControl" JSONB,
    "observaciones" TEXT,
    "incidentes" JSONB,
    "motivoCancelacion" TEXT,
    "calificacion" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clinicas" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "latitud" DOUBLE PRECISION NOT NULL,
    "longitud" DOUBLE PRECISION NOT NULL,
    "radio" DOUBLE PRECISION,
    "telefono" TEXT,
    "email" TEXT,
    "contacto" TEXT,
    "horarioAtencion" JSONB,
    "especialidades" TEXT[],
    "codigoSIS" TEXT,
    "estado" "public"."EstadoClinica" NOT NULL DEFAULT 'ACTIVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."distritos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "provincia" TEXT NOT NULL DEFAULT 'Lima',
    "codigoPostal" TEXT,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "codigoUbigeo" TEXT,
    "zona" TEXT,
    "poblacion" INTEGER,
    "areaKm2" DOUBLE PRECISION,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distritos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conductores_dni_key" ON "public"."conductores"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "conductores_licencia_numero_key" ON "public"."conductores"("licencia_numero");

-- CreateIndex
CREATE INDEX "ubicaciones_conductor_conductorId_timestamp_idx" ON "public"."ubicaciones_conductor"("conductorId", "timestamp");

-- CreateIndex
CREATE INDEX "ubicaciones_conductor_timestamp_idx" ON "public"."ubicaciones_conductor"("timestamp");

-- CreateIndex
CREATE INDEX "ubicaciones_conductor_conductorId_enServicio_idx" ON "public"."ubicaciones_conductor"("conductorId", "enServicio");

-- CreateIndex
CREATE UNIQUE INDEX "servicios_codigo_key" ON "public"."servicios"("codigo");

-- CreateIndex
CREATE INDEX "servicios_estado_fechaHora_idx" ON "public"."servicios"("estado", "fechaHora");

-- CreateIndex
CREATE INDEX "servicios_conductorId_idx" ON "public"."servicios"("conductorId");

-- CreateIndex
CREATE INDEX "servicios_clinicaId_idx" ON "public"."servicios"("clinicaId");

-- CreateIndex
CREATE INDEX "servicios_fechaHora_idx" ON "public"."servicios"("fechaHora");

-- CreateIndex
CREATE UNIQUE INDEX "distritos_nombre_key" ON "public"."distritos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "distritos_codigoUbigeo_key" ON "public"."distritos"("codigoUbigeo");

-- CreateIndex
CREATE INDEX "distritos_nombre_idx" ON "public"."distritos"("nombre");

-- CreateIndex
CREATE INDEX "distritos_provincia_idx" ON "public"."distritos"("provincia");

-- CreateIndex
CREATE INDEX "distritos_codigoUbigeo_idx" ON "public"."distritos"("codigoUbigeo");

-- AddForeignKey
ALTER TABLE "public"."conductores" ADD CONSTRAINT "conductores_distritoId_fkey" FOREIGN KEY ("distritoId") REFERENCES "public"."distritos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ubicaciones_conductor" ADD CONSTRAINT "ubicaciones_conductor_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES "public"."conductores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."servicios" ADD CONSTRAINT "servicios_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES "public"."conductores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."servicios" ADD CONSTRAINT "servicios_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES "public"."clinicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

