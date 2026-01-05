--
-- PostgreSQL database dump
--

\restrict ZAI71UdgWNGbe7t5M4KRenP4HnYAMempnpBFPIOFrON0JMNumunMQjhBDUyue0z

-- Dumped from database version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.10 (Ubuntu 16.10-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: EstadoClinica; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoClinica" AS ENUM (
    'ACTIVA',
    'INACTIVA',
    'MANTENIMIENTO'
);


ALTER TYPE public."EstadoClinica" OWNER TO postgres;

--
-- Name: EstadoConductor; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoConductor" AS ENUM (
    'ACTIVO',
    'INACTIVO',
    'EN_PERMISO',
    'RETIRADO'
);


ALTER TYPE public."EstadoConductor" OWNER TO postgres;

--
-- Name: EstadoServicio; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoServicio" AS ENUM (
    'PENDIENTE',
    'ASIGNADO',
    'ACEPTADO',
    'EN_CAMINO',
    'EN_ORIGEN',
    'EN_TRANSPORTE',
    'EN_DESTINO',
    'COMPLETADO',
    'CANCELADO',
    'INCIDENTE'
);


ALTER TYPE public."EstadoServicio" OWNER TO postgres;

--
-- Name: EstadoTracking; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EstadoTracking" AS ENUM (
    'DESCONECTADO',
    'DISPONIBLE',
    'EN_CAMINO',
    'EN_ORIGEN',
    'EN_TRANSPORTE',
    'EN_DESTINO',
    'RETORNANDO',
    'NO_DISPONIBLE',
    'EMERGENCIA'
);


ALTER TYPE public."EstadoTracking" OWNER TO postgres;

--
-- Name: Prioridad; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Prioridad" AS ENUM (
    'BAJA',
    'NORMAL',
    'ALTA',
    'URGENTE',
    'EMERGENCIA'
);


ALTER TYPE public."Prioridad" OWNER TO postgres;

--
-- Name: TipoServicio; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TipoServicio" AS ENUM (
    'CONSULTA_MEDICA',
    'EMERGENCIA',
    'LABORATORIO',
    'RADIOLOGIA',
    'CIRUGIA',
    'TERAPIA',
    'DIALISIS',
    'QUIMIOTERAPIA',
    'OTROS'
);


ALTER TYPE public."TipoServicio" OWNER TO postgres;

--
-- Name: generar_codigo_importacion(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generar_codigo_importacion() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
  nuevo_num INTEGER;
BEGIN
  nuevo_num := nextval('seq_codigo_importacion');
  RETURN 'ZURI' || LPAD(nuevo_num::TEXT, 6, '0');
END;
$$;


ALTER FUNCTION public.generar_codigo_importacion() OWNER TO postgres;

--
-- Name: generar_codigo_programacion(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generar_codigo_programacion() RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
  nuevo_numero INTEGER;
  nuevo_codigo VARCHAR(15);
BEGIN
  nuevo_numero := nextval('seq_codigo_programacion');
  nuevo_codigo := 'ZPROG' || LPAD(nuevo_numero::TEXT, 6, '0');
  RETURN nuevo_codigo;
END;
$$;


ALTER FUNCTION public.generar_codigo_programacion() OWNER TO postgres;

--
-- Name: generar_codigo_zuri(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generar_codigo_zuri() RETURNS character varying
    LANGUAGE plpgsql
    AS $$
DECLARE
    nuevo_numero INTEGER;
    nuevo_codigo VARCHAR(9);
BEGIN
    -- Obtener siguiente número de la secuencia
    nuevo_numero := nextval('seq_codigo_zuri');
    
    -- Formatear como ZUR + 6 dígitos con padding de ceros
    nuevo_codigo := 'ZUR' || LPAD(nuevo_numero::TEXT, 6, '0');
    
    RETURN nuevo_codigo;
END;
$$;


ALTER FUNCTION public.generar_codigo_zuri() OWNER TO postgres;

--
-- Name: update_importaciones_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_importaciones_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_importaciones_timestamp() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: areas_servicio; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.areas_servicio (
    id integer NOT NULL,
    codigo character varying(30) NOT NULL,
    nombre text NOT NULL,
    activo boolean DEFAULT true,
    orden integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.areas_servicio OWNER TO postgres;

--
-- Name: areas_servicio_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.areas_servicio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.areas_servicio_id_seq OWNER TO postgres;

--
-- Name: areas_servicio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.areas_servicio_id_seq OWNED BY public.areas_servicio.id;


--
-- Name: calificaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.calificaciones (
    id integer NOT NULL,
    codigo character varying(20) NOT NULL,
    descripcion text NOT NULL,
    tipo character varying(20),
    color character varying(7),
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT calificaciones_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['PUNTUAL'::character varying, 'TARDANZA'::character varying, 'INCIDENCIA'::character varying])::text[])))
);


ALTER TABLE public.calificaciones OWNER TO postgres;

--
-- Name: calificaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.calificaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.calificaciones_id_seq OWNER TO postgres;

--
-- Name: calificaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.calificaciones_id_seq OWNED BY public.calificaciones.id;


