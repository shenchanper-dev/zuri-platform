--
-- PostgreSQL database dump
--

\restrict qZO55TWs0n6yQKSviyid5aBhig2dwN5GafmIGSa0caHEfiQe3nYcNyJZWU6AHpF

-- Dumped from database version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


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
    'RETIRADO',
    'SUSPENDIDO',
    'VACACIONES',
    'LICENCIA_MEDICA'
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
-- Name: calcular_distancia_gps(numeric, numeric, numeric, numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calcular_distancia_gps(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    earth_radius DECIMAL := 6371; -- Radio de la Tierra en km
    dLat DECIMAL;
    dLon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dLat := RADIANS(lat2 - lat1);
    dLon := RADIANS(lon2 - lon1);
    
    a := SIN(dLat/2) * SIN(dLat/2) + 
         COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
         SIN(dLon/2) * SIN(dLon/2);
    
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    
    RETURN earth_radius * c;
END;
$$;


ALTER FUNCTION public.calcular_distancia_gps(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric) OWNER TO postgres;

--
-- Name: encontrar_distrito_por_gps(numeric, numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.encontrar_distrito_por_gps(lat_usuario numeric, lon_usuario numeric) RETURNS TABLE(distrito_id integer, distrito_nombre character varying, distancia_km numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.nombre,
        calcular_distancia_gps(lat_usuario, lon_usuario, d.latitud, d.longitud) as distancia
    FROM distritos d
    WHERE d.activo = TRUE
    ORDER BY distancia
    LIMIT 1;
END;
$$;


ALTER FUNCTION public.encontrar_distrito_por_gps(lat_usuario numeric, lon_usuario numeric) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clinicas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clinicas (
    id integer NOT NULL,
    nombre text NOT NULL,
    direccion text,
    latitud double precision NOT NULL,
    longitud double precision NOT NULL,
    radio double precision,
    telefono text,
    email text,
    contacto text,
    "horarioAtencion" jsonb,
    especialidades text[],
    "codigoSIS" text,
    estado public."EstadoClinica" DEFAULT 'ACTIVA'::public."EstadoClinica" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.clinicas OWNER TO postgres;

--
-- Name: clinicas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clinicas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clinicas_id_seq OWNER TO postgres;

--
-- Name: clinicas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clinicas_id_seq OWNED BY public.clinicas.id;


--
-- Name: conductores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conductores (
    id integer NOT NULL,
    dni character varying(8) NOT NULL,
    nombres character varying(100),
    apellidos character varying(100),
    "nombreCompleto" character varying(200),
    "fechaNacimiento" date,
    edad integer,
    sexo character varying(10),
    telefono character varying(15),
    celular1 character varying(15),
    celular2 character varying(15),
    telefono_emergencia character varying(15),
    email character varying(100),
    direccion text,
    distrito character varying(100),
    "distritoId" integer,
    latitud numeric(10,8),
    longitud numeric(11,8),
    latitud_actual double precision,
    longitud_actual double precision,
    "ultimaUbicacion" timestamp(3) without time zone,
    "precision" double precision,
    velocidad double precision,
    rumbo double precision,
    bateria integer,
    licencia_numero character varying(20),
    "numeroBrevete" character varying(20),
    licencia_categoria character varying(10),
    fecha_emision_licencia date,
    fecha_vencimiento_licencia date,
    puntos_licencia integer DEFAULT 100,
    certificado_transporte boolean DEFAULT false NOT NULL,
    cert_transporte_numero character varying(50),
    cert_transporte_venc date,
    tecnico_emergencias boolean DEFAULT false NOT NULL,
    tes_numero character varying(50),
    tes_vencimiento date,
    certificado_medico boolean DEFAULT false NOT NULL,
    cert_medico_numero character varying(50),
    fecha_vencimiento_medico date,
    antecedentes_penales boolean DEFAULT false NOT NULL,
    cert_penales_fecha date,
    cert_penales_vigente boolean DEFAULT false NOT NULL,
    antecedentes_policiales boolean DEFAULT false NOT NULL,
    cert_policiales_fecha date,
    cert_policiales_vigente boolean DEFAULT false NOT NULL,
    primeros_auxilios boolean DEFAULT false NOT NULL,
    cert_auxilios_fecha date,
    cert_auxilios_vigente boolean DEFAULT false NOT NULL,
    soporte_vital_basico boolean DEFAULT false NOT NULL,
    svb_fecha date,
    svb_vigente boolean DEFAULT false NOT NULL,
    soporte_vital_avanzado boolean DEFAULT false NOT NULL,
    sva_fecha date,
    sva_vigente boolean DEFAULT false NOT NULL,
    curso_covid boolean DEFAULT false NOT NULL,
    curso_pacientes_especiales boolean DEFAULT false NOT NULL,
    curso_manejo_defensivo boolean DEFAULT false NOT NULL,
    vehiculo_asignado_id integer,
    vehiculo_placa character varying(10),
    placa character varying(10),
    tipo_vehiculo character varying(50),
    "marcaAuto" character varying(50),
    modelo character varying(50),
    propietario character varying(100),
    "colorAuto" character varying(30),
    fecha_asignacion date,
    distrito_operacion character varying(100),
    distrito_operacion_id integer,
    disponibilidad jsonb,
    estado public."EstadoConductor" DEFAULT 'ACTIVO'::public."EstadoConductor" NOT NULL,
    "estadoServicio" public."EstadoTracking" DEFAULT 'DESCONECTADO'::public."EstadoTracking" NOT NULL,
    estado_texto character varying(20) DEFAULT 'ACTIVO'::character varying,
    motivo_inactividad text,
    fecha_ultima_actualizacion timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    total_servicios integer DEFAULT 0 NOT NULL,
    total_kilometros numeric(10,2),
    calificacion_promedio numeric(3,2) DEFAULT 0.00,
    total_evaluaciones integer DEFAULT 0 NOT NULL,
    fecha_ingreso timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ultima_evaluacion date,
    proxima_evaluacion date,
    total_incidentes integer DEFAULT 0 NOT NULL,
    total_accidentes integer DEFAULT 0 NOT NULL,
    ultima_sancion date,
    foto_url character varying(255),
    observaciones text,
    "estadoCivil" character varying(20),
    "numeroHijos" integer,
    contacto_emergencia_nombre character varying(100),
    contacto_emergencia_telefono character varying(15),
    "nombreContacto" character varying(100),
    "celularContacto" character varying(15),
    tipo_sangre character varying(5),
    alergias text,
    condiciones_medicas text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "creadoPor" character varying(100),
    "modificadoPor" character varying(100),
    pin_hash character varying(255),
    biometria_enabled boolean DEFAULT false NOT NULL,
    device_token character varying(255),
    device_id character varying(100),
    device_platform character varying(20),
    app_version character varying(20),
    ultimo_login timestamp(3) without time zone,
    intentos_fallidos integer DEFAULT 0 NOT NULL,
    bloqueado_hasta timestamp(3) without time zone,
    "domicilioCompleto" text,
    "domicilioDistrito" character varying(100),
    "domicilioLatitud" numeric(10,8),
    "domicilioLongitud" numeric(11,8),
    "nombreContactoEmergencia" character varying(100),
    "celularContactoEmergencia" character varying(15),
    "fechaVencimientoBrevete" date,
    "marcaVehiculo" character varying(50),
    "modeloVehiculo" character varying(50),
    "añoVehiculo" integer,
    "tipoVehiculo" character varying(30) DEFAULT 'SEDAN'::character varying,
    "capacidadPasajeros" integer DEFAULT 4,
    "colorVehiculo" character varying(30),
    "fotoVehiculo" text,
    "ubicacionActualLatitud" numeric(10,8),
    "ubicacionActualLongitud" numeric(11,8),
    "ultimaActualizacionGPS" timestamp without time zone,
    "precisionGPS" double precision,
    "velocidadActual" double precision DEFAULT 0,
    "rumboActual" double precision,
    "nivelBateria" integer DEFAULT 100,
    "estaConectado" boolean DEFAULT false,
    "ultimaConexion" timestamp without time zone,
    "modoTracking" character varying(20) DEFAULT 'MANUAL'::character varying,
    foto text,
    "fechaIngreso" date,
    equipamiento_nemt text DEFAULT '[]'::text,
    servicios_habilitados text DEFAULT '[]'::text
);


ALTER TABLE public.conductores OWNER TO postgres;

--
-- Name: COLUMN conductores.equipamiento_nemt; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.conductores.equipamiento_nemt IS 'JSON array de equipamiento NEMT disponible: ["Silla de Ruedas", "Oxígeno", "Rampa", "Camilla", "Botiquín", "Extintor"]';


--
-- Name: COLUMN conductores.servicios_habilitados; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.conductores.servicios_habilitados IS 'JSON array de servicios habilitados: ["Medicina General", "Pediatría", "Laboratorio", etc]';


--
-- Name: conductores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.conductores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conductores_id_seq OWNER TO postgres;

--
-- Name: conductores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.conductores_id_seq OWNED BY public.conductores.id;


--
-- Name: distritos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.distritos (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    provincia character varying(50) NOT NULL,
    departamento character varying(50) NOT NULL,
    latitud numeric(10,8) NOT NULL,
    longitud numeric(11,8) NOT NULL,
    codigo_postal character varying(10),
    ubigeo character varying(6),
    poblacion integer,
    area_km2 numeric(8,2),
    activo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.distritos OWNER TO postgres;

--
-- Name: TABLE distritos; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.distritos IS 'Tabla completa de 50 distritos: 43 Lima + 7 Callao con coordenadas GPS para autodetección';


--
-- Name: distritos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.distritos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.distritos_id_seq OWNER TO postgres;

--
-- Name: distritos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.distritos_id_seq OWNED BY public.distritos.id;


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
-- Name: ubicaciones_conductores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ubicaciones_conductores (
    id integer NOT NULL,
    "conductorId" integer NOT NULL,
    latitud numeric(10,8) NOT NULL,
    longitud numeric(11,8) NOT NULL,
    rumbo numeric(5,2),
    velocidad numeric(6,2),
    "precision" numeric(6,2),
    bateria integer,
    "timestamp" timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fuente character varying(20) DEFAULT 'API'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ubicaciones_conductores_fuente_check CHECK (((fuente)::text = ANY ((ARRAY['API'::character varying, 'WEBSOCKET'::character varying])::text[])))
);


ALTER TABLE public.ubicaciones_conductores OWNER TO postgres;

--
-- Name: TABLE ubicaciones_conductores; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.ubicaciones_conductores IS 'GPS location history for drivers';


--
-- Name: COLUMN ubicaciones_conductores.fuente; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ubicaciones_conductores.fuente IS 'Source of the location update: API (HTTP) or WEBSOCKET';


--
-- Name: ubicaciones_conductores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ubicaciones_conductores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ubicaciones_conductores_id_seq OWNER TO postgres;

--
-- Name: ubicaciones_conductores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ubicaciones_conductores_id_seq OWNED BY public.ubicaciones_conductores.id;


--
-- Name: vista_distritos_callao; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_distritos_callao AS
 SELECT id,
    nombre,
    provincia,
    departamento,
    latitud,
    longitud,
    codigo_postal,
    ubigeo,
    poblacion,
    area_km2,
    activo,
    created_at,
    updated_at
   FROM public.distritos
  WHERE (((provincia)::text = 'Callao'::text) AND (activo = true))
  ORDER BY nombre;


ALTER VIEW public.vista_distritos_callao OWNER TO postgres;

--
-- Name: vista_distritos_completos; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_distritos_completos AS
 SELECT id,
    nombre,
    provincia,
    departamento,
    latitud,
    longitud,
    codigo_postal,
    ubigeo,
        CASE
            WHEN ((provincia)::text = 'Lima'::text) THEN 'LIMA_METROPOLITANA'::text
            WHEN ((provincia)::text = 'Callao'::text) THEN 'CALLAO'::text
            ELSE 'OTRO'::text
        END AS zona,
    activo,
    created_at
   FROM public.distritos
  ORDER BY provincia, nombre;


ALTER VIEW public.vista_distritos_completos OWNER TO postgres;

--
-- Name: vista_distritos_lima; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.vista_distritos_lima AS
 SELECT id,
    nombre,
    provincia,
    departamento,
    latitud,
    longitud,
    codigo_postal,
    ubigeo,
    poblacion,
    area_km2,
    activo,
    created_at,
    updated_at
   FROM public.distritos
  WHERE (((provincia)::text = 'Lima'::text) AND (activo = true))
  ORDER BY nombre;


ALTER VIEW public.vista_distritos_lima OWNER TO postgres;

--
-- Name: clinicas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas ALTER COLUMN id SET DEFAULT nextval('public.clinicas_id_seq'::regclass);


--
-- Name: conductores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conductores ALTER COLUMN id SET DEFAULT nextval('public.conductores_id_seq'::regclass);


--
-- Name: distritos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.distritos ALTER COLUMN id SET DEFAULT nextval('public.distritos_id_seq'::regclass);


--
-- Name: servicios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicios ALTER COLUMN id SET DEFAULT nextval('public.servicios_id_seq'::regclass);


--
-- Name: ubicaciones_conductor id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ubicaciones_conductor ALTER COLUMN id SET DEFAULT nextval('public.ubicaciones_conductor_id_seq'::regclass);


--
-- Name: ubicaciones_conductores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ubicaciones_conductores ALTER COLUMN id SET DEFAULT nextval('public.ubicaciones_conductores_id_seq'::regclass);


--
-- Data for Name: clinicas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clinicas (id, nombre, direccion, latitud, longitud, radio, telefono, email, contacto, "horarioAtencion", especialidades, "codigoSIS", estado, "createdAt", "updatedAt") FROM stdin;
1	Clinica Test Zuri	Av. Test 123	-12.0964	-77.0328	\N	\N	\N	\N	\N	\N	\N	ACTIVA	2026-01-28 22:39:37.097	2026-01-28 22:39:37.097
\.


--
-- Data for Name: conductores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conductores (id, dni, nombres, apellidos, "nombreCompleto", "fechaNacimiento", edad, sexo, telefono, celular1, celular2, telefono_emergencia, email, direccion, distrito, "distritoId", latitud, longitud, latitud_actual, longitud_actual, "ultimaUbicacion", "precision", velocidad, rumbo, bateria, licencia_numero, "numeroBrevete", licencia_categoria, fecha_emision_licencia, fecha_vencimiento_licencia, puntos_licencia, certificado_transporte, cert_transporte_numero, cert_transporte_venc, tecnico_emergencias, tes_numero, tes_vencimiento, certificado_medico, cert_medico_numero, fecha_vencimiento_medico, antecedentes_penales, cert_penales_fecha, cert_penales_vigente, antecedentes_policiales, cert_policiales_fecha, cert_policiales_vigente, primeros_auxilios, cert_auxilios_fecha, cert_auxilios_vigente, soporte_vital_basico, svb_fecha, svb_vigente, soporte_vital_avanzado, sva_fecha, sva_vigente, curso_covid, curso_pacientes_especiales, curso_manejo_defensivo, vehiculo_asignado_id, vehiculo_placa, placa, tipo_vehiculo, "marcaAuto", modelo, propietario, "colorAuto", fecha_asignacion, distrito_operacion, distrito_operacion_id, disponibilidad, estado, "estadoServicio", estado_texto, motivo_inactividad, fecha_ultima_actualizacion, total_servicios, total_kilometros, calificacion_promedio, total_evaluaciones, fecha_ingreso, ultima_evaluacion, proxima_evaluacion, total_incidentes, total_accidentes, ultima_sancion, foto_url, observaciones, "estadoCivil", "numeroHijos", contacto_emergencia_nombre, contacto_emergencia_telefono, "nombreContacto", "celularContacto", tipo_sangre, alergias, condiciones_medicas, "createdAt", "updatedAt", "creadoPor", "modificadoPor", pin_hash, biometria_enabled, device_token, device_id, device_platform, app_version, ultimo_login, intentos_fallidos, bloqueado_hasta, "domicilioCompleto", "domicilioDistrito", "domicilioLatitud", "domicilioLongitud", "nombreContactoEmergencia", "celularContactoEmergencia", "fechaVencimientoBrevete", "marcaVehiculo", "modeloVehiculo", "añoVehiculo", "tipoVehiculo", "capacidadPasajeros", "colorVehiculo", "fotoVehiculo", "ubicacionActualLatitud", "ubicacionActualLongitud", "ultimaActualizacionGPS", "precisionGPS", "velocidadActual", "rumboActual", "nivelBateria", "estaConectado", "ultimaConexion", "modoTracking", foto, "fechaIngreso", equipamiento_nemt, servicios_habilitados) FROM stdin;
2	12345678	Carlos	Rodriguez	Carlos Rodriguez	\N	\N	\N	\N	987654321	\N	\N	carlos@zuri.pe	\N	\N	\N	\N	\N	-12.0464	-77.0428	\N	\N	\N	\N	\N	\N	A1-12345	\N	\N	\N	100	f	\N	\N	f	\N	\N	f	\N	\N	f	\N	f	f	\N	f	f	\N	f	f	\N	f	f	\N	f	f	f	f	\N	\N	ABC-123	\N	Toyota	Corolla	\N	\N	\N	\N	\N	\N	ACTIVO	DISPONIBLE	ACTIVO	\N	2026-01-19 19:22:51.553	0	\N	0.00	0	2026-01-19 19:22:51.553	\N	\N	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 19:22:51.553	2026-01-19 19:22:51.553	\N	\N	\N	f	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	SEDAN	4	\N	\N	\N	\N	\N	\N	0	\N	100	f	\N	MANUAL	\N	\N	[]	[]
3	87654321	Maria	Lopez	Maria Lopez	\N	\N	\N	\N	912345678	\N	\N	maria@zuri.pe	\N	\N	\N	\N	\N	-12.05	-77.035	\N	\N	\N	\N	\N	\N	B2-54321	\N	\N	\N	100	f	\N	\N	f	\N	\N	f	\N	\N	f	\N	f	f	\N	f	f	\N	f	f	\N	f	f	\N	f	f	f	f	\N	\N	XYZ-789	\N	Hyundai	Accent	\N	\N	\N	\N	\N	\N	ACTIVO	DISPONIBLE	ACTIVO	\N	2026-01-19 19:22:51.553	0	\N	0.00	0	2026-01-19 19:22:51.553	\N	\N	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 19:22:51.553	2026-01-19 19:22:51.553	\N	\N	\N	f	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	SEDAN	4	\N	\N	\N	\N	\N	\N	0	\N	100	f	\N	MANUAL	\N	\N	[]	[]
4	11223344	Juan	Perez	Juan Perez	\N	\N	\N	\N	956789012	\N	\N	juan@zuri.pe	\N	\N	\N	\N	\N	-12.055	-77.04	\N	\N	\N	\N	\N	\N	C3-11223	\N	\N	\N	100	f	\N	\N	f	\N	\N	f	\N	\N	f	\N	f	f	\N	f	f	\N	f	f	\N	f	f	\N	f	f	f	f	\N	\N	DEF-456	\N	Kia	Rio	\N	\N	\N	\N	\N	\N	ACTIVO	EN_CAMINO	ACTIVO	\N	2026-01-19 19:22:51.553	0	\N	0.00	0	2026-01-19 19:22:51.553	\N	\N	0	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-19 19:22:51.553	2026-01-19 19:22:51.553	\N	\N	\N	f	\N	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	SEDAN	4	\N	\N	\N	\N	\N	\N	0	\N	100	f	\N	MANUAL	\N	\N	[]	[]
8	08466466	Max	Beltran	\N	1990-12-12	\N	M	\N	941946619	\N	\N	maxbeltran26@gmail.com	\N	\N	40	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	T6848880	A-I	\N	\N	100	f	\N	\N	f	\N	\N	t	\N	\N	t	\N	f	f	\N	f	f	\N	f	f	\N	f	f	\N	f	f	f	f	\N	\N	JPY-056	\N	\N	\N	\N	rojo	\N	\N	\N	\N	ACTIVO	DISPONIBLE	ACTIVO	\N	2026-01-20 00:36:55.215	0	\N	0.00	0	2026-01-20 00:36:55.215	\N	\N	0	0	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2026-01-20 00:36:55.215	2026-01-31 05:41:03.104	\N	\N	$2b$10$TKBR4DkE8poM9GVt0csQqe9mlrImXm6x9RzW4AhP7uDSRtuw5my2O	f	\N	\N	\N	\N	2026-01-31 03:22:04.668	0	\N	A, ayacucho  450 	\N	\N	\N	\N	\N	2026-10-10	Toyota	Corona	\N	SEDAN	4	rojo	/uploads/conductores/vehiculo-08466466-1768869415202.jpg	-12.09690000	-77.03280000	2026-01-28 22:39:37.102258	10	0	0	85	t	2026-01-21 05:48:40.037744	MANUAL	/uploads/conductores/driver-08466466-1768869415200.jpg	2026-01-20	["OXIGENO","BOTIQUIN"]	["MEDICINA_GENERAL","PEDIATRIA"]
9	09647553	Huber	Padrino	\N	1995-12-12	\N	M	\N	905367343	\N	\N	\N	\N	\N	31	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	T89464533	A-I	\N	\N	100	f	\N	\N	f	\N	\N	t	\N	\N	t	\N	f	f	\N	f	f	\N	f	f	\N	f	f	\N	f	f	f	f	\N	\N	PRG-803	\N	\N	\N	\N	plomo	\N	\N	\N	\N	ACTIVO	DESCONECTADO	ACTIVO	\N	2026-01-20 01:36:35.129	0	\N	0.00	0	2026-01-20 01:36:35.129	\N	\N	0	0	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2026-01-20 01:36:35.129	2026-01-26 05:42:58.768	\N	\N	\N	f	\N	\N	\N	\N	\N	0	\N	Av larco 1298	\N	\N	\N	\N	\N	2026-10-11	Nissan	Sentra	\N	SEDAN	4	\N	/uploads/conductores/vehiculo-09647553-1768872995114.jpg	\N	\N	\N	\N	0	\N	100	f	\N	MANUAL	/uploads/conductores/driver-09647553-1768872995113.jpg	2026-01-20	["Botiquín","Extintor"]	["MEDICINA_GENERAL","PEDIATRIA"]
10	08465256	Evaristo	Mendivel	\N	1975-06-07	\N	M	\N	965711319	\N	\N	\N	\N	\N	16	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	H8537548	A-I	\N	\N	100	f	\N	\N	f	\N	\N	t	\N	\N	t	\N	f	f	\N	f	f	\N	f	f	\N	f	f	\N	f	f	f	f	\N	\N	FRT-560	\N	\N	\N	\N	plata	\N	\N	\N	\N	ACTIVO	DESCONECTADO	ACTIVO	\N	2026-01-20 04:28:53.512	0	\N	0.00	0	2026-01-20 04:28:53.512	\N	\N	0	0	\N	\N	\N	\N	0	\N	\N	\N	\N	\N	\N	\N	2026-01-20 04:28:53.512	2026-01-26 05:43:10.362	\N	\N	\N	f	\N	\N	\N	\N	\N	0	\N	Av. mariscal Miller 2360	\N	\N	\N	\N	\N	2026-07-12	Hyundai	Jules	\N	SEDAN	4	\N	/uploads/conductores/vehiculo-08465256-1768883333500.jpg	\N	\N	\N	\N	0	\N	100	f	\N	MANUAL	/uploads/conductores/driver-08465256-1768883333495.jpg	2026-01-20	["BOTIQUIN","EXTINTOR"]	["MEDICINA_GENERAL"]
\.


--
-- Data for Name: distritos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.distritos (id, nombre, provincia, departamento, latitud, longitud, codigo_postal, ubigeo, poblacion, area_km2, activo, created_at, updated_at) FROM stdin;
1	Ancón	Lima	Lima	-11.77000000	-77.15000000	15000	150102	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
2	Ate	Lima	Lima	-12.05000000	-76.92000000	15012	150103	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
3	Barranco	Lima	Lima	-12.14000000	-77.02000000	15063	150104	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
4	Breña	Lima	Lima	-12.06000000	-77.05000000	15083	150105	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
5	Carabayllo	Lima	Lima	-11.86000000	-77.03000000	15121	150106	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
6	Chaclacayo	Lima	Lima	-12.01000000	-76.76000000	15131	150107	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
7	Chorrillos	Lima	Lima	-12.19000000	-77.01000000	15056	150108	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
8	Cieneguilla	Lima	Lima	-12.09000000	-76.82000000	15012	150109	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
9	Comas	Lima	Lima	-11.93000000	-77.06000000	15311	150110	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
10	El Agustino	Lima	Lima	-12.03000000	-77.01000000	15007	150111	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
11	Independencia	Lima	Lima	-11.99000000	-77.05000000	15332	150112	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
12	Jesús María	Lima	Lima	-12.07000000	-77.05000000	15072	150113	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
13	La Molina	Lima	Lima	-12.08000000	-76.94000000	15024	150114	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
14	La Victoria	Lima	Lima	-12.07000000	-77.03000000	15013	150115	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
15	Lima	Lima	Lima	-12.04640000	-77.04280000	15001	150101	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
16	Lince	Lima	Lima	-12.09000000	-77.04000000	15046	150116	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
17	Los Olivos	Lima	Lima	-11.97000000	-77.07000000	15304	150117	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
18	Lurigancho	Lima	Lima	-11.97000000	-76.85000000	15012	150118	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
19	Lurín	Lima	Lima	-12.27000000	-76.87000000	15056	150119	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
20	Magdalena del Mar	Lima	Lima	-12.10000000	-77.07000000	15076	150120	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
21	Miraflores	Lima	Lima	-12.12000000	-77.03000000	15074	150122	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
22	Pachacamac	Lima	Lima	-12.25000000	-76.87000000	15823	150123	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
23	Pucusana	Lima	Lima	-12.47000000	-76.80000000	15821	150124	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
24	Pueblo Libre	Lima	Lima	-12.08000000	-77.06000000	15084	150121	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
25	Puente Piedra	Lima	Lima	-11.86000000	-77.07000000	15122	150125	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
26	Punta Hermosa	Lima	Lima	-12.34000000	-76.82000000	15856	150126	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
27	Punta Negra	Lima	Lima	-12.37000000	-76.81000000	15857	150127	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
28	Rímac	Lima	Lima	-12.02000000	-77.03000000	15003	150128	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
29	San Bartolo	Lima	Lima	-12.39000000	-76.78000000	15892	150129	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
30	San Borja	Lima	Lima	-12.11000000	-77.00000000	15021	150130	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
31	San Isidro	Lima	Lima	-12.09710000	-77.03610000	15073	150131	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
32	San Juan de Lurigancho	Lima	Lima	-11.98000000	-77.01000000	15400	150132	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
33	San Juan de Miraflores	Lima	Lima	-12.16000000	-76.97000000	15801	150133	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
34	San Luis	Lima	Lima	-12.08000000	-77.01000000	15022	150134	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
35	San Martín de Porres	Lima	Lima	-12.01000000	-77.08000000	15102	150135	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
36	San Miguel	Lima	Lima	-12.08000000	-77.09000000	15087	150136	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
37	Santa Anita	Lima	Lima	-12.05000000	-76.97000000	15011	150137	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
38	Santa María del Mar	Lima	Lima	-12.39000000	-76.77000000	15893	150138	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
39	Santa Rosa	Lima	Lima	-11.63000000	-77.21000000	15149	150139	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
40	Santiago de Surco	Lima	Lima	-12.14000000	-77.01000000	15023	150140	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
41	Surquillo	Lima	Lima	-12.11000000	-77.02000000	15047	150141	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
42	Villa El Salvador	Lima	Lima	-12.20000000	-76.94000000	15842	150142	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
43	Villa María del Triunfo	Lima	Lima	-12.17000000	-76.93000000	15816	150143	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
44	Bellavista	Callao	Lima	-12.05530000	-77.11470000	15011	070102	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
45	Callao	Callao	Lima	-12.05660000	-77.11810000	15001	070101	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
46	Carmen de la Legua Reynoso	Callao	Lima	-12.04000000	-77.10000000	15003	070103	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
47	La Perla	Callao	Lima	-12.07000000	-77.11000000	15006	070104	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
48	La Punta	Callao	Lima	-12.07220000	-77.16390000	15021	070105	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
49	Mi Perú	Callao	Lima	-11.99000000	-77.17000000	15067	070106	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
50	Ventanilla	Callao	Lima	-11.87750000	-77.15420000	15033	070107	\N	\N	t	2026-01-20 01:59:21.183745	2026-01-20 01:59:21.183745
\.


--
-- Data for Name: servicios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.servicios (id, codigo, "pacienteNombre", "pacienteDni", "pacienteTelefono", "pacienteObservaciones", "origenDireccion", "origenLatitud", "origenLongitud", "origenReferencia", "destinoDireccion", "destinoLatitud", "destinoLongitud", "destinoReferencia", "fechaHora", "fechaHoraLlegada", "fechaHoraRecojo", "fechaHoraEntrega", "tiempoEstimado", "distanciaEstimada", "distanciaReal", estado, "tipoServicio", prioridad, "conductorId", "fechaAsignacion", "fechaAceptacion", "fechaInicio", "fechaFinalizacion", "clinicaId", "rutaOptimizada", "rutaReal", "puntoControl", observaciones, incidentes, "motivoCancelacion", calificacion, "createdAt", "updatedAt") FROM stdin;
2	SV-TEST-1769640013334	Paciente Demo	00000000	999999999	Demo	Origen Demo	-12.0969	-77.0328	\N	Destino Demo	-12.101	-77.04	\N	2026-01-28 22:40:13.335	\N	\N	\N	\N	\N	\N	COMPLETADO	OTROS	NORMAL	8	2026-01-28 22:40:40.271	2026-01-31 03:59:52.386	2026-01-31 03:59:57.158	2026-01-31 04:02:03.603	1	\N	\N	{"asignaciones": [{"tipo": "MANUAL", "operador": "AdminTest", "timestamp": "2026-01-28T22:40:40.270Z", "toConductorId": 8, "fromConductorId": null}]}	[ASIGNACION_MANUAL] 2026-01-28T22:40:40.270Z operador=AdminTest from=null to=8	\N	\N	\N	2026-01-28 22:40:13.335	2026-01-28 22:40:13.335
\.


--
-- Data for Name: ubicaciones_conductor; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ubicaciones_conductor (id, "conductorId", latitud, longitud, "precision", altitud, velocidad, rumbo, "timestamp", fuente, bateria, "enServicio", "servicioId", "distanciaRecorrida") FROM stdin;
\.


--
-- Data for Name: ubicaciones_conductores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ubicaciones_conductores (id, "conductorId", latitud, longitud, rumbo, velocidad, "precision", bateria, "timestamp", fuente, created_at) FROM stdin;
\.


--
-- Name: clinicas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clinicas_id_seq', 1, true);


--
-- Name: conductores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.conductores_id_seq', 10, true);


--
-- Name: distritos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.distritos_id_seq', 50, true);


--
-- Name: servicios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.servicios_id_seq', 2, true);


--
-- Name: ubicaciones_conductor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ubicaciones_conductor_id_seq', 1, false);


--
-- Name: ubicaciones_conductores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ubicaciones_conductores_id_seq', 1, false);


--
-- Name: clinicas clinicas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clinicas
    ADD CONSTRAINT clinicas_pkey PRIMARY KEY (id);


--
-- Name: conductores conductores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conductores
    ADD CONSTRAINT conductores_pkey PRIMARY KEY (id);


--
-- Name: distritos distritos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.distritos
    ADD CONSTRAINT distritos_pkey PRIMARY KEY (id);


--
-- Name: servicios servicios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servicios
    ADD CONSTRAINT servicios_pkey PRIMARY KEY (id);


--
-- Name: ubicaciones_conductor ubicaciones_conductor_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ubicaciones_conductor
    ADD CONSTRAINT ubicaciones_conductor_pkey PRIMARY KEY (id);


--
-- Name: ubicaciones_conductores ubicaciones_conductores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ubicaciones_conductores
    ADD CONSTRAINT ubicaciones_conductores_pkey PRIMARY KEY (id);


--
-- Name: conductores_dni_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX conductores_dni_key ON public.conductores USING btree (dni);


--
-- Name: conductores_licencia_numero_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX conductores_licencia_numero_key ON public.conductores USING btree (licencia_numero);


--
-- Name: idx_distritos_coordenadas; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_distritos_coordenadas ON public.distritos USING btree (latitud, longitud);


--
-- Name: idx_distritos_nombre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_distritos_nombre ON public.distritos USING btree (nombre);


--
-- Name: idx_distritos_provincia; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_distritos_provincia ON public.distritos USING btree (provincia);


--
-- Name: idx_distritos_ubigeo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_distritos_ubigeo ON public.distritos USING btree (ubigeo);


--
-- Name: idx_ubicaciones_conductor; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ubicaciones_conductor ON public.ubicaciones_conductores USING btree ("conductorId");


--
-- Name: idx_ubicaciones_conductor_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ubicaciones_conductor_timestamp ON public.ubicaciones_conductores USING btree ("conductorId", "timestamp" DESC);


--
-- Name: idx_ubicaciones_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ubicaciones_timestamp ON public.ubicaciones_conductores USING btree ("timestamp" DESC);


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
-- Name: ubicaciones_conductor ubicaciones_conductor_conductorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ubicaciones_conductor
    ADD CONSTRAINT "ubicaciones_conductor_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES public.conductores(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ubicaciones_conductores ubicaciones_conductores_conductorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ubicaciones_conductores
    ADD CONSTRAINT "ubicaciones_conductores_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES public.conductores(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict qZO55TWs0n6yQKSviyid5aBhig2dwN5GafmIGSa0caHEfiQe3nYcNyJZWU6AHpF

