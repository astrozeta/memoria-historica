import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  real,
  index,
  uniqueIndex,
  customType,
  primaryKey
} from 'drizzle-orm/pg-core';

// ---------- Custom types (PostGIS) ----------

// geometry(Point, 4326) — PostGIS. Lo serializamos como GeoJSON {type:'Point', coordinates:[lon,lat]}.
export const geomPoint = customType<{
  data: {type: 'Point'; coordinates: [number, number]};
  driverData: string;
}>({
  dataType() {
    return 'geometry(Point, 4326)';
  }
});

// ---------- Enums ----------

export const visibilidadEnum = pgEnum('visibilidad', [
  'privada',
  'publica',
  'publica_anonimizada'
]);

export const estadoFichaEnum = pgEnum('estado_ficha', [
  'recien_creada',
  'en_curso',
  'con_hallazgos',
  'cerrada'
]);

export const visibilidadSensibleEnum = pgEnum('visibilidad_sensible', [
  'publico',
  'solo_colaboradores'
]);

export const rolColaboradorEnum = pgEnum('rol_colaborador', [
  'lectura',
  'edicion',
  'propietario'
]);

export const tipoCasoEnum = pgEnum('tipo_caso', [
  'consejo_de_guerra',
  'fosa',
  'bdst',
  'deportado_nazi',
  'brigadista',
  'exiliado',
  'nino_evacuado',
  'prision',
  'responsabilidades_politicas',
  'otro'
]);

export const tipoIntegracionEnum = pgEnum('tipo_integracion', [
  'indexada',
  'redireccion_c1',
  'scraping_futuro'
]);

export const estadoRevisionEnum = pgEnum('estado_revision', [
  'sin_revisar',
  'confirmado_por_usuario',
  'descartado_por_usuario'
]);

// ---------- Usuario ----------

export const usuario = pgTable('usuario', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  nombreMostrar: text('nombre_mostrar'),
  idiomaPreferido: text('idioma_preferido').notNull().default('es'),
  creadoEn: timestamp('creado_en', {withTimezone: true}).notNull().defaultNow()
});

// ---------- Ficha (expediente del desaparecido) ----------

export const ficha = pgTable(
  'ficha',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    creadorId: uuid('creador_id')
      .notNull()
      .references(() => usuario.id, {onDelete: 'restrict'}),
    visibilidad: visibilidadEnum('visibilidad').notNull().default('privada'),
    estado: estadoFichaEnum('estado').notNull().default('recien_creada'),
    visibilidadSensible: visibilidadSensibleEnum('visibilidad_sensible')
      .notNull()
      .default('solo_colaboradores'),
    datosIdentidad: jsonb('datos_identidad').$type<{
      nombre?: string;
      apellido1?: string;
      apellido2?: string;
      apodo?: string;
      fechaNacimiento?: string;
      lugarNacimiento?: {provincia?: string; municipio?: string};
      profesion?: string;
    }>(),
    datosFamilia: jsonb('datos_familia').$type<{
      padre?: string;
      madre?: string;
      conyuge?: string;
      hijos?: string[];
      estadoCivil?: string;
    }>(),
    datosContexto: jsonb('datos_contexto').$type<{
      afiliacion?: string;
      bando?: 'republicano' | 'nacional' | 'sin_definir' | 'desconocido';
      cargo?: string;
    }>(),
    datosDesaparicion: jsonb('datos_desaparicion').$type<{
      fechaAprox?: string;
      lugar?: {provincia?: string; municipio?: string};
      circunstancias?: string;
      testimonios?: string;
    }>(),
    datosInvestigacion: jsonb('datos_investigacion').$type<{
      pistas?: string;
      busquedasPrevias?: string;
      hipotesis?: string;
    }>(),
    creadaEn: timestamp('creada_en', {withTimezone: true}).notNull().defaultNow(),
    actualizadaEn: timestamp('actualizada_en', {withTimezone: true})
      .notNull()
      .defaultNow()
  },
  (table) => [index('ficha_creador_idx').on(table.creadorId)]
);

// ---------- Colaboradores de ficha ----------

export const colaboradorFicha = pgTable(
  'colaborador_ficha',
  {
    fichaId: uuid('ficha_id')
      .notNull()
      .references(() => ficha.id, {onDelete: 'cascade'}),
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuario.id, {onDelete: 'cascade'}),
    rol: rolColaboradorEnum('rol').notNull().default('lectura'),
    invitadoPor: uuid('invitado_por').references(() => usuario.id),
    invitadoEn: timestamp('invitado_en', {withTimezone: true})
      .notNull()
      .defaultNow(),
    aceptadoEn: timestamp('aceptado_en', {withTimezone: true})
  },
  (table) => [primaryKey({columns: [table.fichaId, table.usuarioId]})]
);

// ---------- Fuente (catálogo de fuentes integradas) ----------

