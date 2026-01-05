                                              Table "public.conductores"
       Column        |              Type              | Collation | Nullable |                 Default                 
---------------------+--------------------------------+-----------+----------+-----------------------------------------
 id                  | integer                        |           | not null | nextval('conductores_id_seq'::regclass)
 dni                 | text                           |           | not null | 
 nombreCompleto      | text                           |           | not null | 
 fechaNacimiento     | timestamp(3) without time zone |           | not null | 
 celular1            | text                           |           | not null | 
 celular2            | text                           |           |          | 
 domicilio           | text                           |           | not null | 
 email               | text                           |           | not null | 
 numeroBrevete       | text                           |           | not null | 
 marcaAuto           | text                           |           | not null | 
 modelo              | text                           |           | not null | 
 propietario         | text                           |           |          | 
 estadoCivil         | text                           |           |          | 
 numeroHijos         | integer                        |           |          | 
 nombreContacto      | text                           |           |          | 
 celularContacto     | text                           |           |          | 
 observaciones       | text                           |           |          | 
 createdAt           | timestamp(3) without time zone |           | not null | CURRENT_TIMESTAMP
 updatedAt           | timestamp(3) without time zone |           | not null | 
 bateria             | integer                        |           |          | 
 estadoServicio      | "EstadoTracking"               |           | not null | 'DESCONECTADO'::"EstadoTracking"
 latitud             | double precision               |           |          | 
 longitud            | double precision               |           |          | 
 placa               | text                           |           |          | 
 precision           | double precision               |           |          | 
 rumbo               | double precision               |           |          | 
 ultimaUbicacion     | timestamp(3) without time zone |           |          | 
 velocidad           | double precision               |           |          | 
 estado              | "EstadoConductor"              |           | not null | 'ACTIVO'::"EstadoConductor"
 servicios_asignados | text[]                         |           |          | '{}'::text[]
 serviciosAsignados  | text[]                         |           |          | 
Indexes:
    "conductores_pkey" PRIMARY KEY, btree (id)
    "conductores_dni_key" UNIQUE, btree (dni)
    "idx_conductores_servicios" gin ("serviciosAsignados")
Referenced by:
    TABLE "servicios" CONSTRAINT "servicios_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES conductores(id) ON UPDATE CASCADE ON DELETE SET NULL
    TABLE "ubicaciones_conductor" CONSTRAINT "ubicaciones_conductor_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES conductores(id) ON UPDATE CASCADE ON DELETE CASCADE