--
-- Name: clientes_especiales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clientes_especiales (
    id integer NOT NULL,
    codigo character varying(10) NOT NULL,
    nombre text NOT NULL,
    nombre_completo text,
    activo boolean DEFAULT true,
    orden integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.clientes_especiales OWNER TO postgres;

--
-- Name: clientes_especiales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clientes_especiales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clientes_especiales_id_seq OWNER TO postgres;

--
-- Name: clientes_especiales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clientes_especiales_id_seq OWNED BY public.clientes_especiales.id;


--
-- Name: clinica_especialidades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clinica_especialidades (
    id integer NOT NULL,
    clinica_id integer NOT NULL,
    especialidad_id integer NOT NULL
);


ALTER TABLE public.clinica_especialidades OWNER TO postgres;

--
-- Name: clinica_especialidades_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clinica_especialidades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinica_especialidades_id_seq OWNER TO postgres;

--
-- Name: clinica_especialidades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clinica_especialidades_id_seq OWNED BY public.clinica_especialidades.id;


--
-- Name: clinicas; Type: TABLE; Schema: public; Owner: zuri
--

CREATE TABLE public.clinicas (
    id integer NOT NULL,
    nombre text NOT NULL,
    direccion text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "codigoSIS" text,
    contacto text,
    email text,
    especialidades text[],
    estado public."EstadoClinica" DEFAULT 'ACTIVA'::public."EstadoClinica" NOT NULL,
    "horarioAtencion" jsonb,
    latitud double precision NOT NULL,
    longitud double precision NOT NULL,
    radio double precision,
    telefono text
);


ALTER TABLE public.clinicas OWNER TO zuri;

--
-- Name: clinicas_hospitales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clinicas_hospitales (
    id integer NOT NULL,
    nombre text NOT NULL,
    tipo text NOT NULL,
    direccion text NOT NULL,
    "distritoId" integer,
    latitud numeric(10,8) NOT NULL,
    longitud numeric(11,8) NOT NULL,
    referencia text,
    telefono text,
    telefono_emergencia text,
    email text,
    sitio_web text,
    horario_atencion text,
    atiende_24_horas boolean DEFAULT false,
    tiene_emergencia boolean DEFAULT false,
    tiene_uci boolean DEFAULT false,
    tiene_ambulancia boolean DEFAULT false,
    numero_consultorios integer,
    capacidad_diaria integer,
    seguros_aceptados text,
    tiene_rampas boolean DEFAULT false,
    tiene_ascensor boolean DEFAULT false,
    tiene_estacionamiento boolean DEFAULT false,
    codigo_renaes text,
    contacto_admin text,
    celular_admin text,
    email_admin text,
    zona_cobertura integer,
    estado text DEFAULT 'ACTIVA'::text,
    observaciones text,
    "createdAt" timestamp without time zone DEFAULT now(),
    "updatedAt" timestamp without time zone DEFAULT now(),
    CONSTRAINT clinicas_hospitales_estado_check CHECK ((estado = ANY (ARRAY['ACTIVA'::text, 'INACTIVA'::text, 'TEMPORAL'::text]))),
    CONSTRAINT clinicas_hospitales_tipo_check CHECK ((tipo = ANY (ARRAY['CLINICA_PRIVADA'::text, 'HOSPITAL_ESSALUD'::text, 'HOSPITAL_MINSA'::text, 'CENTRO_SALUD'::text, 'OTRO'::text])))
);


ALTER TABLE public.clinicas_hospitales OWNER TO postgres;

--
-- Name: clinicas_hospitales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clinicas_hospitales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinicas_hospitales_id_seq OWNER TO postgres;

--
-- Name: clinicas_hospitales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clinicas_hospitales_id_seq OWNED BY public.clinicas_hospitales.id;


--
-- Name: clinicas_id_seq; Type: SEQUENCE; Schema: public; Owner: zuri
--

CREATE SEQUENCE public.clinicas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinicas_id_seq OWNER TO zuri;

--
-- Name: clinicas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zuri
--

ALTER SEQUENCE public.clinicas_id_seq OWNED BY public.clinicas.id;


--
-- Name: cobertura_turnos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cobertura_turnos (
    id integer NOT NULL,
    codigo character varying(10) NOT NULL,
    descripcion text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cobertura_turnos OWNER TO postgres;

--
-- Name: cobertura_turnos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cobertura_turnos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cobertura_turnos_id_seq OWNER TO postgres;

--
-- Name: cobertura_turnos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cobertura_turnos_id_seq OWNED BY public.cobertura_turnos.id;


--
-- Name: conductores; Type: TABLE; Schema: public; Owner: zuri
--

CREATE TABLE public.conductores (
    id integer NOT NULL,
    dni text NOT NULL,
    "nombreCompleto" text NOT NULL,
    "fechaNacimiento" timestamp(3) without time zone NOT NULL,
    celular1 text NOT NULL,
    celular2 text,
    email text NOT NULL,
    "numeroBrevete" text NOT NULL,
    "marcaAuto" text NOT NULL,
    modelo text NOT NULL,
    propietario text,
    "estadoCivil" text,
    "numeroHijos" integer,
    "nombreContacto" text,
    "celularContacto" text,
    observaciones text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    bateria integer,
    "estadoServicio" public."EstadoTracking" DEFAULT 'DESCONECTADO'::public."EstadoTracking" NOT NULL,
    latitud double precision,
    longitud double precision,
    placa text,
    "precision" double precision,
    rumbo double precision,
    "ultimaUbicacion" timestamp(3) without time zone,
    velocidad double precision,
    estado public."EstadoConductor" DEFAULT 'ACTIVO'::public."EstadoConductor" NOT NULL,
    direccion text,
    "distritoId" integer,
    domicilio text DEFAULT ''::text,
    servicios_asignados text[] DEFAULT '{}'::text[]
);


ALTER TABLE public.conductores OWNER TO zuri;

--
-- Name: conductores_id_seq; Type: SEQUENCE; Schema: public; Owner: zuri
--

CREATE SEQUENCE public.conductores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conductores_id_seq OWNER TO zuri;

--
-- Name: conductores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: zuri
--

ALTER SEQUENCE public.conductores_id_seq OWNED BY public.conductores.id;


--
-- Name: distritos; Type: TABLE; Schema: public; Owner: prisma_user
--

CREATE TABLE public.distritos (
    id integer NOT NULL,
    nombre text NOT NULL,
    provincia text DEFAULT 'Lima'::text NOT NULL,
    "codigoPostal" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.distritos OWNER TO prisma_user;

--
-- Name: distritos_id_seq; Type: SEQUENCE; Schema: public; Owner: prisma_user
--

CREATE SEQUENCE public.distritos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.distritos_id_seq OWNER TO prisma_user;

--
-- Name: distritos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: prisma_user
--

ALTER SEQUENCE public.distritos_id_seq OWNED BY public.distritos.id;


--
-- Name: doctor_clinicas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_clinicas (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    clinica_id integer NOT NULL,
    dias_atencion text,
    horario_atencion text
);


ALTER TABLE public.doctor_clinicas OWNER TO postgres;

--
-- Name: doctor_clinicas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.doctor_clinicas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctor_clinicas_id_seq OWNER TO postgres;

--
-- Name: doctor_clinicas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctor_clinicas_id_seq OWNED BY public.doctor_clinicas.id;


--
-- Name: doctor_especialidades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_especialidades (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    especialidad_id integer NOT NULL,
    es_principal boolean DEFAULT false
);


ALTER TABLE public.doctor_especialidades OWNER TO postgres;

--
-- Name: doctor_especialidades_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.doctor_especialidades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctor_especialidades_id_seq OWNER TO postgres;

--
-- Name: doctor_especialidades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctor_especialidades_id_seq OWNED BY public.doctor_especialidades.id;


--
-- Name: doctores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctores (
    id integer NOT NULL,
    dni text NOT NULL,
    nombre_completo text NOT NULL,
    fecha_nacimiento text,
    celular text,
    email text,
    direccion_personal text,
    "distritoId" integer,
    cmp text,
    rne text,
    universidad text,
    anos_experiencia integer,
    idiomas text,
    precio_consulta numeric(10,2),
    duracion_consulta integer,
    acepta_teleconsulta boolean DEFAULT false,
    estado text DEFAULT 'ACTIVO'::text,
    foto text,
    calificacion numeric(3,2),
    certificaciones text,
    observaciones text,
    "createdAt" timestamp without time zone DEFAULT now(),
    "updatedAt" timestamp without time zone DEFAULT now(),
    CONSTRAINT doctores_estado_check CHECK ((estado = ANY (ARRAY['ACTIVO'::text, 'INACTIVO'::text, 'VACACIONES'::text, 'LICENCIA'::text])))
);


ALTER TABLE public.doctores OWNER TO postgres;

--
-- Name: doctores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.doctores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctores_id_seq OWNER TO postgres;

--
-- Name: doctores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctores_id_seq OWNED BY public.doctores.id;


--
-- Name: especialidades; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.especialidades (
    id integer NOT NULL,
    nombre text NOT NULL,
    categoria text NOT NULL,
    es_subespecialidad boolean DEFAULT false,
    especialidad_padre_id integer,
    descripcion text,
    "createdAt" timestamp without time zone DEFAULT now(),
    "updatedAt" timestamp without time zone DEFAULT now(),
    CONSTRAINT especialidades_categoria_check CHECK ((categoria = ANY (ARRAY['MEDICA'::text, 'QUIRURGICA'::text, 'DIAGNOSTICA'::text, 'NATURAL'::text, 'OTRO'::text])))
);


ALTER TABLE public.especialidades OWNER TO postgres;

--
-- Name: especialidades_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.especialidades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.especialidades_id_seq OWNER TO postgres;

--
-- Name: especialidades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.especialidades_id_seq OWNED BY public.especialidades.id;


--
-- Name: importaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.importaciones (
    id integer NOT NULL,
    nombre_archivo text NOT NULL,
    total_registros integer DEFAULT 0,
    registros_procesados integer DEFAULT 0,
    registros_error integer DEFAULT 0,
    doctores_nuevos integer DEFAULT 0,
    estado character varying(20) DEFAULT 'PENDIENTE'::character varying,
    "createdAt" timestamp without time zone DEFAULT now(),
    "updatedAt" timestamp without time zone DEFAULT now(),
    codigo text
);


ALTER TABLE public.importaciones OWNER TO postgres;

--
-- Name: importaciones_excel; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.importaciones_excel (
    id integer NOT NULL,
    codigo_zuri character varying(9) NOT NULL,
    nombre_archivo text NOT NULL,
    fecha_archivo date NOT NULL,
    fecha_importacion timestamp without time zone DEFAULT now(),
    total_registros integer DEFAULT 0,
    registros_procesados integer DEFAULT 0,
    registros_error integer DEFAULT 0,
    registros_duplicados integer DEFAULT 0,
    doctores_nuevos integer DEFAULT 0,
    doctores_existentes integer DEFAULT 0,
    estado character varying(20) DEFAULT 'PENDIENTE'::character varying,
    usuario_importacion text,
    notas text,
    errores_log jsonb,
    estadisticas jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.importaciones_excel OWNER TO postgres;

--
-- Name: importaciones_excel_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.importaciones_excel_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.importaciones_excel_id_seq OWNER TO postgres;

--
-- Name: importaciones_excel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.importaciones_excel_id_seq OWNED BY public.importaciones_excel.id;


--
-- Name: importaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.importaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.importaciones_id_seq OWNER TO postgres;

--
-- Name: importaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.importaciones_id_seq OWNED BY public.importaciones.id;


--
-- Name: motivos_no_disponibilidad; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.motivos_no_disponibilidad (
    id integer NOT NULL,
    codigo character varying(30) NOT NULL,
    descripcion text NOT NULL,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.motivos_no_disponibilidad OWNER TO postgres;

--
-- Name: motivos_no_disponibilidad_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.motivos_no_disponibilidad_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.motivos_no_disponibilidad_id_seq OWNER TO postgres;

--
-- Name: motivos_no_disponibilidad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.motivos_no_disponibilidad_id_seq OWNED BY public.motivos_no_disponibilidad.id;


--
-- Name: pacientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pacientes (
    id integer NOT NULL,
    dni text NOT NULL,
    nombre_completo text NOT NULL,
    fecha_nacimiento text,
    edad integer,
    celular text,
    email text,
    telefono_fijo text,
    direccion text,
    "distritoId" integer,
    referencia text,
    nombre_emergencia text,
    parentesco_emergencia text,
    celular_emergencia text,
    seguro_medico text,
    nombre_seguro text,
    numero_poliza text,
    tipo_movilidad text,
    requiere_oxigeno boolean DEFAULT false,
    requiere_acompanante boolean DEFAULT false,
    peso_aproximado numeric(5,2),
    alergias text,
    medicamentos_actuales text,
    condiciones_cronicas text,
    restricciones_dieteticas text,
    observaciones_medicas text,
    estado text DEFAULT 'ACTIVO'::text,
    idioma_preferido text DEFAULT 'Español'::text,
    numero_servicios integer DEFAULT 0,
    ultima_visita timestamp without time zone,
    proxima_cita timestamp without time zone,
    documento_dni text,
    documento_seguro text,
    "createdAt" timestamp without time zone DEFAULT now(),
    "updatedAt" timestamp without time zone DEFAULT now(),
    CONSTRAINT pacientes_estado_check CHECK ((estado = ANY (ARRAY['ACTIVO'::text, 'INACTIVO'::text]))),
    CONSTRAINT pacientes_seguro_medico_check CHECK ((seguro_medico = ANY (ARRAY['ESSALUD'::text, 'SIS'::text, 'PRIVADO'::text, 'NINGUNO'::text, NULL::text]))),
    CONSTRAINT pacientes_tipo_movilidad_check CHECK ((tipo_movilidad = ANY (ARRAY['CAMINA_SOLO'::text, 'SILLA_RUEDAS'::text, 'CAMILLA'::text, 'APOYO'::text, NULL::text])))
);


ALTER TABLE public.pacientes OWNER TO postgres;

--
-- Name: pacientes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pacientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pacientes_id_seq OWNER TO postgres;

--
-- Name: pacientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pacientes_id_seq OWNED BY public.pacientes.id;


--
-- Name: programacion_detalles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.programacion_detalles (
    id integer NOT NULL,
    programacion_id integer,
    solicitud_servicio_id integer,
    tipo_servicio_id integer,
    cliente_id integer,
    cliente_nombre text,
    doctor_id integer,
    doctor_nombre text NOT NULL,
    conductor_id integer,
    conductor_nombre text,
    fecha date NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    turno character varying(10),
    ubicacion text,
    direccion_completa text,
    estado character varying(20) DEFAULT 'PROGRAMADO'::character varying,
    calificacion_id integer,
    calificacion_detalle text,
    motivo_no_disponibilidad_id integer,
    observaciones text,
    incidencias text,
    orden integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    area_servicio_id integer,
    cliente_especial_id integer
);


ALTER TABLE public.programacion_detalles OWNER TO postgres;

--
-- Name: programacion_detalles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.programacion_detalles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.programacion_detalles_id_seq OWNER TO postgres;

--
-- Name: programacion_detalles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.programacion_detalles_id_seq OWNED BY public.programacion_detalles.id;


--
-- Name: programaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.programaciones (
    id integer NOT NULL,
    codigo_programacion character varying(15) DEFAULT public.generar_codigo_programacion() NOT NULL,
    importacion_id integer,
    fecha_programacion date NOT NULL,
    cliente_id integer,
    cliente_nombre text,
    tipo_servicio_id integer,
    estado character varying(20) DEFAULT 'BORRADOR'::character varying,
    notas text,
    creado_por text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    cliente_especial_id integer,
    CONSTRAINT programaciones_estado_check CHECK (((estado)::text = ANY ((ARRAY['BORRADOR'::character varying, 'CONFIRMADO'::character varying, 'EN_EJECUCION'::character varying, 'COMPLETADO'::character varying, 'CANCELADO'::character varying])::text[])))
);


ALTER TABLE public.programaciones OWNER TO postgres;

--
-- Name: programaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.programaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.programaciones_id_seq OWNER TO postgres;

--
-- Name: programaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.programaciones_id_seq OWNED BY public.programaciones.id;


--
-- Name: seq_codigo_importacion; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seq_codigo_importacion
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seq_codigo_importacion OWNER TO postgres;

--
-- Name: seq_codigo_programacion; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seq_codigo_programacion
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seq_codigo_programacion OWNER TO postgres;

--
-- Name: seq_codigo_zuri; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seq_codigo_zuri
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seq_codigo_zuri OWNER TO postgres;

--
-- Name: servicios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.servicios (
    id integer NOT NULL,
    codigo text NOT NULL,
    "pacienteNombre" text NOT NULL,
    "pacienteDni" text,
    "pacienteTelefono" text,
    "pacienteObservaciones" text,
    "origenDireccion" text NOT NULL,
    "origenLatitud" double precision NOT NULL,
    "origenLongitud" double precision NOT NULL,
    "origenReferencia" text,
    "destinoDireccion" text NOT NULL,
    "destinoLatitud" double precision NOT NULL,
    "destinoLongitud" double precision NOT NULL,
    "destinoReferencia" text,
    "fechaHora" timestamp(3) without time zone NOT NULL,
    "fechaHoraLlegada" timestamp(3) without time zone,
    "fechaHoraRecojo" timestamp(3) without time zone,
    "fechaHoraEntrega" timestamp(3) without time zone,
    "tiempoEstimado" integer,
    "distanciaEstimada" double precision,
    "distanciaReal" double precision,
    estado public."EstadoServicio" DEFAULT 'PENDIENTE'::public."EstadoServicio" NOT NULL,
    "tipoServicio" public."TipoServicio" NOT NULL,
    prioridad public."Prioridad" DEFAULT 'NORMAL'::public."Prioridad" NOT NULL,
    "conductorId" integer,
    "fechaAsignacion" timestamp(3) without time zone,
    "fechaAceptacion" timestamp(3) without time zone,
    "fechaInicio" timestamp(3) without time zone,
    "fechaFinalizacion" timestamp(3) without time zone,
    "clinicaId" integer NOT NULL,
    "rutaOptimizada" jsonb,
    "rutaReal" jsonb,
    "puntoControl" jsonb,
    observaciones text,
    incidentes jsonb,
    "motivoCancelacion" text,
    calificacion double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.servicios OWNER TO postgres;

--
-- Name: servicios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.servicios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.servicios_id_seq OWNER TO postgres;

--
-- Name: servicios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.servicios_id_seq OWNED BY public.servicios.id;


--
-- Name: solicitudes_servicios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.solicitudes_servicios (
    id integer NOT NULL,
    importacion_id integer,
    fecha_servicio date,
    hora_inicio time without time zone,
    hora_fin time without time zone,
    turno character varying(10),
    tipo_servicio character varying(50),
    doctor_id integer,
    doctor_nombre text NOT NULL,
    cliente_nombre character varying(100),
    ubicacion text,
    distrito character varying(100),
    conductor_id integer,
    conductor_nombre text,
    estado character varying(20) DEFAULT 'PENDIENTE'::character varying,
    observaciones text,
    "createdAt" timestamp without time zone DEFAULT now(),
    "updatedAt" timestamp without time zone DEFAULT now()
);


ALTER TABLE public.solicitudes_servicios OWNER TO postgres;

--
-- Name: solicitudes_servicios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.solicitudes_servicios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.solicitudes_servicios_id_seq OWNER TO postgres;

--
-- Name: solicitudes_servicios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.solicitudes_servicios_id_seq OWNED BY public.solicitudes_servicios.id;


--
-- Name: tipos_servicio; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tipos_servicio (
    id integer NOT NULL,
    codigo character varying(10) NOT NULL,
    nombre text NOT NULL,
    descripcion text,
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.tipos_servicio OWNER TO postgres;

--
-- Name: tipos_servicio_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tipos_servicio_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tipos_servicio_id_seq OWNER TO postgres;

--
-- Name: tipos_servicio_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tipos_servicio_id_seq OWNED BY public.tipos_servicio.id;


--
-- Name: ubicaciones_conductor; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ubicaciones_conductor (
    id integer NOT NULL,
    "conductorId" integer NOT NULL,
    latitud double precision NOT NULL,
    longitud double precision NOT NULL,
    "precision" double precision,
    altitud double precision,
    velocidad double precision,
    rumbo double precision,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fuente text,
    bateria integer,
    "enServicio" boolean DEFAULT false NOT NULL,
    "servicioId" integer,
    "distanciaRecorrida" double precision
);


ALTER TABLE public.ubicaciones_conductor OWNER TO postgres;

--
-- Name: ubicaciones_conductor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ubicaciones_conductor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ubicaciones_conductor_id_seq OWNER TO postgres;

--
-- Name: ubicaciones_conductor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ubicaciones_conductor_id_seq OWNED BY public.ubicaciones_conductor.id;


--
-- Name: vista_programaciones_resumen; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_programaciones_resumen AS
SELECT
    NULL::integer AS id,
    NULL::character varying(15) AS codigo_programacion,
    NULL::date AS fecha_programacion,
    NULL::text AS cliente_nombre,
    NULL::character varying(20) AS estado,
    NULL::bigint AS total_servicios,
    NULL::bigint AS servicios_asignados,
    NULL::bigint AS servicios_calificados,
    NULL::timestamp without time zone AS created_at;


ALTER VIEW public.vista_programaciones_resumen OWNER TO postgres;

--
-- Name: areas_servicio id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areas_servicio ALTER COLUMN id SET DEFAULT nextval('public.areas_servicio_id_seq'::regclass);


--
-- Name: calificaciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calificaciones ALTER COLUMN id SET DEFAULT nextval('public.calificaciones_id_seq'::regclass);


--
-- Name: clientes_especiales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes_especiales ALTER COLUMN id SET DEFAULT nextval('public.clientes_especiales_id_seq'::regclass);


--
-- Name: clinica_especialidades id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinica_especialidades ALTER COLUMN id SET DEFAULT nextval('public.clinica_especialidades_id_seq'::regclass);


--
-- Name: clinicas id; Type: DEFAULT; Schema: public; Owner: zuri
--

ALTER TABLE ONLY public.clinicas ALTER COLUMN id SET DEFAULT nextval('public.clinicas_id_seq'::regclass);


--
-- Name: clinicas_hospitales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas_hospitales ALTER COLUMN id SET DEFAULT nextval('public.clinicas_hospitales_id_seq'::regclass);


--
-- Name: cobertura_turnos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cobertura_turnos ALTER COLUMN id SET DEFAULT nextval('public.cobertura_turnos_id_seq'::regclass);


--
-- Name: conductores id; Type: DEFAULT; Schema: public; Owner: zuri
--

ALTER TABLE ONLY public.conductores ALTER COLUMN id SET DEFAULT nextval('public.conductores_id_seq'::regclass);


--
-- Name: distritos id; Type: DEFAULT; Schema: public; Owner: prisma_user
--

ALTER TABLE ONLY public.distritos ALTER COLUMN id SET DEFAULT nextval('public.distritos_id_seq'::regclass);


--
-- Name: doctor_clinicas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_clinicas ALTER COLUMN id SET DEFAULT nextval('public.doctor_clinicas_id_seq'::regclass);


--
-- Name: doctor_especialidades id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_especialidades ALTER COLUMN id SET DEFAULT nextval('public.doctor_especialidades_id_seq'::regclass);


--
-- Name: doctores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctores ALTER COLUMN id SET DEFAULT nextval('public.doctores_id_seq'::regclass);


--
-- Name: especialidades id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades ALTER COLUMN id SET DEFAULT nextval('public.especialidades_id_seq'::regclass);


--
-- Name: importaciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.importaciones ALTER COLUMN id SET DEFAULT nextval('public.importaciones_id_seq'::regclass);


--
-- Name: importaciones_excel id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.importaciones_excel ALTER COLUMN id SET DEFAULT nextval('public.importaciones_excel_id_seq'::regclass);


--
-- Name: motivos_no_disponibilidad id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.motivos_no_disponibilidad ALTER COLUMN id SET DEFAULT nextval('public.motivos_no_disponibilidad_id_seq'::regclass);


--
-- Name: pacientes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pacientes ALTER COLUMN id SET DEFAULT nextval('public.pacientes_id_seq'::regclass);


--
-- Name: programacion_detalles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programacion_detalles ALTER COLUMN id SET DEFAULT nextval('public.programacion_detalles_id_seq'::regclass);


--
-- Name: programaciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programaciones ALTER COLUMN id SET DEFAULT nextval('public.programaciones_id_seq'::regclass);


--
-- Name: servicios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicios ALTER COLUMN id SET DEFAULT nextval('public.servicios_id_seq'::regclass);


--
-- Name: solicitudes_servicios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_servicios ALTER COLUMN id SET DEFAULT nextval('public.solicitudes_servicios_id_seq'::regclass);


--
-- Name: tipos_servicio id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_servicio ALTER COLUMN id SET DEFAULT nextval('public.tipos_servicio_id_seq'::regclass);


--
-- Name: ubicaciones_conductor id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ubicaciones_conductor ALTER COLUMN id SET DEFAULT nextval('public.ubicaciones_conductor_id_seq'::regclass);


--
-- Data for Name: areas_servicio; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.areas_servicio (id, codigo, nombre, activo, orden, created_at) FROM stdin;
1	MEDICINA	MEDICINA	t	1	2025-10-03 23:16:25.572714
2	PEDIATRIA	PEDIATRÍA	t	2	2025-10-03 23:16:25.572714
3	LABORATORIO	LABORATORIO	t	3	2025-10-03 23:16:25.572714
4	PRECISA	PRECISA	t	4	2025-10-03 23:16:25.572714
5	CRONICO	CRONICO	t	5	2025-10-03 23:16:25.572714
6	CC_MIRAFLORES	CC. MIRAFLORES	t	6	2025-10-03 23:16:25.572714
7	CC_EL_GOLF	CC. EL GOLF	t	7	2025-10-03 23:16:25.572714
8	CC_LA_MOLINA	CC. LA MOLINA	t	8	2025-10-03 23:16:25.572714
9	OREO	OREO	t	9	2025-10-03 23:16:25.572714
\.


--
-- Data for Name: calificaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.calificaciones (id, codigo, descripcion, tipo, color, activo, created_at) FROM stdin;
1	PUNTUAL	PUNTUAL - llega exacto o antes de la hora	PUNTUAL	#10b981	t	2025-10-03 05:08:46.980935
2	PUNTUAL-5	PUNTUAL hasta 5 minutos	PUNTUAL	#34d399	t	2025-10-03 05:08:46.980935
3	TL-6-20	TL - tardanza leve de 6 a 20 minutos	TARDANZA	#fbbf24	t	2025-10-03 05:08:46.980935
4	TL-21-60	TL - tardanza grave de 21 a 60	TARDANZA	#f97316	t	2025-10-03 05:08:46.980935
5	SIN-UBICACION	No envió ubicación - LLEGÓ A SERVICIO	INCIDENCIA	#60a5fa	t	2025-10-03 05:08:46.980935
6	QUEJA-CLIENTE	QUEJA DEL CLIENTE	INCIDENCIA	#ef4444	t	2025-10-03 05:08:46.980935
\.


--
-- Data for Name: clientes_especiales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clientes_especiales (id, codigo, nombre, nombre_completo, activo, orden, created_at) FROM stdin;
1	SANNA	SANNA	Clínica SANNA	t	1	2025-10-03 23:16:25.563843
2	CI	C.I.	Clínico Internacional	t	2	2025-10-03 23:16:25.563843
5	OTRO	Otro	Otro cliente	t	99	2025-10-03 23:16:25.563843
3	JP	JP	Servicio empresa privada JP	t	3	2025-10-03 23:16:25.563843
4	SM	SM	Servicio empresa privada SM	t	4	2025-10-03 23:16:25.563843
\.


--
-- Data for Name: clinica_especialidades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clinica_especialidades (id, clinica_id, especialidad_id) FROM stdin;
\.


--
-- Data for Name: clinicas; Type: TABLE DATA; Schema: public; Owner: zuri
--

COPY public.clinicas (id, nombre, direccion, "createdAt", "updatedAt", "codigoSIS", contacto, email, especialidades, estado, "horarioAtencion", latitud, longitud, radio, telefono) FROM stdin;
\.


--
-- Data for Name: clinicas_hospitales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clinicas_hospitales (id, nombre, tipo, direccion, "distritoId", latitud, longitud, referencia, telefono, telefono_emergencia, email, sitio_web, horario_atencion, atiende_24_horas, tiene_emergencia, tiene_uci, tiene_ambulancia, numero_consultorios, capacidad_diaria, seguros_aceptados, tiene_rampas, tiene_ascensor, tiene_estacionamiento, codigo_renaes, contacto_admin, celular_admin, email_admin, zona_cobertura, estado, observaciones, "createdAt", "updatedAt") FROM stdin;
2	Clínica San Felipe	CLINICA_PRIVADA	Av. Gregorio Escobedo 650	13	-12.10310000	-77.03600000	\N	01-219-0000	\N	contacto@clinicasanfelipe.com	\N	\N	f	t	t	t	\N	\N	\N	f	f	f	\N	\N	\N	\N	\N	ACTIVA	\N	2025-10-01 02:22:36.3	2025-10-01 02:22:36.3
3	Clínica Anglo Americana	CLINICA_PRIVADA	Alfredo Salazar cdra. 3	29	-12.09140000	-76.97200000	\N	01-616-8900	\N	informes@angloamericana.com.pe	\N	\N	f	t	t	t	\N	\N	\N	f	f	f	\N	\N	\N	\N	\N	ACTIVA	\N	2025-10-01 02:22:36.3	2025-10-01 02:22:36.3
4	Clínica Internacional Sede San Borja	CLINICA_PRIVADA	Av. Guardia Civil 337	28	-12.08730000	-77.00220000	\N	01-619-6161	\N	informes@clinicainternacional.com.pe	\N	\N	f	t	t	t	\N	\N	\N	f	f	f	\N	\N	\N	\N	\N	ACTIVA	\N	2025-10-01 02:22:36.3	2025-10-01 02:22:36.3
5	Clínica Javier Prado	CLINICA_PRIVADA	Av. Javier Prado Este 499	29	-12.09250000	-76.98360000	\N	01-327-5000	\N	contacto@clinicajavierprado.com.pe	\N	\N	f	t	t	t	\N	\N	\N	f	f	f	\N	\N	\N	\N	\N	ACTIVA	\N	2025-10-01 02:22:36.3	2025-10-01 02:22:36.3
6	Clínica Delgado	CLINICA_PRIVADA	Av. Angamos Oeste 200	22	-12.11450000	-77.03620000	\N	01-264-5050	\N	informes@clinicadelgado.com.pe	\N	\N	f	t	t	t	\N	\N	\N	f	f	f	\N	\N	\N	\N	\N	ACTIVA	\N	2025-10-01 02:22:36.3	2025-10-01 02:22:36.3
7	Clínica San Borja	CLINICA_PRIVADA	Av. Guardia Civil 521	28	-12.08830000	-77.00010000	\N	01-475-4000	\N	contacto@clinicasanborja.pe	\N	\N	f	t	t	t	\N	\N	\N	f	f	f	\N	\N	\N	\N	\N	ACTIVA	\N	2025-10-01 02:22:36.3	2025-10-01 02:22:36.3
8	Hospital Rebagliati EsSalud	HOSPITAL_ESSALUD	Av. Rebagliati 490	13	-12.08970000	-77.05050000	\N	01-265-4901	\N	hospital.rebagliati@essalud.gob.pe	\N	\N	f	t	t	t	\N	\N	\N	f	f	f	\N	\N	\N	\N	\N	ACTIVA	\N	2025-10-01 02:22:36.3	2025-10-01 02:22:36.3
9	Hospital Almenara EsSalud	HOSPITAL_ESSALUD	Av. Grau 800	15	-12.05670000	-77.01680000	\N	01-324-2983	\N	hospital.almenara@essalud.gob.pe	\N	\N	f	t	t	t	\N	\N	\N	f	f	f	\N	\N	\N	\N	\N	ACTIVA	\N	2025-10-01 02:22:36.3	2025-10-01 02:22:36.3
10	Hospital Sabogal EsSalud	HOSPITAL_ESSALUD	Av. Colectora s/n Bellavista	\N	-12.05520000	-77.11580000	\N	01-429-2020	\N	hospital.sabogal@essalud.gob.pe	\N	\N	f	t	t	t	\N	\N	\N	f	f	f	\N	\N	\N	\N	\N	ACTIVA	\N	2025-10-01 02:22:36.3	2025-10-01 02:22:36.3
15	Clinica Santa Martha del Sur	CLINICA_PRIVADA	Av. Belisario Suarez 998	31	-12.16309000	-76.96541000		(01) 6156767					f	t	f	t	40	300	Todos	t	t	t					\N	ACTIVA		2025-10-01 17:26:28.441246	2025-10-01 17:27:37.284948
1	Test Actualizado	CLINICA_PRIVADA	Av Test 123	\N	-12.08970000	-76.97760000	\N	01-123456	\N	test@test.com	\N	\N	\N	t	t	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	ACTIVA	\N	2025-10-01 02:22:36.3	2025-10-01 17:48:25.353676
14	Hospital Hipólito Unanue	HOSPITAL_MINSA	Av. César Vallejo 1390	11	-12.03750000	-76.99240000		01-362-5171		hospitalu nanue@minsa.gob.pe			f	t	t	t	50	250		f	f	f	\N				\N	ACTIVA		2025-10-01 02:22:36.3	2025-10-01 17:53:12.816893
11	Hospital Dos de Mayo	HOSPITAL_MINSA	Av. Grau cdra. 13	16	-12.06270000	-77.02610000		01-328-0000		hospital2demayo@minsa.gob.pe			f	t	t	t	\N	\N		f	f	f	\N				\N	ACTIVA		2025-10-01 02:22:36.3	2025-10-01 18:15:11.139835
12	Hospital Arzobispo Loayza	HOSPITAL_MINSA	Av. Alfonso Ugarte 848	16	-12.06600000	-77.03990000		01-614-4646		hospitalloayza@minsa.gob.pe			f	t	t	t	100	\N		f	f	f	\N				\N	ACTIVA		2025-10-01 02:22:36.3	2025-10-01 18:31:15.605399
13	Hospital María Auxiliadora del Peru	HOSPITAL_MINSA	Av. Miguel Iglesias s/n	31	-12.16080000	-76.97390000		01-287-3010		hma@minsa.gob.pe			f	t	t	t	\N	\N		f	f	f	\N				\N	ACTIVA		2025-10-01 02:22:36.3	2025-10-03 06:18:25.678568
\.


--
-- Data for Name: cobertura_turnos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cobertura_turnos (id, codigo, descripcion, created_at) FROM stdin;
1	M	Mañana	2025-10-03 05:08:47.078666
2	T	Tarde	2025-10-03 05:08:47.078666
3	M+T	Mañana + Tarde (Día completo)	2025-10-03 05:08:47.078666
4	N	Noche	2025-10-03 05:08:47.078666
\.


--
-- Data for Name: conductores; Type: TABLE DATA; Schema: public; Owner: zuri
--

COPY public.conductores (id, dni, "nombreCompleto", "fechaNacimiento", celular1, celular2, email, "numeroBrevete", "marcaAuto", modelo, propietario, "estadoCivil", "numeroHijos", "nombreContacto", "celularContacto", observaciones, "createdAt", "updatedAt", bateria, "estadoServicio", latitud, longitud, placa, "precision", rumbo, "ultimaUbicacion", velocidad, estado, direccion, "distritoId", domicilio, servicios_asignados) FROM stdin;
3	07362537	ELI ALVAREZ ACTUALIZADO	1985-03-15 00:00:00	943215491		eli.nuevo@zuri.pe	L12345678	Toyota	Prius	\N	\N	\N	\N	\N		2025-09-26 23:33:00.063	2025-09-27 00:16:35.901	\N	DESCONECTADO	\N	\N	FSX-612	\N	\N	\N	\N	ACTIVO	\N	\N		{}
4	44516227	ALVAREZ MONTES JHONNY	1990-08-22 00:00:00	987654321		jhonny.alvarez@zuri.pe	A98765432	Hyundai	Elantra	\N		0				2025-09-26 23:33:00.063	2025-09-27 23:38:22.591	\N	DESCONECTADO	\N	\N	DOK-612	\N	\N	\N	\N	ACTIVO	\N	\N		{}
8	09126733	Juan Lopez	1990-05-22 00:00:00	971345672		jualoperu@hotmail.com	45451	Toyota	grant	\N	Casado(a)	2	Gladys Sanchez	999922333	solo turnos  sábados y domingos	2025-09-29 05:59:54.925	2025-09-29 05:59:54.925	\N	DESCONECTADO	\N	\N	3421-UI	\N	\N	\N	\N	ACTIVO	\N	22	los ficus 2313	{PHD}
9	08679926	Julio Benítez	1980-04-30 00:00:00	967439192		julibenlima@gmail.com	23960	Foton	prix	\N	Casado(a)	3	Carla peralta	987450134	turno mañana	2025-09-29 06:45:58.512	2025-09-29 06:45:58.512	\N	DESCONECTADO	\N	\N	5656-LP	\N	\N	\N	\N	ACTIVO	\N	11	la liras 560 	{PHD,PEDIATRÍA}
7	07453312	Gerson Silva	2000-11-15 00:00:00	943651100		gersonsilva3000@gmail.com	234587	FAW	frey	\N	Soltero(a)	0				2025-09-29 05:26:37.558	2025-09-30 05:27:11.104	\N	DESCONECTADO	\N	\N	2345-JL	\N	\N	\N	\N	ACTIVO	\N	38	Jr. Bellido 290 Mz. K Lot 28	{PHD}
10	09231120	Facundo Fernandez	1998-02-01 00:00:00	901672302		facundoferzd@gmail.com	YU-3459	Toyota	CORONA	\N	Soltero(a)	0				2025-09-30 22:13:44.05	2025-09-30 22:13:44.05	\N	DESCONECTADO	\N	\N	34230	\N	\N	\N	\N	ACTIVO	\N	16	Av. argentina 3449	{"MEDICINA GENERAL",PEDIATRÍA,CRÓNICO}
6	09434280	Valentín Soto	2000-11-05 00:00:00	984573460		valtesoto@gmail.com	458902	BYD	frew	\N	Soltero(a)	0	Vilma Piedraiza	900345001		2025-09-27 23:27:44.947	2025-09-30 22:14:23.872	\N	DESCONECTADO	\N	\N	345_HG	\N	\N	\N	\N	ACTIVO	\N	10	av, ballesta 345 , los cedros	{PEDIATRÍA,PRECISA,PHD}
\.


--
-- Data for Name: distritos; Type: TABLE DATA; Schema: public; Owner: prisma_user
--

COPY public.distritos (id, nombre, provincia, "codigoPostal", "createdAt", "updatedAt") FROM stdin;
2	Ancón	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
3	Ate	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
4	Barranco	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
5	Breña	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
6	Carabayllo	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
7	Chaclacayo	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
8	Chorrillos	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
9	Cieneguilla	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
10	Comas	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
11	El Agustino	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
12	Independencia	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
13	Jesús María	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
14	La Molina	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
15	La Victoria	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
16	Lima	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
17	Lince	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
18	Los Olivos	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
19	Lurigancho	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
20	Lurín	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
21	Magdalena del Mar	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
22	Miraflores	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
23	Pachacámac	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
24	Pueblo Libre	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
25	Puente Piedra	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
26	Rímac	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
27	San Bartolo	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
28	San Borja	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
29	San Isidro	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
30	San Juan de Lurigancho	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
31	San Juan de Miraflores	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
32	San Luis	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
33	San Martín de Porres	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
34	San Miguel	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
35	Santa Anita	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
36	Santiago de Surco	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
37	Surquillo	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
38	Villa El Salvador	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
39	Villa María del Triunfo	Lima	\N	2025-09-28 03:33:11.341	2025-09-28 03:33:11.341
\.


--
-- Data for Name: doctor_clinicas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_clinicas (id, doctor_id, clinica_id, dias_atencion, horario_atencion) FROM stdin;
\.


--
-- Data for Name: doctor_especialidades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_especialidades (id, doctor_id, especialidad_id, es_principal) FROM stdin;
\.


--
-- Data for Name: doctores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctores (id, dni, nombre_completo, fecha_nacimiento, celular, email, direccion_personal, "distritoId", cmp, rne, universidad, anos_experiencia, idiomas, precio_consulta, duracion_consulta, acepta_teleconsulta, estado, foto, calificacion, certificaciones, observaciones, "createdAt", "updatedAt") FROM stdin;
30	TMP13636	GALINDO GANOZA DANIELA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 21:51:53.636736	2025-10-02 21:51:53.636736
31	TMP13640	RUFO GARABITO SONIA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 21:51:53.640342	2025-10-02 21:51:53.640342
32	TMP04255	GORDILLO SANCHEZ MIGUEL ALFONSO II	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.256408	2025-10-05 03:11:44.256408
33	TMP04264	JACOBI TORRES CLAUDIO OMAR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.26461	2025-10-05 03:11:44.26461
34	TMP04267	LARA PAREDES ANDREA MERCEDES	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.268061	2025-10-05 03:11:44.268061
35	TMP04271	SANCHEZ TORRES MARIANA JOSELIN	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.271439	2025-10-05 03:11:44.271439
36	TMP04274	VELARDE CARBAJAL EDWIN RAMIRO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.274892	2025-10-05 03:11:44.274892
37	TMP04277	FLORES DARWIN ALBERTO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.278249	2025-10-05 03:11:44.278249
38	TMP04281	NAVARRO PARRA CARLOS ERNESTO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.281605	2025-10-05 03:11:44.281605
39	TMP04284	ARANIBAR PINTO IRIS JOSEFINA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.284856	2025-10-05 03:11:44.284856
48	TMP04318	ESPINOZA MEDRANO VERONICA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.318513	2025-10-05 03:11:44.318513
40	TMP04287	INFANTES MONTOYA ROGER O.	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.287898	2025-10-05 03:11:44.287898
41	TMP04291	PERICHE PAREDES LUIS JOAO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.291571	2025-10-05 03:11:44.291571
3	TMP91219	BETANCOURT SEVILLA PABLO ALBERTO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 04:59:51.21993	2025-10-02 04:59:51.21993
4	TMP91237	RODRIGUEZ . GERALDINE CAROLINA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 04:59:51.237861	2025-10-02 04:59:51.237861
5	TMP91256	ZELADA BAUTISTA NOEMI	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 04:59:51.256516	2025-10-02 04:59:51.256516
6	TMP91270	PEREZ FLORES ATHIS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 04:59:51.27034	2025-10-02 04:59:51.27034
7	TMP91285	FIGUEROA SOLORZANO MIGUEL ANGEL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 04:59:51.285386	2025-10-02 04:59:51.285386
8	TMP91290	BARBOZA VEGA NEYVA DEL CARMEN	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 04:59:51.290975	2025-10-02 04:59:51.290975
9	TMP91295	BENAVIDES JASPE PEDRO ANTONIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 04:59:51.29588	2025-10-02 04:59:51.29588
10	TMP91298	RIOS HERNANDEZ JESUS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 04:59:51.298791	2025-10-02 04:59:51.298791
11	TMP91302	GARNIQUE CERVANTES ORLANDO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 04:59:51.303053	2025-10-02 04:59:51.303053
12	TMP91310	VILLA AGUAYO CRISTIAN	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 04:59:51.310572	2025-10-02 04:59:51.310572
13	TMP91314	SILVA VASQUEZ ANDREA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 04:59:51.31487	2025-10-02 04:59:51.31487
14	TMP91317	ARANDA BUSTAMANTE FERNANDA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 04:59:51.318108	2025-10-02 04:59:51.318108
15	TMP91327	FERNANDEZ APARICIO PAOLA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 04:59:51.327563	2025-10-02 04:59:51.327563
16	TMP91330	GUTIERREZ MUÑOZ ZOILA CAROLINA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 04:59:51.330117	2025-10-02 04:59:51.330117
17	TMP91332	FLORES TITO LISSEY MEI	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 04:59:51.332982	2025-10-02 04:59:51.332982
18	TMP91336	ARBIZU SANCHEZ JANE ROSARIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 04:59:51.336473	2025-10-02 04:59:51.336473
19	TMP91340	NARCISO CASTRO EDITH YNGRID	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 04:59:51.340409	2025-10-02 04:59:51.340409
20	TMP13602	BETA SEVILLANO CARLOS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 21:51:53.602904	2025-10-02 21:51:53.602904
21	TMP13607	RAMIREZ . SOFIA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 21:51:53.607807	2025-10-02 21:51:53.607807
22	TMP13610	BARCO PRENCI NORMA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 21:51:53.611102	2025-10-02 21:51:53.611102
23	TMP13614	LIBERTY BRENDA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 21:51:53.614504	2025-10-02 21:51:53.614504
24	TMP13617	FUENTES GUERRA NINO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 21:51:53.617728	2025-10-02 21:51:53.617728
25	TMP13620	BARRERA SOLIS JUANITA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 21:51:53.620864	2025-10-02 21:51:53.620864
26	TMP13624	BERNUY VERA JULIO CESAR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 21:51:53.625039	2025-10-02 21:51:53.625039
27	TMP13627	MANRIQUE AGUAYO KIKE	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 21:51:53.628058	2025-10-02 21:51:53.628058
28	TMP13630	VILLAVICENCIO IGUIA WALTER	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 21:51:53.630722	2025-10-02 21:51:53.630722
29	TMP13634	AITA TOLEDO FRANCO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado automáticamente desde importación Excel - Completar datos	2025-10-02 21:51:53.634376	2025-10-02 21:51:53.634376
42	TMP04294	QUENAYA RIVA CARLOS ENRIQUE	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.294757	2025-10-05 03:11:44.294757
43	TMP04297	TORDOYA LIZARRAGA GRECIA DENISSE	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.297784	2025-10-05 03:11:44.297784
44	TMP04300	SOTO AVILA YOMAIRA DEL CARMEN	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.300828	2025-10-05 03:11:44.300828
45	TMP04305	GOYZUETA SEGURA CLIDY AMELIA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.305386	2025-10-05 03:11:44.305386
46	TMP04311	ORTEGA FARFAN CARLOS ENRIQUE	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.311736	2025-10-05 03:11:44.311736
47	TMP04314	CHAVEZ MORENO ROXANA GERTRUDIS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.314959	2025-10-05 03:11:44.314959
49	TMP04330	DE LA FUENTE CHAVEZ LUNA DINO ALEJANDRO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.330275	2025-10-05 03:11:44.330275
50	TMP04334	LESCANO SALAS ROBERTO JUSTO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.335022	2025-10-05 03:11:44.335022
51	TMP04338	MENENDEZ AMES JAIME LUIS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.338217	2025-10-05 03:11:44.338217
52	TMP04341	QUINTERO MOLINA MATIAS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.341439	2025-10-05 03:11:44.341439
53	TMP04344	SEMINARIO VITTORIA ALESSIA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.344552	2025-10-05 03:11:44.344552
54	TMP04347	TORRES SANTOS JUAN EDUARDO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.347585	2025-10-05 03:11:44.347585
55	TMP04350	VILLARREAL VARGAS BORIS JAVIER	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.350717	2025-10-05 03:11:44.350717
56	TMP04353	COLINA BORGES YORYI JESUS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.354083	2025-10-05 03:11:44.354083
57	TMP04359	MORA RODRIGUEZ JOSE ALBERTO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.359836	2025-10-05 03:11:44.359836
58	TMP04363	ROMERO ALEJO YESI CAROLINA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.363267	2025-10-05 03:11:44.363267
59	TMP04366	FLORES SANTILLAN CRISTHIAN	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.366504	2025-10-05 03:11:44.366504
60	TMP04369	FRANCIA FLORES SUE HELEN	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.369534	2025-10-05 03:11:44.369534
61	TMP04374	SARMIENTO TORO MAHILLOGIRIS JOSEFINA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.374301	2025-10-05 03:11:44.374301
62	TMP04377	ULLOQUE HUAYANCA JOHANN ALBERTO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.377579	2025-10-05 03:11:44.377579
63	TMP04384	LINARES PIZARRO ROBERTO CARLOS	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.38436	2025-10-05 03:11:44.38436
64	TMP04387	LUNA CONTRERAS LUIS ENRIQUE	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.387588	2025-10-05 03:11:44.387588
65	TMP04397	GONZALEZ GONZALEZ ALBERTO ANTONIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.397696	2025-10-05 03:11:44.397696
66	TMP04402	ANDERSON DIAZ CARLOS ENRIQUE	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.402258	2025-10-05 03:11:44.402258
67	TMP04404	DIAZ TORO SILVIA CRISTINA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.404973	2025-10-05 03:11:44.404973
68	TMP04407	MEDINA SANCHEZ FLOR AZUCENA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.407832	2025-10-05 03:11:44.407832
69	TMP04416	TOLEDO DESIREE DEL CARMEN	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.416322	2025-10-05 03:11:44.416322
70	TMP04419	ALFARO ZOLA GIAN CARLO MAURICIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.419352	2025-10-05 03:11:44.419352
71	TMP04435	REYES PEREZ HECBRIG ISABEL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.435956	2025-10-05 03:11:44.435956
72	TMP04440	ALEJOS CARRION REYNALDO MARTIN	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.440807	2025-10-05 03:11:44.440807
73	TMP04445	GARCIA TEJADA JOSE ENRIQUE	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.445455	2025-10-05 03:11:44.445455
74	TMP04450	TORRES MENDEZ DE RIVERA MARIA DEL PILAR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.450397	2025-10-05 03:11:44.450397
75	TMP04457	PIQUE LANDEO RICARDO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.458153	2025-10-05 03:11:44.458153
76	TMP04460	VILLACORTA SANCHEZ LAURA ISABEL	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.461144	2025-10-05 03:11:44.461144
77	TMP04472	ALVARADO LEON BIANCA MIREYA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.472216	2025-10-05 03:11:44.472216
78	TMP04478	TICONA TAPIA V. EDUARDO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.478197	2025-10-05 03:11:44.478197
79	TMP04492	POMACONDOR IRAITA ERICK DAVID	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.492621	2025-10-05 03:11:44.492621
80	TMP04501	YUPANQUI ATENCIO ANTONELLA BETZABETH	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.501259	2025-10-05 03:11:44.501259
81	TMP04512	TIZON PEÑA KATTERINE ROSSE	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.512988	2025-10-05 03:11:44.512988
82	TMP04542	VERA BORJA DANY ROXANA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.542604	2025-10-05 03:11:44.542604
83	TMP04576	SARMIENTO AMAO CARLOS ANTONIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.577067	2025-10-05 03:11:44.577067
84	TMP04584	NOGUERA GARCIA MARIANGELA	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.584214	2025-10-05 03:11:44.584214
85	TMP04586	AMADO SKOVER EDUARDO AURELIO	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	Creado desde importación Excel	2025-10-05 03:11:44.587147	2025-10-05 03:11:44.587147
86	TMP02922	DOCTOR	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	ACTIVO	\N	\N	\N	\N	2025-10-05 03:38:22.922256	2025-10-05 03:38:22.922256
\.


--
-- Data for Name: especialidades; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.especialidades (id, nombre, categoria, es_subespecialidad, especialidad_padre_id, descripcion, "createdAt", "updatedAt") FROM stdin;
1	Medicina General	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
2	Medicina Interna	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
3	Medicina Familiar	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
4	Geriatría	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
5	Pediatría	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
6	Neonatología	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
7	Cirugía General	QUIRURGICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
8	Cirugía Cardiovascular	QUIRURGICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
9	Cirugía Plástica y Reconstructiva	QUIRURGICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
10	Cirugía Pediátrica	QUIRURGICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
11	Neurocirugía	QUIRURGICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
12	Cirugía de Tórax	QUIRURGICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
13	Cirugía Oncológica	QUIRURGICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
14	Cirugía Vascular	QUIRURGICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
15	Cardiología	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
16	Neumología	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
17	Gastroenterología	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
18	Nefrología	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
19	Endocrinología	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
20	Hematología	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
21	Oncología Médica	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
22	Reumatología	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
23	Infectología	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
24	Dermatología	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
25	Inmunología	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
26	Alergología	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
27	Psiquiatría	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
28	Psicología Clínica	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
29	Neurología	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
30	Ginecología	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
31	Obstetricia	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
32	Medicina Materno Fetal	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
33	Medicina de Emergencias	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
34	Medicina Intensiva	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
35	Anestesiología	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
36	Medicina Física y Rehabilitación	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
37	Medicina del Deporte	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
38	Medicina Ocupacional	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
39	Radiología	DIAGNOSTICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
40	Medicina Nuclear	DIAGNOSTICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
41	Ecografía	DIAGNOSTICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
42	Tomografía	DIAGNOSTICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
43	Patología Clínica	DIAGNOSTICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
44	Anatomía Patológica	DIAGNOSTICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
45	Oftalmología	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
46	Otorrinolaringología	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
47	Urología	QUIRURGICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
48	Traumatología y Ortopedia	QUIRURGICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
49	Medicina Natural	NATURAL	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
50	Homeopatía	NATURAL	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
51	Acupuntura	NATURAL	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
52	Medicina Tradicional China	NATURAL	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
53	Terapias Alternativas	NATURAL	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
54	Fitoterapia	NATURAL	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
55	Nutrición y Dietética	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
56	Odontología General	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
57	Ortodoncia	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
58	Periodoncia	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
59	Endodoncia	MEDICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
60	Cirugía Oral y Maxilofacial	QUIRURGICA	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
61	Otra Especialidad	OTRO	f	\N	\N	2025-10-01 02:20:03.456178	2025-10-01 02:20:03.456178
\.


--
-- Data for Name: importaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.importaciones (id, nombre_archivo, total_registros, registros_procesados, registros_error, doctores_nuevos, estado, "createdAt", "updatedAt", codigo) FROM stdin;
1	SOLICITUD DE CONDUCTORES MAD - 12 DE SETIEMBRE - JP.xls	24	21	0	1	COMPLETADO	2025-10-05 03:38:22.898091	2025-10-05 03:38:22.898091	ZURI000001
2	PROGRAMACION SEMANA 041025.xlsx	178	178	0	0	COMPLETADO	2025-10-05 03:38:53.184202	2025-10-05 03:38:53.184202	ZURI000002
\.


--
-- Data for Name: importaciones_excel; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.importaciones_excel (id, codigo_zuri, nombre_archivo, fecha_archivo, fecha_importacion, total_registros, registros_procesados, registros_error, registros_duplicados, doctores_nuevos, doctores_existentes, estado, usuario_importacion, notas, errores_log, estadisticas, created_at, updated_at) FROM stdin;
2	ZUR000004	SOLICITUD DE CONDUCTORES MAD - MARTES 24 JUNIO DEL 2025 - JP.xlsx	2025-06-24	2025-10-02 04:59:51.214304	20	20	0	0	17	3	COMPLETADO	Sistema	\N	[]	\N	2025-10-02 04:59:51.214304	2025-10-02 04:59:51.348464
3	ZUR000005	SOLICITUD DE CONDUCTORES MAD - 12 DE SETIEMBRE - JP.xls	2025-10-02	2025-10-02 21:51:53.597194	20	20	0	0	12	8	COMPLETADO	Sistema	\N	[]	\N	2025-10-02 21:51:53.597194	2025-10-02 21:51:53.647636
\.


--
-- Data for Name: motivos_no_disponibilidad; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.motivos_no_disponibilidad (id, codigo, descripcion, activo, created_at) FROM stdin;
1	DESCANSO-FAMILIAR	PIDIÓ DESCANSO ASUNTO FAMILIAR	t	2025-10-03 05:08:47.033814
2	LIBRE-TARDE	LIBRE DISPONIBLE EN LA TARDE	t	2025-10-03 05:08:47.033814
3	SOLO-FDS	SOLO SALE FDS	t	2025-10-03 05:08:47.033814
4	MANTENIMIENTO	MANTENIMIENTO DE LA UNIDAD	t	2025-10-03 05:08:47.033814
5	DISPONIBLE-MAÑANA	DISPONIBLE SOLO MAÑANA	t	2025-10-03 05:08:47.033814
6	DISPONIBLE-TARDE	DISPONIBLE SOLO TARDE	t	2025-10-03 05:08:47.033814
\.


--
-- Data for Name: pacientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pacientes (id, dni, nombre_completo, fecha_nacimiento, edad, celular, email, telefono_fijo, direccion, "distritoId", referencia, nombre_emergencia, parentesco_emergencia, celular_emergencia, seguro_medico, nombre_seguro, numero_poliza, tipo_movilidad, requiere_oxigeno, requiere_acompanante, peso_aproximado, alergias, medicamentos_actuales, condiciones_cronicas, restricciones_dieteticas, observaciones_medicas, estado, idioma_preferido, numero_servicios, ultima_visita, proxima_cita, documento_dni, documento_seguro, "createdAt", "updatedAt") FROM stdin;
1	08347645	Susana Zumaeta		56	945090982	susanazumaeta12@gmail.com		Av. carlos izaguirre 1010, 	18		carlos ayquipa			SI	rimac		SILLA_RUEDAS	f	f	\N		\N	\N	\N		ACTIVO	\N	0	\N	\N	\N	\N	2025-10-01 05:12:22.779194	2025-10-01 23:43:59.878428
\.


--
-- Data for Name: programacion_detalles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.programacion_detalles (id, programacion_id, solicitud_servicio_id, tipo_servicio_id, cliente_id, cliente_nombre, doctor_id, doctor_nombre, conductor_id, conductor_nombre, fecha, hora_inicio, hora_fin, turno, ubicacion, direccion_completa, estado, calificacion_id, calificacion_detalle, motivo_no_disponibilidad_id, observaciones, incidencias, orden, created_at, updated_at, area_servicio_id, cliente_especial_id) FROM stdin;
8	1	7	\N	\N	SANNA	9	BENAVIDES JASPE PEDRO ANTONIO	7	\N	2025-06-24	07:00:00	15:00:00	M	VILLA EL SALVADOR/VILLA EL SALVADOR	VILLA EL SALVADOR/VILLA EL SALVADOR	PROGRAMADO	\N	\N	\N	\N	\N	8	2025-10-03 05:49:40.063242	2025-10-03 05:49:40.063242	\N	\N
9	1	9	\N	\N	SANNA	11	GARNIQUE CERVANTES ORLANDO	3	\N	2025-06-24	07:30:00	13:00:00	M	BELLAVISTA/BELLAVISTA	BELLAVISTA/BELLAVISTA	PROGRAMADO	\N	\N	\N	\N	\N	9	2025-10-03 05:49:40.063242	2025-10-03 05:49:40.063242	\N	\N
11	1	15	\N	\N	SANNA	4	RODRIGUEZ . GERALDINE CAROLINA	4	\N	2025-06-24	14:30:00	22:00:00	T	SURCO/SURCO	SURCO/SURCO	PROGRAMADO	\N	\N	\N	\N	\N	11	2025-10-03 05:49:40.063242	2025-10-03 05:49:40.063242	\N	\N
7	1	17	4	\N	SANNA	16	GUTIERREZ MUÑOZ ZOILA CAROLINA	9	\N	2025-06-24	07:00:00	18:00:00	M	COMAS/LOS OLIVOS	COMAS/LOS OLIVOS	PROGRAMADO	\N	\N	\N	\N	\N	7	2025-10-03 05:49:40.063242	2025-10-03 05:52:22.506127	\N	\N
4	1	4	1	\N	SANNA	6	PEREZ FLORES ATHIS	4	\N	2025-06-24	06:30:00	13:30:00	M	SURCO/SURCO	SURCO/SURCO	PROGRAMADO	\N	\N	\N	\N	\N	4	2025-10-03 05:49:40.063242	2025-10-04 00:18:16.915894	\N	\N
3	1	3	3	\N	SANNA	5	ZELADA BAUTISTA NOEMI	8	\N	2025-06-24	06:00:00	13:00:00	M	CHORRILLOS/CHORRILLOS	CHORRILLOS/CHORRILLOS	PROGRAMADO	\N	\N	\N	\N	\N	3	2025-10-03 05:49:40.063242	2025-10-04 03:12:54.809716	1	1
5	1	5	7	\N	SANNA	7	FIGUEROA SOLORZANO MIGUEL ANGEL	6	\N	2025-06-24	06:30:00	14:00:00	M	SAN MIGUEL/SAN MIGUEL	SAN MIGUEL/SAN MIGUEL	PROGRAMADO	\N	\N	\N	\N	\N	5	2025-10-03 05:49:40.063242	2025-10-04 03:14:08.618626	3	2
6	1	8	5	\N	SANNA	10	RIOS HERNANDEZ JESUS	7	\N	2025-06-24	07:00:00	18:00:00	M	SURCO/SURCO	SURCO/SURCO	PROGRAMADO	\N	\N	\N	\N	\N	6	2025-10-03 05:49:40.063242	2025-10-04 03:14:30.853438	4	1
1	1	2	1	\N	SANNA	4	RODRIGUEZ . GERALDINE CAROLINA	8	\N	2025-06-24	06:00:00	13:00:00	M	SURCO/SURCO	SURCO/SURCO	PROGRAMADO	2	\N	\N	\N	\N	1	2025-10-03 05:49:40.063242	2025-10-04 03:15:59.931655	2	1
2	1	1	7	\N	SANNA	3	BETANCOURT SEVILLA PABLO ALBERTO	8	\N	2025-06-24	06:00:00	15:30:00	M	BRENA/BRENA	BRENA/BRENA	PROGRAMADO	\N	\N	\N	\N	\N	2	2025-10-03 05:49:40.063242	2025-10-04 05:02:54.234745	3	2
10	1	18	3	\N	SANNA	17	FLORES TITO LISSEY MEI	6	\N	2025-06-24	08:00:00	14:00:00	M	JESUS MARIA (PABLO BERMUDEZ)/LINCE	JESUS MARIA (PABLO BERMUDEZ)/LINCE	PROGRAMADO	\N	\N	\N	\N	\N	10	2025-10-03 05:49:40.063242	2025-10-04 05:56:47.10047	5	2
15	2	25	\N	\N	SANNA	24	FUENTES GUERRA NINO	8	\N	2025-10-02	06:30:00	14:00:00	M	SAN MIGUEL/SAN MIGUEL	SAN MIGUEL/SAN MIGUEL	PROGRAMADO	\N	\N	\N	\N	\N	4	2025-10-04 06:29:20.990003	2025-10-04 06:29:20.990003	\N	\N
12	2	21	3	\N	SANNA	20	BETA SEVILLANO CARLOS	7	\N	2025-10-02	06:00:00	15:30:00	M	BRENA/BRENA	BRENA/BRENA	PROGRAMADO	\N	\N	\N	\N	\N	1	2025-10-04 06:29:20.990003	2025-10-04 06:30:32.61633	4	1
14	2	24	6	\N	SANNA	23	LIBERTY BRENDA	6	\N	2025-10-02	06:30:00	13:30:00	M	SURCO/SURCO	SURCO/SURCO	PROGRAMADO	\N	\N	\N	\N	\N	3	2025-10-04 06:29:20.990003	2025-10-04 06:31:00.016558	3	2
13	2	23	5	\N	SANNA	22	BARCO PRENCI NORMA	10	\N	2025-10-02	06:00:00	13:00:00	M	CHORRILLOS/CHORRILLOS	CHORRILLOS/CHORRILLOS	PROGRAMADO	\N	\N	\N	\N	\N	2	2025-10-04 06:29:20.990003	2025-10-04 06:36:58.215475	1	1
16	2	27	7	\N	SANNA	9	BENAVIDES JASPE PEDRO ANTONIO	3	\N	2025-10-02	07:00:00	15:00:00	M	VILLA EL SALVADOR/VILLA EL SALVADOR	VILLA EL SALVADOR/VILLA EL SALVADOR	PROGRAMADO	\N	\N	\N	\N	\N	5	2025-10-04 06:29:20.990003	2025-10-04 06:37:26.485056	2	3
17	2	26	3	\N	SANNA	25	BARRERA SOLIS JUANITA	9	\N	2025-10-02	07:00:00	15:00:00	M	LA PERLA/LA PERLA	LA PERLA/LA PERLA	PROGRAMADO	\N	\N	\N	\N	\N	6	2025-10-04 06:29:20.990003	2025-10-04 06:37:44.849518	1	1
\.


--
-- Data for Name: programaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.programaciones (id, codigo_programacion, importacion_id, fecha_programacion, cliente_id, cliente_nombre, tipo_servicio_id, estado, notas, creado_por, created_at, updated_at, cliente_especial_id) FROM stdin;
1	ZPROG000001	2	2025-06-24	\N	SANNA	\N	CONFIRMADO	\N	Sistema	2025-10-03 05:49:40.063242	2025-10-04 03:43:00.353834	\N
2	ZPROG000002	3	2025-10-02	\N	SANNA	\N	CONFIRMADO	\N	Sistema	2025-10-04 06:29:20.990003	2025-10-04 06:42:53.767642	\N
\.


--
-- Data for Name: servicios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.servicios (id, codigo, "pacienteNombre", "pacienteDni", "pacienteTelefono", "pacienteObservaciones", "origenDireccion", "origenLatitud", "origenLongitud", "origenReferencia", "destinoDireccion", "destinoLatitud", "destinoLongitud", "destinoReferencia", "fechaHora", "fechaHoraLlegada", "fechaHoraRecojo", "fechaHoraEntrega", "tiempoEstimado", "distanciaEstimada", "distanciaReal", estado, "tipoServicio", prioridad, "conductorId", "fechaAsignacion", "fechaAceptacion", "fechaInicio", "fechaFinalizacion", "clinicaId", "rutaOptimizada", "rutaReal", "puntoControl", observaciones, incidentes, "motivoCancelacion", calificacion, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: solicitudes_servicios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.solicitudes_servicios (id, importacion_id, fecha_servicio, hora_inicio, hora_fin, turno, tipo_servicio, doctor_id, doctor_nombre, cliente_nombre, ubicacion, distrito, conductor_id, conductor_nombre, estado, observaciones, "createdAt", "updatedAt") FROM stdin;
1	1	2025-09-12	06:00:00	15:30:00	M	AGUDO	20	BETA SEVILLANO CARLOS	SANNA	\N	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:22.901877	2025-10-05 03:38:22.901877
2	1	2025-09-12	06:00:00	13:00:00	M	AGUDO	21	RAMIREZ . SOFIA	SANNA	\N	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:22.903966	2025-10-05 03:38:22.903966
3	1	2025-09-12	06:00:00	13:00:00	M	AGUDO	22	BARCO PRENCI NORMA	SANNA	\N	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:22.9053	2025-10-05 03:38:22.9053
4	1	2025-09-12	06:30:00	13:30:00	M	AGUDO	23	LIBERTY BRENDA	SANNA	\N	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:22.906823	2025-10-05 03:38:22.906823
5	1	2025-09-12	06:30:00	14:00:00	M	AGUDO	24	FUENTES GUERRA NINO	SANNA	\N	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:22.908071	2025-10-05 03:38:22.908071
6	1	2025-09-12	07:00:00	15:00:00	M	AGUDO	25	BARRERA SOLIS JUANITA	SANNA	\N	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:22.909418	2025-10-05 03:38:22.909418
7	1	2025-09-12	07:00:00	15:00:00	M	AGUDO	9	BENAVIDES JASPE PEDRO ANTONIO	SANNA	\N	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:22.910702	2025-10-05 03:38:22.910702
8	1	2025-09-12	07:00:00	18:00:00	M	AGUDO	26	BERNUY VERA JULIO CESAR	SANNA	\N	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:22.911949	2025-10-05 03:38:22.911949
9	1	2025-09-12	07:30:00	13:00:00	M	AGUDO	27	MANRIQUE AGUAYO KIKE	SANNA	\N	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:22.913007	2025-10-05 03:38:22.913007
10	1	2025-09-12	08:00:00	15:00:00	M	AGUDO	28	VILLAVICENCIO IGUIA WALTER	SANNA	\N	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:22.914208	2025-10-05 03:38:22.914208
11	1	2025-09-12	08:00:00	20:00:00	M	AGUDO	13	SILVA VASQUEZ ANDREA	SANNA	\N	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:22.915345	2025-10-05 03:38:22.915345
12	1	2025-09-12	13:00:00	20:00:00	T	AGUDO	29	AITA TOLEDO FRANCO	SANNA	\N	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:22.916575	2025-10-05 03:38:22.916575
13	1	2025-09-12	14:00:00	19:30:00	T	AGUDO	30	GALINDO GANOZA DANIELA	SANNA	\N	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:22.917661	2025-10-05 03:38:22.917661
14	1	2025-09-12	14:00:00	00:00:00	T	AGUDO	6	PEREZ FLORES ATHIS	SANNA	\N	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:22.918752	2025-10-05 03:38:22.918752
15	1	2025-09-12	14:30:00	22:00:00	T	AGUDO	31	RUFO GARABITO SONIA	SANNA	\N	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:22.91987	2025-10-05 03:38:22.91987
16	1	2025-09-12	15:00:00	01:00:00	T	AGUDO	15	FERNANDEZ APARICIO PAOLA	SANNA	\N	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:22.920954	2025-10-05 03:38:22.920954
17	1	\N	\N	\N	TURNO	CLASIFICACION	86	DOCTOR	SANNA	\N	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:22.923377	2025-10-05 03:38:22.923377
18	1	2025-09-12	07:00:00	18:00:00	M	AGUDO	16	GUTIERREZ MUÑOZ ZOILA CAROLINA	SANNA	\N	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:22.924675	2025-10-05 03:38:22.924675
19	1	2025-09-12	08:00:00	14:00:00	M	AGUDO	17	FLORES TITO LISSEY MEI	SANNA	\N	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:22.925822	2025-10-05 03:38:22.925822
20	1	2025-09-12	08:00:00	14:00:00	M	AGUDO	18	ARBIZU SANCHEZ JANE ROSARIO	SANNA	\N	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:22.927042	2025-10-05 03:38:22.927042
21	1	2025-09-12	14:00:00	20:00:00	T	AGUDO	19	NARCISO CASTRO EDITH YNGRID	SANNA	\N	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:22.928212	2025-10-05 03:38:22.928212
22	2	\N	07:00:00	14:00:00	MAÑANA	MAD	32	GORDILLO SANCHEZ MIGUEL ALFONSO II	SANNA	Calle Monet 179 Dpto. 302	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.189153	2025-10-05 03:38:53.189153
23	2	\N	07:00:00	15:00:00	MAÑANA	MAD	33	JACOBI TORRES CLAUDIO OMAR	SANNA	Claude Monteverdi 153 Dpto. 104	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.192477	2025-10-05 03:38:53.192477
24	2	\N	07:00:00	15:00:00	MAÑANA	MAD	34	LARA PAREDES ANDREA MERCEDES	SANNA	Jr Mateo Pumacahua 1616	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.194482	2025-10-05 03:38:53.194482
25	2	\N	07:00:00	14:00:00	MAÑANA	MAD	35	SANCHEZ TORRES MARIANA JOSELIN	SANNA	Calle Chariarse 885 Dpto. 1301	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.196445	2025-10-05 03:38:53.196445
26	2	\N	07:00:00	14:00:00	MAÑANA	MAD	36	VELARDE CARBAJAL EDWIN RAMIRO	SANNA	Av General Cordova 515 Dpto. 602	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.198057	2025-10-05 03:38:53.198057
27	2	\N	07:00:00	14:00:00	MAÑANA	SM	37	FLORES DARWIN ALBERTO	SANNA	Jr Las Grosellas 970 Urb. Las Flores	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.199792	2025-10-05 03:38:53.199792
28	2	\N	07:00:00	14:00:00	MAÑANA	SM	38	NAVARRO PARRA CARLOS ERNESTO	SANNA	Av Guardia Peruana 205 Piso 1	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.201501	2025-10-05 03:38:53.201501
29	2	\N	07:00:00	14:00:00	MAÑANA	MAD	39	ARANIBAR PINTO IRIS JOSEFINA	SANNA	Av Salaverry 2080 Dpto. 803	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.202982	2025-10-05 03:38:53.202982
30	2	\N	07:00:00	15:00:00	MAÑANA	MAD	40	INFANTES MONTOYA ROGER O.	SANNA	Sor Mate N° 261	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.204757	2025-10-05 03:38:53.204757
31	2	\N	07:00:00	14:00:00	MAÑANA	MAD	41	PERICHE PAREDES LUIS JOAO	SANNA	Calle Braulio Sancho Davila 170 Urb. El Bosque	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.206354	2025-10-05 03:38:53.206354
32	2	\N	08:00:00	14:00:00	MAÑANA	MAD	42	QUENAYA RIVA CARLOS ENRIQUE	SANNA	Calle Armando Zamudio 148 San Roque	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.207926	2025-10-05 03:38:53.207926
33	2	\N	07:00:00	14:00:00	MAÑANA	MAD	43	TORDOYA LIZARRAGA GRECIA DENISSE	SANNA	Av. Guardia Civil 1297	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.209658	2025-10-05 03:38:53.209658
34	2	\N	07:00:00	13:00:00	MAÑANA	SM	44	SOTO AVILA YOMAIRA DEL CARMEN	SANNA	Jr Francisco de Cuellar 500 Dpto. 112	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.211276	2025-10-05 03:38:53.211276
35	2	\N	15:00:00	21:00:00	TARDE	MAD	32	GORDILLO SANCHEZ MIGUEL ALFONSO II	SANNA	Calle Monet 179 Dpto. 302	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.212989	2025-10-05 03:38:53.212989
36	2	\N	15:00:00	22:00:00	TARDE	MAD	45	GOYZUETA SEGURA CLIDY AMELIA	SANNA	Calle Centauro F11 Urb. Los Granados	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.214904	2025-10-05 03:38:53.214904
37	2	\N	15:00:00	22:00:00	TARDE	SM	37	FLORES DARWIN ALBERTO	SANNA	Jr Las Grosellas 970 Urb. Las Flores	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.216872	2025-10-05 03:38:53.216872
38	2	\N	15:00:00	22:00:00	TARDE	SM	38	NAVARRO PARRA CARLOS ERNESTO	SANNA	Av Guardia Peruana 205 Piso 1	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.21891	2025-10-05 03:38:53.21891
39	2	\N	15:00:00	22:00:00	TARDE	SM	46	ORTEGA FARFAN CARLOS ENRIQUE	SANNA	Calle Carlos Tenaud 230 Dpto. 503	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.220941	2025-10-05 03:38:53.220941
40	2	\N	14:00:00	22:00:00	TARDE	MAD	47	CHAVEZ MORENO ROXANA GERTRUDIS	SANNA	Jr Mariscal Castilla 520 Plaza Punkuri Block b Dpto. 202	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.223121	2025-10-05 03:38:53.223121
41	2	\N	15:00:00	22:00:00	TARDE	MAD	48	ESPINOZA MEDRANO VERONICA	SANNA	Jr Estados Unidos 1278	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.224936	2025-10-05 03:38:53.224936
42	2	\N	15:00:00	22:00:00	TARDE	MAD	41	PERICHE PAREDES LUIS JOAO	SANNA	Calle Braulio Sancho Davila 170 Urb. El Bosque	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.227363	2025-10-05 03:38:53.227363
43	2	\N	15:00:00	22:00:00	TARDE	MAD	42	QUENAYA RIVA CARLOS ENRIQUE	SANNA	Calle Armando Zamudio 148 San Roque	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.228872	2025-10-05 03:38:53.228872
44	2	\N	15:00:00	22:00:00	TARDE	MAD	43	TORDOYA LIZARRAGA GRECIA DENISSE	SANNA	Calle Montesquieu A-13	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.230613	2025-10-05 03:38:53.230613
45	2	\N	14:00:00	21:00:00	TARDE	SM	44	SOTO AVILA YOMAIRA DEL CARMEN	SANNA	Jr Francisco de Cuellar 500 Dpto. 112	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.232583	2025-10-05 03:38:53.232583
46	2	\N	07:00:00	14:00:00	MAÑANA	MAD	49	DE LA FUENTE CHAVEZ LUNA DINO ALEJANDRO	SANNA	Calle Doña Delmira 280 Dpto. 401	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.23503	2025-10-05 03:38:53.23503
47	2	\N	07:00:00	15:00:00	MAÑANA	MAD	33	JACOBI TORRES CLAUDIO OMAR	SANNA	Claude Monteverdi 153 Dpto. 104	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.237037	2025-10-05 03:38:53.237037
48	2	\N	07:00:00	15:00:00	MAÑANA	MAD	50	LESCANO SALAS ROBERTO JUSTO	SANNA	Batallón Concepción 153 Urb. Santa Teresa	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.23852	2025-10-05 03:38:53.23852
49	2	\N	07:00:00	14:00:00	MAÑANA	MAD	51	MENENDEZ AMES JAIME LUIS	SANNA	Calle Rio Urubamba 194 Dpto. 101	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.240268	2025-10-05 03:38:53.240268
50	2	\N	07:00:00	14:00:00	MAÑANA	MAD	52	QUINTERO MOLINA MATIAS	SANNA	Calle Matarani 204	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.242501	2025-10-05 03:38:53.242501
51	2	\N	07:00:00	14:00:00	MAÑANA	MAD	53	SEMINARIO VITTORIA ALESSIA	SANNA	Jr Jacarandá 370 Dpto. 202	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.244188	2025-10-05 03:38:53.244188
52	2	\N	07:00:00	13:00:00	MAÑANA	MAD	54	TORRES SANTOS JUAN EDUARDO	SANNA	Parque Almagro 112	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.24599	2025-10-05 03:38:53.24599
53	2	\N	07:00:00	14:00:00	MAÑANA	MAD	55	VILLARREAL VARGAS BORIS JAVIER	SANNA	Calle Los Chimús 285 Dpto. 403 Urb. Maranga	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.248021	2025-10-05 03:38:53.248021
54	2	\N	07:00:00	14:00:00	MAÑANA	SM	56	COLINA BORGES YORYI JESUS	SANNA	Av Alameda sur Mz F Lt 3, Asociación Bello Horizonte	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.249742	2025-10-05 03:38:53.249742
55	2	\N	07:00:00	14:00:00	MAÑANA	SM	37	FLORES DARWIN ALBERTO	SANNA	Jr Las Grosellas 970 Urb. Las Flores	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.251447	2025-10-05 03:38:53.251447
56	2	\N	07:00:00	14:00:00	MAÑANA	SM	57	MORA RODRIGUEZ JOSE ALBERTO	SANNA	Calle Los Gorriones 279 Edificio New York Dpto. 202	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.253103	2025-10-05 03:38:53.253103
57	2	\N	07:00:00	14:00:00	MAÑANA	SM	58	ROMERO ALEJO YESI CAROLINA	SANNA	Provivienda San Antonio Mz B Lt 29	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.254994	2025-10-05 03:38:53.254994
58	2	\N	09:00:00	15:00:00	MAÑANA	MAD	59	FLORES SANTILLAN CRISTHIAN	SANNA	Calle Octavio Paz 285 Dpto. 301  Urb. La Calera de La Merced	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.256897	2025-10-05 03:38:53.256897
59	2	\N	08:00:00	15:00:00	MAÑANA	MAD	60	FRANCIA FLORES SUE HELEN	SANNA	Urb. El Pacífico Mz N Lt 10 3era. Etapa	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.258754	2025-10-05 03:38:53.258754
60	2	\N	08:00:00	14:00:00	MAÑANA	MAD	42	QUENAYA RIVA CARLOS ENRIQUE	SANNA	Calle Armando Zamudio 148 San Roque	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.260453	2025-10-05 03:38:53.260453
61	2	\N	08:00:00	15:00:00	MAÑANA	MAD	61	SARMIENTO TORO MAHILLOGIRIS JOSEFINA	SANNA	Av. Brasil 1458 Dpto. 602B	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.26216	2025-10-05 03:38:53.26216
62	2	\N	07:00:00	14:00:00	MAÑANA	MAD	62	ULLOQUE HUAYANCA JOHANN ALBERTO	SANNA	Calle Hualgayoc 192 Urb Cahuache	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.264049	2025-10-05 03:38:53.264049
63	2	\N	07:00:00	13:00:00	MAÑANA	SM	44	SOTO AVILA YOMAIRA DEL CARMEN	SANNA	Jr Francisco de Cuellar 500 Dpto. 112	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.266266	2025-10-05 03:38:53.266266
64	2	\N	16:00:00	22:00:00	TARDE	MAD	63	LINARES PIZARRO ROBERTO CARLOS	SANNA	Av Costanera 2810	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.268268	2025-10-05 03:38:53.268268
65	2	\N	15:00:00	21:00:00	TARDE	MAD	64	LUNA CONTRERAS LUIS ENRIQUE	SANNA	Av Tizon y Bueno 170 Dpto. 315	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.270255	2025-10-05 03:38:53.270255
66	2	\N	15:00:00	22:00:00	TARDE	MAD	36	VELARDE CARBAJAL EDWIN RAMIRO	SANNA	Av General Cordova 515 Dpto. 602	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.27237	2025-10-05 03:38:53.27237
67	2	\N	15:00:00	22:00:00	TARDE	MAD	55	VILLARREAL VARGAS BORIS JAVIER	SANNA	Calle Los Chimús 285 Dpto. 403 Urb. Maranga	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.275193	2025-10-05 03:38:53.275193
68	2	\N	15:00:00	22:00:00	TARDE	SM	56	COLINA BORGES YORYI JESUS	SANNA	Av Alameda sur Mz F Lt 3, Asociación Bello Horizonte	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.27805	2025-10-05 03:38:53.27805
69	2	\N	15:00:00	22:00:00	TARDE	SM	37	FLORES DARWIN ALBERTO	SANNA	Jr Las Grosellas 970 Urb. Las Flores	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.280679	2025-10-05 03:38:53.280679
70	2	\N	15:00:00	22:00:00	TARDE	SM	65	GONZALEZ GONZALEZ ALBERTO ANTONIO	SANNA	Jr Madrileña 192 Dpto. 607 Urb. Villa Jardin	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.282872	2025-10-05 03:38:53.282872
71	2	\N	15:00:00	22:00:00	TARDE	SM	57	MORA RODRIGUEZ JOSE ALBERTO	SANNA	Calle Los Gorriones 279 Edificio New York Dpto. 202	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.285137	2025-10-05 03:38:53.285137
72	2	\N	15:00:00	21:00:00	TARDE	MAD	66	ANDERSON DIAZ CARLOS ENRIQUE	SANNA	Calle Toulon 135 Condominio las Cumbres Torre 4 Dpto. 1103	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.28764	2025-10-05 03:38:53.28764
73	2	\N	15:00:00	22:00:00	TARDE	MAD	67	DIAZ TORO SILVIA CRISTINA	SANNA	Av Arequipa 2655 Dpto. 902	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.290256	2025-10-05 03:38:53.290256
74	2	\N	17:30:00	22:30:00	TARDE	MAD	68	MEDINA SANCHEZ FLOR AZUCENA	SANNA	SABADO Cueto 120	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.292715	2025-10-05 03:38:53.292715
75	2	\N	15:00:00	22:00:00	TARDE	MAD	42	QUENAYA RIVA CARLOS ENRIQUE	SANNA	Calle Armando Zamudio 148 San Roque	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.295272	2025-10-05 03:38:53.295272
76	2	\N	15:00:00	22:00:00	TARDE	MAD	62	ULLOQUE HUAYANCA JOHANN ALBERTO	SANNA	Calle Hualgayoc 192 Urb Cahuache	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.297814	2025-10-05 03:38:53.297814
77	2	\N	14:00:00	21:00:00	TARDE	SM	44	SOTO AVILA YOMAIRA DEL CARMEN	SANNA	Jr Francisco de Cuellar 500 Dpto. 112	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.300102	2025-10-05 03:38:53.300102
78	2	\N	14:00:00	21:00:00	TARDE	SM	69	TOLEDO DESIREE DEL CARMEN	SANNA	Av Proceres de Huandoy Mz TT2 Lt 7	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.302475	2025-10-05 03:38:53.302475
79	2	\N	07:00:00	13:00:00	MAÑANA	MAD	70	ALFARO ZOLA GIAN CARLO MAURICIO	SANNA	Jr Garcia y Garcia 514	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.304809	2025-10-05 03:38:53.304809
80	2	\N	07:00:00	14:00:00	MAÑANA	MAD	49	DE LA FUENTE CHAVEZ LUNA DINO ALEJANDRO	SANNA	Calle Doña Delmira 280 Dpto. 401	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.30711	2025-10-05 03:38:53.30711
81	2	\N	07:00:00	13:00:00	MAÑANA	MAD	32	GORDILLO SANCHEZ MIGUEL ALFONSO II	SANNA	Calle Monet 179 Dpto. 302	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.309063	2025-10-05 03:38:53.309063
82	2	\N	07:00:00	15:00:00	MAÑANA	MAD	33	JACOBI TORRES CLAUDIO OMAR	SANNA	Claude Monteverdi 153 Dpto. 104	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.310891	2025-10-05 03:38:53.310891
83	2	\N	07:00:00	15:00:00	MAÑANA	MAD	50	LESCANO SALAS ROBERTO JUSTO	SANNA	Batallón Concepción 153 Urb. Santa Teresa	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.312917	2025-10-05 03:38:53.312917
84	2	\N	07:00:00	14:00:00	MAÑANA	MAD	51	MENENDEZ AMES JAIME LUIS	SANNA	Calle Rio Urubamba 194 Dpto. 101	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.314715	2025-10-05 03:38:53.314715
85	2	\N	07:00:00	14:00:00	MAÑANA	MAD	52	QUINTERO MOLINA MATIAS	SANNA	Calle Matarani 204	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.316543	2025-10-05 03:38:53.316543
86	2	\N	07:00:00	14:00:00	MAÑANA	MAD	55	VILLARREAL VARGAS BORIS JAVIER	SANNA	Calle Los Chimús 285 Dpto. 403 Urb. Maranga	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.318123	2025-10-05 03:38:53.318123
87	2	\N	08:00:00	14:00:00	MAÑANA	SM	38	NAVARRO PARRA CARLOS ERNESTO	SANNA	Jr Miguel Aljovín 222	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.319917	2025-10-05 03:38:53.319917
88	2	\N	07:00:00	14:00:00	MAÑANA	SM	71	REYES PEREZ HECBRIG ISABEL	SANNA	Jr camino real 315	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.321669	2025-10-05 03:38:53.321669
89	2	\N	07:00:00	14:00:00	MAÑANA	SM	58	ROMERO ALEJO YESI CAROLINA	SANNA	Provivienda San Antonio Mz B Lt 29	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.32343	2025-10-05 03:38:53.32343
90	2	\N	08:00:00	15:00:00	MAÑANA	MAD	72	ALEJOS CARRION REYNALDO MARTIN	SANNA	Jr Los Sauces 271 Piso 4 Urb. Jardines de Virú	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.325436	2025-10-05 03:38:53.325436
91	2	\N	07:00:00	14:00:00	MAÑANA	MAD	48	ESPINOZA MEDRANO VERONICA	SANNA	Jr Estados Unidos 1278	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.327061	2025-10-05 03:38:53.327061
92	2	\N	07:00:00	13:00:00	MAÑANA	MAD	73	GARCIA TEJADA JOSE ENRIQUE	SANNA	Vasco de Gama Mz G Lt 23 Santa Patricia 3era. Etapa 	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.328053	2025-10-05 03:38:53.328053
93	2	\N	08:00:00	15:00:00	MAÑANA	MAD	61	SARMIENTO TORO MAHILLOGIRIS JOSEFINA	SANNA	Av. Brasil 1458 Dpto. 602B	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.329322	2025-10-05 03:38:53.329322
94	2	\N	07:00:00	14:00:00	MAÑANA	MAD	74	TORRES MENDEZ DE RIVERA MARIA DEL PILAR	SANNA	Urb. San Diego Mz.D Lote 39	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.330587	2025-10-05 03:38:53.330587
95	2	\N	07:00:00	14:00:00	MAÑANA	MAD	62	ULLOQUE HUAYANCA JOHANN ALBERTO	SANNA	Calle Hualgayoc 192 Urb Cahuache	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.331617	2025-10-05 03:38:53.331617
96	2	\N	07:00:00	13:00:00	MAÑANA	SM	44	SOTO AVILA YOMAIRA DEL CARMEN	SANNA	Jr Francisco de Cuellar 500 Dpto. 112	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.332566	2025-10-05 03:38:53.332566
97	2	\N	15:00:00	21:00:00	TARDE	MAD	64	LUNA CONTRERAS LUIS ENRIQUE	SANNA	Av Tizon y Bueno 170 Dpto. 315	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.333594	2025-10-05 03:38:53.333594
98	2	\N	15:00:00	22:00:00	TARDE	MAD	75	PIQUE LANDEO RICARDO	SANNA	Calle Augusto Rodin 140	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.334576	2025-10-05 03:38:53.334576
99	2	\N	15:00:00	22:00:00	TARDE	MAD	76	VILLACORTA SANCHEZ LAURA ISABEL	SANNA	Calle Augusto Rodin 140	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.335726	2025-10-05 03:38:53.335726
100	2	\N	15:00:00	22:00:00	TARDE	MAD	55	VILLARREAL VARGAS BORIS JAVIER	SANNA	Calle Los Chimús 285 Dpto. 403 Urb. Maranga	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.336794	2025-10-05 03:38:53.336794
101	2	\N	15:00:00	22:00:00	TARDE	SM	57	MORA RODRIGUEZ JOSE ALBERTO	SANNA	Calle Los Gorriones 279 Edificio New York Dpto. 202	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.337823	2025-10-05 03:38:53.337823
102	2	\N	15:00:00	22:00:00	TARDE	SM	38	NAVARRO PARRA CARLOS ERNESTO	SANNA	Av Guardia Peruana 205 Piso 1	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.338906	2025-10-05 03:38:53.338906
103	2	\N	15:00:00	22:00:00	TARDE	SM	71	REYES PEREZ HECBRIG ISABEL	SANNA	Jr camino real 315	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.339912	2025-10-05 03:38:53.339912
104	2	\N	15:00:00	22:00:00	TARDE	SM	58	ROMERO ALEJO YESI CAROLINA	SANNA	Provivienda San Antonio Mz B Lt 29	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.340922	2025-10-05 03:38:53.340922
105	2	\N	15:00:00	22:00:00	TARDE	MAD	77	ALVARADO LEON BIANCA MIREYA	SANNA	Av Talara 636 Dpto. 301	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.341961	2025-10-05 03:38:53.341961
106	2	\N	15:00:00	22:00:00	TARDE	MAD	48	ESPINOZA MEDRANO VERONICA	SANNA	Jr Estados Unidos 1278	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.342969	2025-10-05 03:38:53.342969
107	2	\N	17:30:00	22:30:00	TARDE	MAD	68	MEDINA SANCHEZ FLOR AZUCENA	SANNA	SABADO Cueto 120	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.344079	2025-10-05 03:38:53.344079
108	2	\N	15:00:00	22:00:00	TARDE	MAD	78	TICONA TAPIA V. EDUARDO	SANNA	Jr Vinzos 222 Urb. Bata La Perla	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.345103	2025-10-05 03:38:53.345103
109	2	\N	15:00:00	21:00:00	TARDE	MAD	74	TORRES MENDEZ DE RIVERA MARIA DEL PILAR	SANNA	Urb. San Diego Mz.D Lote 39	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.346192	2025-10-05 03:38:53.346192
110	2	\N	15:00:00	22:00:00	TARDE	MAD	62	ULLOQUE HUAYANCA JOHANN ALBERTO	SANNA	Calle Hualgayoc 192 Urb Cahuache	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.347234	2025-10-05 03:38:53.347234
111	2	\N	14:00:00	21:00:00	TARDE	SM	44	SOTO AVILA YOMAIRA DEL CARMEN	SANNA	Jr Francisco de Cuellar 500 Dpto. 112	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.348239	2025-10-05 03:38:53.348239
112	2	\N	07:00:00	14:00:00	MAÑANA	MAD	49	DE LA FUENTE CHAVEZ LUNA DINO ALEJANDRO	SANNA	Calle Doña Delmira 280 Dpto. 401	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.34918	2025-10-05 03:38:53.34918
113	2	\N	07:00:00	15:00:00	MAÑANA	MAD	33	JACOBI TORRES CLAUDIO OMAR	SANNA	Claude Monteverdi 153 Dpto. 104	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.35012	2025-10-05 03:38:53.35012
114	2	\N	07:00:00	13:00:00	MAÑANA	MAD	34	LARA PAREDES ANDREA MERCEDES	SANNA	Jr Mateo Pumacahua 1616	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.351105	2025-10-05 03:38:53.351105
115	2	\N	07:00:00	14:00:00	MAÑANA	MAD	51	MENENDEZ AMES JAIME LUIS	SANNA	Calle Rio Urubamba 194 Dpto. 101	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.352079	2025-10-05 03:38:53.352079
116	2	\N	07:00:00	14:00:00	MAÑANA	MAD	79	POMACONDOR IRAITA ERICK DAVID	SANNA	Av. 28 de Julio 154 Dpto. 203	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.353101	2025-10-05 03:38:53.353101
117	2	\N	07:00:00	14:00:00	MAÑANA	MAD	53	SEMINARIO VITTORIA ALESSIA	SANNA	Jr Jacarandá 370 Dpto. 202	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.354058	2025-10-05 03:38:53.354058
118	2	\N	07:00:00	13:00:00	MAÑANA	MAD	54	TORRES SANTOS JUAN EDUARDO	SANNA	Parque Almagro 112	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.355009	2025-10-05 03:38:53.355009
119	2	\N	07:00:00	15:00:00	MAÑANA	MAD	55	VILLARREAL VARGAS BORIS JAVIER	SANNA	Rosa Toledo 224	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.356043	2025-10-05 03:38:53.356043
120	2	\N	07:00:00	14:00:00	MAÑANA	MAD	80	YUPANQUI ATENCIO ANTONELLA BETZABETH	SANNA	Jr Las Gravas 1871	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.357074	2025-10-05 03:38:53.357074
121	2	\N	07:00:00	14:00:00	MAÑANA	SM	56	COLINA BORGES YORYI JESUS	SANNA	Av Alameda sur Mz F Lt 3, Asociación Bello Horizonte	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.358056	2025-10-05 03:38:53.358056
122	2	\N	07:00:00	14:00:00	MAÑANA	SM	57	MORA RODRIGUEZ JOSE ALBERTO	SANNA	Calle Los Gorriones 279 Edificio New York Dpto. 202	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.359001	2025-10-05 03:38:53.359001
123	2	\N	07:00:00	14:00:00	MAÑANA	MAD	77	ALVARADO LEON BIANCA MIREYA	SANNA	Av Talara 636 Dpto. 301	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.359981	2025-10-05 03:38:53.359981
124	2	\N	08:00:00	14:00:00	MAÑANA	MAD	42	QUENAYA RIVA CARLOS ENRIQUE	SANNA	Hospital Emergencias Grau	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.361066	2025-10-05 03:38:53.361066
125	2	\N	08:00:00	15:00:00	MAÑANA	MAD	61	SARMIENTO TORO MAHILLOGIRIS JOSEFINA	SANNA	Av. Brasil 1458 Dpto. 602B	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.36201	2025-10-05 03:38:53.36201
126	2	\N	07:00:00	14:00:00	MAÑANA	MAD	81	TIZON PEÑA KATTERINE ROSSE	SANNA	Calle Santa María MZD Lt 12 Dpto3 Laderas de la Molina	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.363066	2025-10-05 03:38:53.363066
127	2	\N	07:00:00	14:00:00	MAÑANA	MAD	74	TORRES MENDEZ DE RIVERA MARIA DEL PILAR	SANNA	Urb. San Diego Mz.D Lote 39	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.36417	2025-10-05 03:38:53.36417
128	2	\N	07:00:00	14:00:00	MAÑANA	SM	16	GUTIERREZ MUÑOZ ZOILA CAROLINA	SANNA	Jr José Gabriel Aguilar 137 Urb. Maranga 2da. Etapa	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.365229	2025-10-05 03:38:53.365229
129	2	\N	07:00:00	13:00:00	MAÑANA	SM	44	SOTO AVILA YOMAIRA DEL CARMEN	SANNA	Jr Francisco de Cuellar 500 Dpto. 112	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.366183	2025-10-05 03:38:53.366183
130	2	\N	15:00:00	22:00:00	TARDE	MAD	45	GOYZUETA SEGURA CLIDY AMELIA	SANNA	Calle Centauro F11 Urb. Los Granados	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.367301	2025-10-05 03:38:53.367301
131	2	\N	15:00:00	21:00:00	TARDE	MAD	64	LUNA CONTRERAS LUIS ENRIQUE	SANNA	Av Tizon y Bueno 170 Dpto. 315	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.368327	2025-10-05 03:38:53.368327
132	2	\N	15:00:00	22:00:00	TARDE	MAD	79	POMACONDOR IRAITA ERICK DAVID	SANNA	Av. 28 de Julio 154 Dpto. 203	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.369491	2025-10-05 03:38:53.369491
133	2	\N	15:00:00	22:00:00	TARDE	MAD	36	VELARDE CARBAJAL EDWIN RAMIRO	SANNA	Av General Cordova 515 Dpto. 602	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.37068	2025-10-05 03:38:53.37068
134	2	\N	16:30:00	22:00:00	TARDE	MAD	55	VILLARREAL VARGAS BORIS JAVIER	SANNA	Calle Los Chimús 285 Dpto. 403 Urb. Maranga	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.371834	2025-10-05 03:38:53.371834
135	2	\N	15:00:00	22:00:00	TARDE	MAD	80	YUPANQUI ATENCIO ANTONELLA BETZABETH	SANNA	Jr Las Gravas 1871	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.372968	2025-10-05 03:38:53.372968
136	2	\N	15:00:00	22:00:00	TARDE	SM	65	GONZALEZ GONZALEZ ALBERTO ANTONIO	SANNA	Jr Madrileña 192 Dpto. 607 Urb. Villa Jardin	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.374086	2025-10-05 03:38:53.374086
137	2	\N	15:00:00	22:00:00	TARDE	SM	57	MORA RODRIGUEZ JOSE ALBERTO	SANNA	Calle Los Gorriones 279 Edificio New York Dpto. 202	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.375475	2025-10-05 03:38:53.375475
138	2	\N	15:00:00	22:00:00	TARDE	MAD	72	ALEJOS CARRION REYNALDO MARTIN	SANNA	Jr Los Sauces 271 Piso 4 Urb. Jardines de Virú	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.376739	2025-10-05 03:38:53.376739
139	2	\N	15:00:00	22:00:00	TARDE	MAD	77	ALVARADO LEON BIANCA MIREYA	SANNA	Av Talara 636 Dpto. 301	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.377868	2025-10-05 03:38:53.377868
140	2	\N	15:00:00	22:00:00	TARDE	MAD	67	DIAZ TORO SILVIA CRISTINA	SANNA	Av Arequipa 2655 Dpto. 902	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.379037	2025-10-05 03:38:53.379037
141	2	\N	17:30:00	22:30:00	TARDE	MAD	68	MEDINA SANCHEZ FLOR AZUCENA	SANNA	SABADO Cueto 120	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.380233	2025-10-05 03:38:53.380233
142	2	\N	15:00:00	21:00:00	TARDE	MAD	74	TORRES MENDEZ DE RIVERA MARIA DEL PILAR	SANNA	Urb. San Diego Mz.D Lote 39	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.381469	2025-10-05 03:38:53.381469
143	2	\N	14:00:00	22:00:00	TARDE	MAD	82	VERA BORJA DANY ROXANA	SANNA	Jr Lino Mendoza Bedoya 302 (punto de recojo - referencial)	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.3826	2025-10-05 03:38:53.3826
190	2	\N	15:00:00	22:00:00	TARDE	MAD	76	VILLACORTA SANCHEZ LAURA ISABEL	SANNA	Calle Augusto Rodin 140	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.440662	2025-10-05 03:38:53.440662
144	2	\N	15:00:00	22:00:00	TARDE	SM	16	GUTIERREZ MUÑOZ ZOILA CAROLINA	SANNA	Jr José Gabriel Aguilar 137 Urb. Maranga 2da. Etapa	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.383743	2025-10-05 03:38:53.383743
145	2	\N	14:00:00	21:00:00	TARDE	SM	44	SOTO AVILA YOMAIRA DEL CARMEN	SANNA	Jr Francisco de Cuellar 500 Dpto. 112	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.384982	2025-10-05 03:38:53.384982
146	2	\N	07:00:00	13:00:00	MAÑANA	MAD	70	ALFARO ZOLA GIAN CARLO MAURICIO	SANNA	Jr Garcia y Garcia 514	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.386175	2025-10-05 03:38:53.386175
147	2	\N	07:00:00	14:00:00	MAÑANA	MAD	49	DE LA FUENTE CHAVEZ LUNA DINO ALEJANDRO	SANNA	Calle Doña Delmira 280 Dpto. 401	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.387632	2025-10-05 03:38:53.387632
148	2	\N	07:00:00	15:00:00	MAÑANA	MAD	33	JACOBI TORRES CLAUDIO OMAR	SANNA	Claude Monteverdi 153 Dpto. 104	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.389017	2025-10-05 03:38:53.389017
149	2	\N	07:00:00	14:00:00	MAÑANA	MAD	75	PIQUE LANDEO RICARDO	SANNA	Calle Augusto Rodin 140	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.390119	2025-10-05 03:38:53.390119
150	2	\N	07:00:00	13:00:00	MAÑANA	MAD	54	TORRES SANTOS JUAN EDUARDO	SANNA	Parque Almagro 112	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.391163	2025-10-05 03:38:53.391163
151	2	\N	07:00:00	15:00:00	MAÑANA	MAD	55	VILLARREAL VARGAS BORIS JAVIER	SANNA	Rosa Toledo 224	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.392362	2025-10-05 03:38:53.392362
152	2	\N	07:00:00	14:00:00	MAÑANA	SM	56	COLINA BORGES YORYI JESUS	SANNA	Av Alameda sur Mz F Lt 3, Asociación Bello Horizonte	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.393596	2025-10-05 03:38:53.393596
153	2	\N	07:00:00	14:00:00	MAÑANA	SM	37	FLORES DARWIN ALBERTO	SANNA	Jr Las Grosellas 970 Urb. Las Flores	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.394803	2025-10-05 03:38:53.394803
154	2	\N	07:00:00	14:00:00	MAÑANA	SM	38	NAVARRO PARRA CARLOS ERNESTO	SANNA	Av Guardia Peruana 205 Piso 1	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.395991	2025-10-05 03:38:53.395991
155	2	\N	07:00:00	14:00:00	MAÑANA	MAD	48	ESPINOZA MEDRANO VERONICA	SANNA	Jr Estados Unidos 1278	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.397233	2025-10-05 03:38:53.397233
156	2	\N	09:00:00	15:00:00	MAÑANA	MAD	59	FLORES SANTILLAN CRISTHIAN	SANNA	Calle Octavio Paz 285 Dpto. 301  Urb. La Calera de La Merced	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.398456	2025-10-05 03:38:53.398456
157	2	\N	07:00:00	14:00:00	MAÑANA	MAD	40	INFANTES MONTOYA ROGER O.	SANNA	Sor Mate N° 261	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.399586	2025-10-05 03:38:53.399586
158	2	\N	07:00:00	14:00:00	MAÑANA	MAD	74	TORRES MENDEZ DE RIVERA MARIA DEL PILAR	SANNA	Urb. San Diego Mz.D Lote 39	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.400785	2025-10-05 03:38:53.400785
159	2	\N	07:00:00	14:00:00	MAÑANA	MAD	62	ULLOQUE HUAYANCA JOHANN ALBERTO	SANNA	Calle Hualgayoc 192 Urb Cahuache	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.401932	2025-10-05 03:38:53.401932
160	2	\N	07:00:00	14:00:00	MAÑANA	SM	16	GUTIERREZ MUÑOZ ZOILA CAROLINA	SANNA	Jr José Gabriel Aguilar 137 Urb. Maranga 2da. Etapa	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.403158	2025-10-05 03:38:53.403158
161	2	\N	15:00:00	22:00:00	TARDE	MAD	75	PIQUE LANDEO RICARDO	SANNA	Calle Augusto Rodin 140	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.404765	2025-10-05 03:38:53.404765
162	2	\N	15:00:00	22:00:00	TARDE	MAD	83	SARMIENTO AMAO CARLOS ANTONIO	SANNA	Av San Felipe 530 Dpto 1601 Torre I  	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.40596	2025-10-05 03:38:53.40596
163	2	\N	16:30:00	22:00:00	TARDE	MAD	55	VILLARREAL VARGAS BORIS JAVIER	SANNA	Calle Los Chimús 285 Dpto. 403 Urb. Maranga	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.407207	2025-10-05 03:38:53.407207
164	2	\N	15:00:00	22:00:00	TARDE	SM	37	FLORES DARWIN ALBERTO	SANNA	Jr Las Grosellas 970 Urb. Las Flores	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.408458	2025-10-05 03:38:53.408458
165	2	\N	15:00:00	22:00:00	TARDE	SM	38	NAVARRO PARRA CARLOS ERNESTO	SANNA	Av Guardia Peruana 205 Piso 1	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.409677	2025-10-05 03:38:53.409677
166	2	\N	15:00:00	22:00:00	TARDE	SM	84	NOGUERA GARCIA MARIANGELA	SANNA	Carlos Gil 541 Dpto. 201	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.410836	2025-10-05 03:38:53.410836
167	2	\N	15:00:00	21:00:00	TARDE	MAD	85	AMADO SKOVER EDUARDO AURELIO	SANNA	Calle 24 N° 310 Dpto. 303	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.411829	2025-10-05 03:38:53.411829
168	2	\N	15:00:00	22:00:00	TARDE	MAD	67	DIAZ TORO SILVIA CRISTINA	SANNA	Av Arequipa 2655 Dpto. 902	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.412921	2025-10-05 03:38:53.412921
169	2	\N	15:00:00	22:00:00	TARDE	MAD	48	ESPINOZA MEDRANO VERONICA	SANNA	Jr Estados Unidos 1278	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.413961	2025-10-05 03:38:53.413961
170	2	\N	15:00:00	22:00:00	TARDE	MAD	81	TIZON PEÑA KATTERINE ROSSE	SANNA	Calle Santa María MZD Lt 12 Dpto3 Laderas de la Molina	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.414937	2025-10-05 03:38:53.414937
171	2	\N	15:00:00	21:00:00	TARDE	MAD	74	TORRES MENDEZ DE RIVERA MARIA DEL PILAR	SANNA	Urb. San Diego Mz.D Lote 39	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.415939	2025-10-05 03:38:53.415939
172	2	\N	15:00:00	22:00:00	TARDE	SM	16	GUTIERREZ MUÑOZ ZOILA CAROLINA	SANNA	Jr José Gabriel Aguilar 137 Urb. Maranga 2da. Etapa	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.416974	2025-10-05 03:38:53.416974
173	2	\N	07:00:00	14:00:00	MAÑANA	MAD	49	DE LA FUENTE CHAVEZ LUNA DINO ALEJANDRO	SANNA	Calle Doña Delmira 280 Dpto. 401	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.418045	2025-10-05 03:38:53.418045
174	2	\N	07:00:00	15:00:00	MAÑANA	MAD	50	LESCANO SALAS ROBERTO JUSTO	SANNA	Batallón Concepción 153 Urb. Santa Teresa	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.419148	2025-10-05 03:38:53.419148
175	2	\N	07:00:00	14:00:00	MAÑANA	MAD	79	POMACONDOR IRAITA ERICK DAVID	SANNA	Av. 28 de Julio 154 Dpto. 203	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.420236	2025-10-05 03:38:53.420236
176	2	\N	07:00:00	14:00:00	MAÑANA	MAD	52	QUINTERO MOLINA MATIAS	SANNA	Calle Matarani 204	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.421306	2025-10-05 03:38:53.421306
177	2	\N	07:00:00	14:00:00	MAÑANA	MAD	76	VILLACORTA SANCHEZ LAURA ISABEL	SANNA	Calle Augusto Rodin 140	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.422352	2025-10-05 03:38:53.422352
178	2	\N	07:00:00	15:00:00	MAÑANA	MAD	55	VILLARREAL VARGAS BORIS JAVIER	SANNA	Rosa Toledo 224	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.423414	2025-10-05 03:38:53.423414
179	2	\N	07:00:00	14:00:00	MAÑANA	MAD	80	YUPANQUI ATENCIO ANTONELLA BETZABETH	SANNA	Jr Las Gravas 1871	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.424558	2025-10-05 03:38:53.424558
180	2	\N	07:00:00	14:00:00	MAÑANA	SM	56	COLINA BORGES YORYI JESUS	SANNA	Av Alameda sur Mz F Lt 3, Asociación Bello Horizonte	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.426759	2025-10-05 03:38:53.426759
181	2	\N	07:00:00	14:00:00	MAÑANA	SM	57	MORA RODRIGUEZ JOSE ALBERTO	SANNA	Calle Los Gorriones 279 Edificio New York Dpto. 202	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.427973	2025-10-05 03:38:53.427973
182	2	\N	07:00:00	14:00:00	MAÑANA	MAD	40	INFANTES MONTOYA ROGER O.	SANNA	Sor Mate N° 261	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.42925	2025-10-05 03:38:53.42925
183	2	\N	08:00:00	14:00:00	MAÑANA	MAD	42	QUENAYA RIVA CARLOS ENRIQUE	SANNA	Calle Armando Zamudio 148 San Roque	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.430576	2025-10-05 03:38:53.430576
184	2	\N	07:00:00	14:00:00	MAÑANA	MAD	74	TORRES MENDEZ DE RIVERA MARIA DEL PILAR	SANNA	Urb. San Diego Mz.D Lote 39	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.431762	2025-10-05 03:38:53.431762
185	2	\N	07:00:00	14:00:00	MAÑANA	MAD	62	ULLOQUE HUAYANCA JOHANN ALBERTO	SANNA	Calle Hualgayoc 192 Urb Cahuache	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.432821	2025-10-05 03:38:53.432821
186	2	\N	07:00:00	14:00:00	MAÑANA	SM	16	GUTIERREZ MUÑOZ ZOILA CAROLINA	SANNA	Jr José Gabriel Aguilar 137 Urb. Maranga 2da. Etapa	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.434122	2025-10-05 03:38:53.434122
187	2	\N	14:00:00	22:00:00	TARDE	MAD	70	ALFARO ZOLA GIAN CARLO MAURICIO	SANNA	Policlinico Pablo Bermudez	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.435422	2025-10-05 03:38:53.435422
188	2	\N	16:00:00	22:00:00	TARDE	MAD	63	LINARES PIZARRO ROBERTO CARLOS	SANNA	Av Costanera 2810	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.43656	2025-10-05 03:38:53.43656
189	2	\N	15:00:00	22:00:00	TARDE	MAD	79	POMACONDOR IRAITA ERICK DAVID	SANNA	Av. 28 de Julio 154 Dpto. 203	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.437732	2025-10-05 03:38:53.437732
191	2	\N	15:00:00	22:00:00	TARDE	MAD	80	YUPANQUI ATENCIO ANTONELLA BETZABETH	SANNA	Jr Las Gravas 1871	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.441844	2025-10-05 03:38:53.441844
192	2	\N	15:00:00	22:00:00	TARDE	SM	65	GONZALEZ GONZALEZ ALBERTO ANTONIO	SANNA	Jr Madrileña 192 Dpto. 607 Urb. Villa Jardin	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.442918	2025-10-05 03:38:53.442918
193	2	\N	15:00:00	22:00:00	TARDE	SM	57	MORA RODRIGUEZ JOSE ALBERTO	SANNA	Calle Los Gorriones 279 Edificio New York Dpto. 202	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.443951	2025-10-05 03:38:53.443951
194	2	\N	14:00:00	21:00:00	TARDE	MAD	72	ALEJOS CARRION REYNALDO MARTIN	SANNA	Jr Los Sauces 271 Piso 4 Urb. Jardines de Virú	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.445086	2025-10-05 03:38:53.445086
195	2	\N	15:00:00	22:00:00	TARDE	MAD	77	ALVARADO LEON BIANCA MIREYA	SANNA	Av Talara 636 Dpto. 301	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.446321	2025-10-05 03:38:53.446321
196	2	\N	17:30:00	22:30:00	TARDE	MAD	68	MEDINA SANCHEZ FLOR AZUCENA	SANNA	SABADO Cueto 120	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.44746	2025-10-05 03:38:53.44746
197	2	\N	15:00:00	22:00:00	TARDE	MAD	42	QUENAYA RIVA CARLOS ENRIQUE	SANNA	Calle Armando Zamudio 148 San Roque	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.448585	2025-10-05 03:38:53.448585
198	2	\N	15:00:00	22:00:00	TARDE	MAD	62	ULLOQUE HUAYANCA JOHANN ALBERTO	SANNA	Calle Hualgayoc 192 Urb Cahuache	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.449697	2025-10-05 03:38:53.449697
199	2	\N	15:00:00	22:00:00	TARDE	SM	16	GUTIERREZ MUÑOZ ZOILA CAROLINA	SANNA	Jr José Gabriel Aguilar 137 Urb. Maranga 2da. Etapa	\N	\N	\N	PENDIENTE	\N	2025-10-05 03:38:53.450781	2025-10-05 03:38:53.450781
\.


--
-- Data for Name: tipos_servicio; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tipos_servicio (id, codigo, nombre, descripcion, activo, created_at) FROM stdin;
1	MAD	MAD - Médico a Domicilio	Servicio médico a domicilio	t	2025-10-03 05:08:46.935097
2	TAD	TAD - Traslado Asistido	Traslado con asistencia médica	t	2025-10-03 05:08:46.935097
3	MAD-SANNA	MAD-SANNA	Médico a domicilio para SANNA	t	2025-10-03 05:08:46.935097
4	MAD-CI	MAD-CI	Médico a domicilio para Clínico Internacional	t	2025-10-03 05:08:46.935097
5	EKG	EKG	Electrocardiograma	t	2025-10-03 23:16:25.565078
6	RETEN	RETEN	Retén médico	t	2025-10-03 23:16:25.565078
7	RDM	RDM	Revisión de medicina	t	2025-10-03 23:16:25.565078
8	LIBRE	LIBRE	Servicio libre	t	2025-10-03 23:16:25.565078
9	DESCANSO	DESCANSO	Día de descanso	t	2025-10-03 23:16:25.565078
\.


--
-- Data for Name: ubicaciones_conductor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ubicaciones_conductor (id, "conductorId", latitud, longitud, "precision", altitud, velocidad, rumbo, "timestamp", fuente, bateria, "enServicio", "servicioId", "distanciaRecorrida") FROM stdin;
\.


--
-- Name: areas_servicio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.areas_servicio_id_seq', 18, true);


--
-- Name: calificaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.calificaciones_id_seq', 6, true);


--
-- Name: clientes_especiales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clientes_especiales_id_seq', 10, true);


--
-- Name: clinica_especialidades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clinica_especialidades_id_seq', 1, false);


--
-- Name: clinicas_hospitales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clinicas_hospitales_id_seq', 21, true);


--
-- Name: clinicas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zuri
--

SELECT pg_catalog.setval('public.clinicas_id_seq', 1, false);


--
-- Name: cobertura_turnos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cobertura_turnos_id_seq', 4, true);


--
-- Name: conductores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: zuri
--

SELECT pg_catalog.setval('public.conductores_id_seq', 10, true);


--
-- Name: distritos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: prisma_user
--

SELECT pg_catalog.setval('public.distritos_id_seq', 39, true);


--
-- Name: doctor_clinicas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctor_clinicas_id_seq', 1, false);


--
-- Name: doctor_especialidades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctor_especialidades_id_seq', 1, false);


--
-- Name: doctores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctores_id_seq', 86, true);


--
-- Name: especialidades_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.especialidades_id_seq', 61, true);


--
-- Name: importaciones_excel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.importaciones_excel_id_seq', 3, true);


--
-- Name: importaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.importaciones_id_seq', 3, true);


--
-- Name: motivos_no_disponibilidad_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.motivos_no_disponibilidad_id_seq', 6, true);


--
-- Name: pacientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pacientes_id_seq', 1, true);


--
-- Name: programacion_detalles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.programacion_detalles_id_seq', 17, true);


--
-- Name: programaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.programaciones_id_seq', 2, true);


--
-- Name: seq_codigo_importacion; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.seq_codigo_importacion', 2, true);


--
-- Name: seq_codigo_programacion; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.seq_codigo_programacion', 2, true);


--
-- Name: seq_codigo_zuri; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.seq_codigo_zuri', 7, true);


--
-- Name: servicios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.servicios_id_seq', 1, false);


--
-- Name: solicitudes_servicios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.solicitudes_servicios_id_seq', 377, true);


--
-- Name: tipos_servicio_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tipos_servicio_id_seq', 14, true);


--
-- Name: ubicaciones_conductor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ubicaciones_conductor_id_seq', 1, false);


--
-- Name: areas_servicio areas_servicio_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areas_servicio
    ADD CONSTRAINT areas_servicio_codigo_key UNIQUE (codigo);


--
-- Name: areas_servicio areas_servicio_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.areas_servicio
    ADD CONSTRAINT areas_servicio_pkey PRIMARY KEY (id);


--
-- Name: calificaciones calificaciones_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calificaciones
    ADD CONSTRAINT calificaciones_codigo_key UNIQUE (codigo);


--
-- Name: calificaciones calificaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calificaciones
    ADD CONSTRAINT calificaciones_pkey PRIMARY KEY (id);


--
-- Name: clientes_especiales clientes_especiales_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes_especiales
    ADD CONSTRAINT clientes_especiales_codigo_key UNIQUE (codigo);


--
-- Name: clientes_especiales clientes_especiales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes_especiales
    ADD CONSTRAINT clientes_especiales_pkey PRIMARY KEY (id);


--
-- Name: clinica_especialidades clinica_especialidades_clinica_id_especialidad_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinica_especialidades
    ADD CONSTRAINT clinica_especialidades_clinica_id_especialidad_id_key UNIQUE (clinica_id, especialidad_id);


--
-- Name: clinica_especialidades clinica_especialidades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinica_especialidades
    ADD CONSTRAINT clinica_especialidades_pkey PRIMARY KEY (id);


--
-- Name: clinicas_hospitales clinicas_hospitales_codigo_renaes_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas_hospitales
    ADD CONSTRAINT clinicas_hospitales_codigo_renaes_key UNIQUE (codigo_renaes);


--
-- Name: clinicas_hospitales clinicas_hospitales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas_hospitales
    ADD CONSTRAINT clinicas_hospitales_pkey PRIMARY KEY (id);


--
-- Name: clinicas clinicas_pkey; Type: CONSTRAINT; Schema: public; Owner: zuri
--

ALTER TABLE ONLY public.clinicas
    ADD CONSTRAINT clinicas_pkey PRIMARY KEY (id);


--
-- Name: cobertura_turnos cobertura_turnos_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cobertura_turnos
    ADD CONSTRAINT cobertura_turnos_codigo_key UNIQUE (codigo);


--
-- Name: cobertura_turnos cobertura_turnos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cobertura_turnos
    ADD CONSTRAINT cobertura_turnos_pkey PRIMARY KEY (id);


--
-- Name: conductores conductores_pkey; Type: CONSTRAINT; Schema: public; Owner: zuri
--

ALTER TABLE ONLY public.conductores
    ADD CONSTRAINT conductores_pkey PRIMARY KEY (id);


--
-- Name: distritos distritos_pkey; Type: CONSTRAINT; Schema: public; Owner: prisma_user
--

ALTER TABLE ONLY public.distritos
    ADD CONSTRAINT distritos_pkey PRIMARY KEY (id);


--
-- Name: doctor_clinicas doctor_clinicas_doctor_id_clinica_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_clinicas
    ADD CONSTRAINT doctor_clinicas_doctor_id_clinica_id_key UNIQUE (doctor_id, clinica_id);


--
-- Name: doctor_clinicas doctor_clinicas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_clinicas
    ADD CONSTRAINT doctor_clinicas_pkey PRIMARY KEY (id);


--
-- Name: doctor_especialidades doctor_especialidades_doctor_id_especialidad_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_especialidades
    ADD CONSTRAINT doctor_especialidades_doctor_id_especialidad_id_key UNIQUE (doctor_id, especialidad_id);


--
-- Name: doctor_especialidades doctor_especialidades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_especialidades
    ADD CONSTRAINT doctor_especialidades_pkey PRIMARY KEY (id);


--
-- Name: doctores doctores_cmp_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctores
    ADD CONSTRAINT doctores_cmp_key UNIQUE (cmp);


--
-- Name: doctores doctores_dni_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctores
    ADD CONSTRAINT doctores_dni_key UNIQUE (dni);


--
-- Name: doctores doctores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctores
    ADD CONSTRAINT doctores_pkey PRIMARY KEY (id);


--
-- Name: especialidades especialidades_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades
    ADD CONSTRAINT especialidades_nombre_key UNIQUE (nombre);


--
-- Name: especialidades especialidades_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades
    ADD CONSTRAINT especialidades_pkey PRIMARY KEY (id);


--
-- Name: importaciones_excel importaciones_excel_codigo_zuri_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.importaciones_excel
    ADD CONSTRAINT importaciones_excel_codigo_zuri_key UNIQUE (codigo_zuri);


--
-- Name: importaciones_excel importaciones_excel_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.importaciones_excel
    ADD CONSTRAINT importaciones_excel_pkey PRIMARY KEY (id);


--
-- Name: importaciones importaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.importaciones
    ADD CONSTRAINT importaciones_pkey PRIMARY KEY (id);


--
-- Name: motivos_no_disponibilidad motivos_no_disponibilidad_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.motivos_no_disponibilidad
    ADD CONSTRAINT motivos_no_disponibilidad_codigo_key UNIQUE (codigo);


--
-- Name: motivos_no_disponibilidad motivos_no_disponibilidad_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.motivos_no_disponibilidad
    ADD CONSTRAINT motivos_no_disponibilidad_pkey PRIMARY KEY (id);


--
-- Name: pacientes pacientes_dni_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pacientes
    ADD CONSTRAINT pacientes_dni_key UNIQUE (dni);


--
-- Name: pacientes pacientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pacientes
    ADD CONSTRAINT pacientes_pkey PRIMARY KEY (id);


--
-- Name: programacion_detalles programacion_detalles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programacion_detalles
    ADD CONSTRAINT programacion_detalles_pkey PRIMARY KEY (id);


--
-- Name: programaciones programaciones_codigo_programacion_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programaciones
    ADD CONSTRAINT programaciones_codigo_programacion_key UNIQUE (codigo_programacion);


--
-- Name: programaciones programaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programaciones
    ADD CONSTRAINT programaciones_pkey PRIMARY KEY (id);


--
-- Name: servicios servicios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicios
    ADD CONSTRAINT servicios_pkey PRIMARY KEY (id);


--
-- Name: solicitudes_servicios solicitudes_servicios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_servicios
    ADD CONSTRAINT solicitudes_servicios_pkey PRIMARY KEY (id);


--
-- Name: tipos_servicio tipos_servicio_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_servicio
    ADD CONSTRAINT tipos_servicio_codigo_key UNIQUE (codigo);


--
-- Name: tipos_servicio tipos_servicio_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tipos_servicio
    ADD CONSTRAINT tipos_servicio_pkey PRIMARY KEY (id);


--
-- Name: ubicaciones_conductor ubicaciones_conductor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ubicaciones_conductor
    ADD CONSTRAINT ubicaciones_conductor_pkey PRIMARY KEY (id);


--
-- Name: conductores_dni_key; Type: INDEX; Schema: public; Owner: zuri
--

CREATE UNIQUE INDEX conductores_dni_key ON public.conductores USING btree (dni);


--
-- Name: distritos_nombre_key; Type: INDEX; Schema: public; Owner: prisma_user
--

CREATE UNIQUE INDEX distritos_nombre_key ON public.distritos USING btree (nombre);


--
-- Name: idx_clinicas_coordenadas; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinicas_coordenadas ON public.clinicas_hospitales USING btree (latitud, longitud);


--
-- Name: idx_clinicas_distrito; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinicas_distrito ON public.clinicas_hospitales USING btree ("distritoId");


--
-- Name: idx_clinicas_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_clinicas_estado ON public.clinicas_hospitales USING btree (estado);


--
-- Name: idx_doctores_distrito; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_doctores_distrito ON public.doctores USING btree ("distritoId");


--
-- Name: idx_doctores_dni; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_doctores_dni ON public.doctores USING btree (dni);


--
-- Name: idx_doctores_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_doctores_estado ON public.doctores USING btree (estado);


--
-- Name: idx_importaciones_codigo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_importaciones_codigo ON public.importaciones_excel USING btree (codigo_zuri);


--
-- Name: idx_importaciones_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_importaciones_created ON public.importaciones_excel USING btree (created_at);


--
-- Name: idx_importaciones_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_importaciones_estado ON public.importaciones_excel USING btree (estado);


--
-- Name: idx_importaciones_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_importaciones_fecha ON public.importaciones USING btree ("createdAt");


--
-- Name: idx_importaciones_fecha_archivo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_importaciones_fecha_archivo ON public.importaciones_excel USING btree (fecha_archivo);


--
-- Name: idx_pacientes_distrito; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pacientes_distrito ON public.pacientes USING btree ("distritoId");


--
-- Name: idx_pacientes_dni; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pacientes_dni ON public.pacientes USING btree (dni);


--
-- Name: idx_pacientes_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pacientes_estado ON public.pacientes USING btree (estado);


--
-- Name: idx_prog_detalles_area; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_prog_detalles_area ON public.programacion_detalles USING btree (area_servicio_id);


--
-- Name: idx_programacion_detalles_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_programacion_detalles_fecha ON public.programacion_detalles USING btree (fecha);


--
-- Name: idx_programacion_detalles_prog; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_programacion_detalles_prog ON public.programacion_detalles USING btree (programacion_id);


--
-- Name: idx_programaciones_cliente_esp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_programaciones_cliente_esp ON public.programaciones USING btree (cliente_especial_id);


--
-- Name: idx_programaciones_estado; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_programaciones_estado ON public.programaciones USING btree (estado);


--
-- Name: idx_programaciones_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_programaciones_fecha ON public.programaciones USING btree (fecha_programacion);


--
-- Name: idx_solicitudes_doctor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solicitudes_doctor ON public.solicitudes_servicios USING btree (doctor_id);


--
-- Name: idx_solicitudes_fecha; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solicitudes_fecha ON public.solicitudes_servicios USING btree (fecha_servicio);


--
-- Name: idx_solicitudes_importacion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_solicitudes_importacion ON public.solicitudes_servicios USING btree (importacion_id);


--
-- Name: servicios_clinicaId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "servicios_clinicaId_idx" ON public.servicios USING btree ("clinicaId");


--
-- Name: servicios_codigo_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX servicios_codigo_key ON public.servicios USING btree (codigo);


--
-- Name: servicios_conductorId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "servicios_conductorId_idx" ON public.servicios USING btree ("conductorId");


--
-- Name: servicios_estado_fechaHora_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "servicios_estado_fechaHora_idx" ON public.servicios USING btree (estado, "fechaHora");


--
-- Name: servicios_fechaHora_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "servicios_fechaHora_idx" ON public.servicios USING btree ("fechaHora");


--
-- Name: ubicaciones_conductor_conductorId_enServicio_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ubicaciones_conductor_conductorId_enServicio_idx" ON public.ubicaciones_conductor USING btree ("conductorId", "enServicio");


--
-- Name: ubicaciones_conductor_conductorId_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ubicaciones_conductor_conductorId_timestamp_idx" ON public.ubicaciones_conductor USING btree ("conductorId", "timestamp");


--
-- Name: ubicaciones_conductor_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ubicaciones_conductor_timestamp_idx ON public.ubicaciones_conductor USING btree ("timestamp");


--
-- Name: vista_programaciones_resumen _RETURN; Type: RULE; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW public.vista_programaciones_resumen AS
 SELECT p.id,
    p.codigo_programacion,
    p.fecha_programacion,
    p.cliente_nombre,
    p.estado,
    count(pd.id) AS total_servicios,
    count(
        CASE
            WHEN (pd.conductor_id IS NOT NULL) THEN 1
            ELSE NULL::integer
        END) AS servicios_asignados,
    count(
        CASE
            WHEN (pd.calificacion_id IS NOT NULL) THEN 1
            ELSE NULL::integer
        END) AS servicios_calificados,
    p.created_at
   FROM (public.programaciones p
     LEFT JOIN public.programacion_detalles pd ON ((p.id = pd.programacion_id)))
  GROUP BY p.id
  ORDER BY p.fecha_programacion DESC, p.created_at DESC;


--
-- Name: importaciones_excel trigger_importaciones_updated; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_importaciones_updated BEFORE UPDATE ON public.importaciones_excel FOR EACH ROW EXECUTE FUNCTION public.update_importaciones_timestamp();


--
-- Name: clinica_especialidades clinica_especialidades_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinica_especialidades
    ADD CONSTRAINT clinica_especialidades_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas_hospitales(id) ON DELETE CASCADE;


--
-- Name: clinica_especialidades clinica_especialidades_especialidad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinica_especialidades
    ADD CONSTRAINT clinica_especialidades_especialidad_id_fkey FOREIGN KEY (especialidad_id) REFERENCES public.especialidades(id);


--
-- Name: clinicas_hospitales clinicas_hospitales_distritoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas_hospitales
    ADD CONSTRAINT "clinicas_hospitales_distritoId_fkey" FOREIGN KEY ("distritoId") REFERENCES public.distritos(id);


--
-- Name: conductores conductores_distritoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: zuri
--

ALTER TABLE ONLY public.conductores
    ADD CONSTRAINT "conductores_distritoId_fkey" FOREIGN KEY ("distritoId") REFERENCES public.distritos(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: doctor_clinicas doctor_clinicas_clinica_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_clinicas
    ADD CONSTRAINT doctor_clinicas_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas_hospitales(id) ON DELETE CASCADE;


--
-- Name: doctor_clinicas doctor_clinicas_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_clinicas
    ADD CONSTRAINT doctor_clinicas_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctores(id) ON DELETE CASCADE;


--
-- Name: doctor_especialidades doctor_especialidades_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_especialidades
    ADD CONSTRAINT doctor_especialidades_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctores(id) ON DELETE CASCADE;


--
-- Name: doctor_especialidades doctor_especialidades_especialidad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_especialidades
    ADD CONSTRAINT doctor_especialidades_especialidad_id_fkey FOREIGN KEY (especialidad_id) REFERENCES public.especialidades(id);


--
-- Name: doctores doctores_distritoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctores
    ADD CONSTRAINT "doctores_distritoId_fkey" FOREIGN KEY ("distritoId") REFERENCES public.distritos(id);


--
-- Name: especialidades especialidades_especialidad_padre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.especialidades
    ADD CONSTRAINT especialidades_especialidad_padre_id_fkey FOREIGN KEY (especialidad_padre_id) REFERENCES public.especialidades(id);


--
-- Name: pacientes pacientes_distritoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pacientes
    ADD CONSTRAINT "pacientes_distritoId_fkey" FOREIGN KEY ("distritoId") REFERENCES public.distritos(id);


--
-- Name: programacion_detalles programacion_detalles_area_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programacion_detalles
    ADD CONSTRAINT programacion_detalles_area_servicio_id_fkey FOREIGN KEY (area_servicio_id) REFERENCES public.areas_servicio(id);


--
-- Name: programacion_detalles programacion_detalles_calificacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programacion_detalles
    ADD CONSTRAINT programacion_detalles_calificacion_id_fkey FOREIGN KEY (calificacion_id) REFERENCES public.calificaciones(id);


--
-- Name: programacion_detalles programacion_detalles_cliente_especial_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programacion_detalles
    ADD CONSTRAINT programacion_detalles_cliente_especial_id_fkey FOREIGN KEY (cliente_especial_id) REFERENCES public.clientes_especiales(id);


--
-- Name: programacion_detalles programacion_detalles_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programacion_detalles
    ADD CONSTRAINT programacion_detalles_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clinicas(id);


--
-- Name: programacion_detalles programacion_detalles_conductor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programacion_detalles
    ADD CONSTRAINT programacion_detalles_conductor_id_fkey FOREIGN KEY (conductor_id) REFERENCES public.conductores(id);


--
-- Name: programacion_detalles programacion_detalles_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programacion_detalles
    ADD CONSTRAINT programacion_detalles_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctores(id);


--
-- Name: programacion_detalles programacion_detalles_motivo_no_disponibilidad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programacion_detalles
    ADD CONSTRAINT programacion_detalles_motivo_no_disponibilidad_id_fkey FOREIGN KEY (motivo_no_disponibilidad_id) REFERENCES public.motivos_no_disponibilidad(id);


--
-- Name: programacion_detalles programacion_detalles_programacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programacion_detalles
    ADD CONSTRAINT programacion_detalles_programacion_id_fkey FOREIGN KEY (programacion_id) REFERENCES public.programaciones(id) ON DELETE CASCADE;


--
-- Name: programacion_detalles programacion_detalles_tipo_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programacion_detalles
    ADD CONSTRAINT programacion_detalles_tipo_servicio_id_fkey FOREIGN KEY (tipo_servicio_id) REFERENCES public.tipos_servicio(id);


--
-- Name: programaciones programaciones_cliente_especial_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programaciones
    ADD CONSTRAINT programaciones_cliente_especial_id_fkey FOREIGN KEY (cliente_especial_id) REFERENCES public.clientes_especiales(id);


--
-- Name: programaciones programaciones_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programaciones
    ADD CONSTRAINT programaciones_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clinicas(id);


--
-- Name: programaciones programaciones_importacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programaciones
    ADD CONSTRAINT programaciones_importacion_id_fkey FOREIGN KEY (importacion_id) REFERENCES public.importaciones_excel(id);


--
-- Name: programaciones programaciones_tipo_servicio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programaciones
    ADD CONSTRAINT programaciones_tipo_servicio_id_fkey FOREIGN KEY (tipo_servicio_id) REFERENCES public.tipos_servicio(id);


--
-- Name: servicios servicios_clinicaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicios
    ADD CONSTRAINT "servicios_clinicaId_fkey" FOREIGN KEY ("clinicaId") REFERENCES public.clinicas(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: servicios servicios_conductorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicios
    ADD CONSTRAINT "servicios_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES public.conductores(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: solicitudes_servicios solicitudes_servicios_conductor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_servicios
    ADD CONSTRAINT solicitudes_servicios_conductor_id_fkey FOREIGN KEY (conductor_id) REFERENCES public.conductores(id);


--
-- Name: solicitudes_servicios solicitudes_servicios_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_servicios
    ADD CONSTRAINT solicitudes_servicios_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctores(id);


--
-- Name: solicitudes_servicios solicitudes_servicios_importacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_servicios
    ADD CONSTRAINT solicitudes_servicios_importacion_id_fkey FOREIGN KEY (importacion_id) REFERENCES public.importaciones(id) ON DELETE CASCADE;


--
-- Name: ubicaciones_conductor ubicaciones_conductor_conductorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ubicaciones_conductor
    ADD CONSTRAINT "ubicaciones_conductor_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES public.conductores(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO zuri;


--
-- Name: FUNCTION generar_codigo_importacion(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.generar_codigo_importacion() TO zuri;


--
-- Name: FUNCTION generar_codigo_programacion(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.generar_codigo_programacion() TO zuri;


--
-- Name: FUNCTION generar_codigo_zuri(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.generar_codigo_zuri() TO zuri;


--
-- Name: FUNCTION update_importaciones_timestamp(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_importaciones_timestamp() TO zuri;


--
-- Name: TABLE areas_servicio; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.areas_servicio TO zuri;


--
-- Name: SEQUENCE areas_servicio_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.areas_servicio_id_seq TO zuri;


--
-- Name: TABLE calificaciones; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.calificaciones TO zuri;


--
-- Name: SEQUENCE calificaciones_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.calificaciones_id_seq TO zuri;


--
-- Name: TABLE clientes_especiales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.clientes_especiales TO zuri;


--
-- Name: SEQUENCE clientes_especiales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.clientes_especiales_id_seq TO zuri;


--
-- Name: TABLE clinica_especialidades; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.clinica_especialidades TO zuri;


--
-- Name: SEQUENCE clinica_especialidades_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.clinica_especialidades_id_seq TO zuri;


--
-- Name: TABLE clinicas; Type: ACL; Schema: public; Owner: zuri
--

GRANT ALL ON TABLE public.clinicas TO postgres;


--
-- Name: TABLE clinicas_hospitales; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.clinicas_hospitales TO zuri;


--
-- Name: SEQUENCE clinicas_hospitales_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.clinicas_hospitales_id_seq TO zuri;


--
-- Name: SEQUENCE clinicas_id_seq; Type: ACL; Schema: public; Owner: zuri
--

GRANT ALL ON SEQUENCE public.clinicas_id_seq TO postgres;


--
-- Name: TABLE cobertura_turnos; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.cobertura_turnos TO zuri;


--
-- Name: SEQUENCE cobertura_turnos_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.cobertura_turnos_id_seq TO zuri;


--
-- Name: TABLE conductores; Type: ACL; Schema: public; Owner: zuri
--

GRANT ALL ON TABLE public.conductores TO postgres;


--
-- Name: SEQUENCE conductores_id_seq; Type: ACL; Schema: public; Owner: zuri
--

GRANT ALL ON SEQUENCE public.conductores_id_seq TO postgres;


--
-- Name: TABLE doctor_clinicas; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.doctor_clinicas TO zuri;


--
-- Name: SEQUENCE doctor_clinicas_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.doctor_clinicas_id_seq TO zuri;


--
-- Name: TABLE doctor_especialidades; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.doctor_especialidades TO zuri;


--
-- Name: SEQUENCE doctor_especialidades_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.doctor_especialidades_id_seq TO zuri;


--
-- Name: TABLE doctores; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.doctores TO zuri;


--
-- Name: SEQUENCE doctores_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.doctores_id_seq TO zuri;


--
-- Name: TABLE especialidades; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.especialidades TO zuri;


--
-- Name: SEQUENCE especialidades_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.especialidades_id_seq TO zuri;


--
-- Name: TABLE importaciones; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.importaciones TO zuri;


--
-- Name: TABLE importaciones_excel; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.importaciones_excel TO zuri;


--
-- Name: SEQUENCE importaciones_excel_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.importaciones_excel_id_seq TO zuri;


--
-- Name: SEQUENCE importaciones_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.importaciones_id_seq TO zuri;


--
-- Name: TABLE motivos_no_disponibilidad; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.motivos_no_disponibilidad TO zuri;


--
-- Name: SEQUENCE motivos_no_disponibilidad_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.motivos_no_disponibilidad_id_seq TO zuri;


--
-- Name: TABLE pacientes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pacientes TO zuri;


--
-- Name: SEQUENCE pacientes_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.pacientes_id_seq TO zuri;


--
-- Name: TABLE programacion_detalles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.programacion_detalles TO zuri;


--
-- Name: SEQUENCE programacion_detalles_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.programacion_detalles_id_seq TO zuri;


--
-- Name: TABLE programaciones; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.programaciones TO zuri;


--
-- Name: SEQUENCE programaciones_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.programaciones_id_seq TO zuri;


--
-- Name: SEQUENCE seq_codigo_importacion; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.seq_codigo_importacion TO zuri;


--
-- Name: SEQUENCE seq_codigo_programacion; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.seq_codigo_programacion TO zuri;


--
-- Name: SEQUENCE seq_codigo_zuri; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.seq_codigo_zuri TO zuri;


--
-- Name: TABLE servicios; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.servicios TO zuri;


--
-- Name: SEQUENCE servicios_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.servicios_id_seq TO zuri;


--
-- Name: TABLE solicitudes_servicios; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.solicitudes_servicios TO zuri;


--
-- Name: SEQUENCE solicitudes_servicios_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.solicitudes_servicios_id_seq TO zuri;


--
-- Name: TABLE tipos_servicio; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tipos_servicio TO zuri;


--
-- Name: SEQUENCE tipos_servicio_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.tipos_servicio_id_seq TO zuri;


--
-- Name: TABLE ubicaciones_conductor; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ubicaciones_conductor TO zuri;


--
-- Name: SEQUENCE ubicaciones_conductor_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.ubicaciones_conductor_id_seq TO zuri;


--
-- Name: TABLE vista_programaciones_resumen; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.vista_programaciones_resumen TO zuri;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO zuri;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO zuri;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO zuri;


--
-- PostgreSQL database dump complete
--

\unrestrict ZAI71UdgWNGbe7t5M4KRenP4HnYAMempnpBFPIOFrON0JMNumunMQjhBDUyue0z