export const fuente = pgTable('fuente', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  nombre: text('nombre').notNull(),
  urlOrigen: text('url_origen').notNull(),
  organismo: text('organismo'),
  licencia: text('licencia'),
  licenciaUrl: text('licencia_url'),
  tipoIntegracion: tipoIntegracionEnum('tipo_integracion')
    .notNull()
    .default('indexada'),
  frecuenciaActualizacion: text('frecuencia_actualizacion'),
  ultimaDescarga: timestamp('ultima_descarga', {withTimezone: true}),
  activa: boolean('activa').notNull().default(true)
});

// ---------- RegistroIndice (datos ingestados de fuentes) ----------

export const registroIndice = pgTable(
  'registro_indice',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fuenteId: uuid('fuente_id')
      .notNull()
      .references(() => fuente.id, {onDelete: 'cascade'}),
    nombre: text('nombre'),
    apellido1: text('apellido_1'),
    apellido2: text('apellido_2'),
    nombreFonetico: text('nombre_fonetico'),
    apellidoFonetico: text('apellido_fonetico'),
    fechaNacimientoAprox: text('fecha_nacimiento_aprox'),
    provinciaNacimiento: text('provincia_nacimiento'),
    municipioNacimiento: text('municipio_nacimiento'),
    fechaDesaparicionAprox: text('fecha_desaparicion_aprox'),
    provinciaDesaparicion: text('provincia_desaparicion'),
    municipioDesaparicion: text('municipio_desaparicion'),
    tipoCaso: tipoCasoEnum('tipo_caso').notNull().default('otro'),
    geom: geomPoint('geom'),
    datosCompletos: jsonb('datos_completos').notNull().default({}),
    hashDedup: text('hash_dedup').notNull(),
    ingestadoEn: timestamp('ingestado_en', {withTimezone: true})
      .notNull()
      .defaultNow()
  },
  (table) => [
    uniqueIndex('registro_dedup_unique').on(table.fuenteId, table.hashDedup),
    index('registro_nombre_idx').on(table.nombre),
    index('registro_apellido1_idx').on(table.apellido1),
    index('registro_provincia_nacim_idx').on(table.provinciaNacimiento),
    index('registro_tipo_caso_idx').on(table.tipoCaso)
  ]
);

// ---------- Hallazgo (lo que la búsqueda asocia a una ficha) ----------

export const hallazgo = pgTable(
  'hallazgo',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fichaId: uuid('ficha_id').references(() => ficha.id, {onDelete: 'cascade'}),
    registroIndiceId: uuid('registro_indice_id').references(
      () => registroIndice.id,
      {onDelete: 'set null'}
    ),
    fuenteId: uuid('fuente_id').references(() => fuente.id),
    scoreConfianza: real('score_confianza').notNull(),
    urlExterna: text('url_externa'),
    estadoRevision: estadoRevisionEnum('estado_revision')
      .notNull()
      .default('sin_revisar'),
    creadoEn: timestamp('creado_en', {withTimezone: true}).notNull().defaultNow()
  },
  (table) => [
    index('hallazgo_ficha_idx').on(table.fichaId),
    index('hallazgo_registro_idx').on(table.registroIndiceId)
  ]
);

// ---------- ModuloGuia (biblioteca estática de la guía) ----------

export const moduloGuia = pgTable(
  'modulo_guia',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    idioma: text('idioma').notNull(),
    titulo: text('titulo').notNull(),
    contenidoMarkdown: text('contenido_markdown').notNull(),
    trigger: jsonb('trigger').notNull().default({}),
    plantillasCarta: jsonb('plantillas_carta').notNull().default([]),
    enlacesExternos: jsonb('enlaces_externos').notNull().default([]),
    activo: boolean('activo').notNull().default(true),
    actualizadoEn: timestamp('actualizado_en', {withTimezone: true})
      .notNull()
      .defaultNow()
  },
  (table) => [uniqueIndex('modulo_slug_idioma_unique').on(table.slug, table.idioma)]
);

// ---------- Notificacion ----------

export const notificacion = pgTable(
  'notificacion',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    usuarioId: uuid('usuario_id')
      .notNull()
      .references(() => usuario.id, {onDelete: 'cascade'}),
    fichaId: uuid('ficha_id').references(() => ficha.id, {onDelete: 'cascade'}),
    tipo: text('tipo').notNull(),
    leida: boolean('leida').notNull().default(false),
    datos: jsonb('datos').notNull().default({}),
    creadaEn: timestamp('creada_en', {withTimezone: true}).notNull().defaultNow()
  },
  (table) => [
    // TODO: añadir índice parcial WHERE leida = false vía SQL crudo en una migración
    // cuando el volumen lo justifique.
    index('notif_usuario_creada_idx').on(table.usuarioId, table.creadaEn)
  ]
);
