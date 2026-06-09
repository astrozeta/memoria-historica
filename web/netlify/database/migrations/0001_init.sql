-- Extensiones requeridas por el schema:
-- - postgis: tipo geometry(Point, 4326) en registro_indice.geom
-- - pg_trgm: similitud por trigramas (fuzzy matching de nombres)
-- - unaccent: normalización de tildes
-- - fuzzystrmatch: dmetaphone para matching fonético
CREATE EXTENSION IF NOT EXISTS "postgis";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "pg_trgm";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "unaccent";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";--> statement-breakpoint
CREATE TYPE "public"."estado_ficha" AS ENUM('recien_creada', 'en_curso', 'con_hallazgos', 'cerrada');--> statement-breakpoint
CREATE TYPE "public"."estado_revision" AS ENUM('sin_revisar', 'confirmado_por_usuario', 'descartado_por_usuario');--> statement-breakpoint
CREATE TYPE "public"."rol_colaborador" AS ENUM('lectura', 'edicion', 'propietario');--> statement-breakpoint
CREATE TYPE "public"."tipo_caso" AS ENUM('consejo_de_guerra', 'fosa', 'bdst', 'deportado_nazi', 'brigadista', 'exiliado', 'nino_evacuado', 'prision', 'responsabilidades_politicas', 'otro');--> statement-breakpoint
CREATE TYPE "public"."tipo_integracion" AS ENUM('indexada', 'redireccion_c1', 'scraping_futuro');--> statement-breakpoint
CREATE TYPE "public"."visibilidad" AS ENUM('privada', 'publica', 'publica_anonimizada');--> statement-breakpoint
CREATE TYPE "public"."visibilidad_sensible" AS ENUM('publico', 'solo_colaboradores');--> statement-breakpoint
CREATE TABLE "colaborador_ficha" (
	"ficha_id" uuid NOT NULL,
	"usuario_id" uuid NOT NULL,
	"rol" "rol_colaborador" DEFAULT 'lectura' NOT NULL,
	"invitado_por" uuid,
	"invitado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"aceptado_en" timestamp with time zone,
	CONSTRAINT "colaborador_ficha_ficha_id_usuario_id_pk" PRIMARY KEY("ficha_id","usuario_id")
);
--> statement-breakpoint
CREATE TABLE "ficha" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creador_id" uuid NOT NULL,
	"visibilidad" "visibilidad" DEFAULT 'privada' NOT NULL,
	"estado" "estado_ficha" DEFAULT 'recien_creada' NOT NULL,
	"visibilidad_sensible" "visibilidad_sensible" DEFAULT 'solo_colaboradores' NOT NULL,
	"datos_identidad" jsonb,
	"datos_familia" jsonb,
	"datos_contexto" jsonb,
	"datos_desaparicion" jsonb,
	"datos_investigacion" jsonb,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizada_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fuente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"nombre" text NOT NULL,
	"url_origen" text NOT NULL,
	"organismo" text,
	"licencia" text,
	"licencia_url" text,
	"tipo_integracion" "tipo_integracion" DEFAULT 'indexada' NOT NULL,
	"frecuencia_actualizacion" text,
	"ultima_descarga" timestamp with time zone,
	"activa" boolean DEFAULT true NOT NULL,
	CONSTRAINT "fuente_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "hallazgo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ficha_id" uuid,
	"registro_indice_id" uuid,
	"fuente_id" uuid,
	"score_confianza" real NOT NULL,
	"url_externa" text,
	"estado_revision" "estado_revision" DEFAULT 'sin_revisar' NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modulo_guia" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"idioma" text NOT NULL,
	"titulo" text NOT NULL,
	"contenido_markdown" text NOT NULL,
	"trigger" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"plantillas_carta" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"enlaces_externos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notificacion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"usuario_id" uuid NOT NULL,
	"ficha_id" uuid,
	"tipo" text NOT NULL,
	"leida" boolean DEFAULT false NOT NULL,
	"datos" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registro_indice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fuente_id" uuid NOT NULL,
	"nombre" text,
	"apellido_1" text,
	"apellido_2" text,
	"nombre_fonetico" text,
	"apellido_fonetico" text,
	"fecha_nacimiento_aprox" text,
	"provincia_nacimiento" text,
	"municipio_nacimiento" text,
	"fecha_desaparicion_aprox" text,
	"provincia_desaparicion" text,
	"municipio_desaparicion" text,
	"tipo_caso" "tipo_caso" DEFAULT 'otro' NOT NULL,
	"geom" geometry(Point, 4326),
	"datos_completos" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"hash_dedup" text NOT NULL,
	"ingestado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"nombre_mostrar" text,
	"idioma_preferido" text DEFAULT 'es' NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usuario_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "colaborador_ficha" ADD CONSTRAINT "colaborador_ficha_ficha_id_ficha_id_fk" FOREIGN KEY ("ficha_id") REFERENCES "public"."ficha"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "colaborador_ficha" ADD CONSTRAINT "colaborador_ficha_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "colaborador_ficha" ADD CONSTRAINT "colaborador_ficha_invitado_por_usuario_id_fk" FOREIGN KEY ("invitado_por") REFERENCES "public"."usuario"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ficha" ADD CONSTRAINT "ficha_creador_id_usuario_id_fk" FOREIGN KEY ("creador_id") REFERENCES "public"."usuario"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hallazgo" ADD CONSTRAINT "hallazgo_ficha_id_ficha_id_fk" FOREIGN KEY ("ficha_id") REFERENCES "public"."ficha"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hallazgo" ADD CONSTRAINT "hallazgo_registro_indice_id_registro_indice_id_fk" FOREIGN KEY ("registro_indice_id") REFERENCES "public"."registro_indice"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hallazgo" ADD CONSTRAINT "hallazgo_fuente_id_fuente_id_fk" FOREIGN KEY ("fuente_id") REFERENCES "public"."fuente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_usuario_id_usuario_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_ficha_id_ficha_id_fk" FOREIGN KEY ("ficha_id") REFERENCES "public"."ficha"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registro_indice" ADD CONSTRAINT "registro_indice_fuente_id_fuente_id_fk" FOREIGN KEY ("fuente_id") REFERENCES "public"."fuente"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ficha_creador_idx" ON "ficha" USING btree ("creador_id");--> statement-breakpoint
CREATE INDEX "hallazgo_ficha_idx" ON "hallazgo" USING btree ("ficha_id");--> statement-breakpoint
CREATE INDEX "hallazgo_registro_idx" ON "hallazgo" USING btree ("registro_indice_id");--> statement-breakpoint
CREATE UNIQUE INDEX "modulo_slug_idioma_unique" ON "modulo_guia" USING btree ("slug","idioma");--> statement-breakpoint
CREATE INDEX "notif_usuario_creada_idx" ON "notificacion" USING btree ("usuario_id","creada_en");--> statement-breakpoint
CREATE UNIQUE INDEX "registro_dedup_unique" ON "registro_indice" USING btree ("fuente_id","hash_dedup");--> statement-breakpoint
CREATE INDEX "registro_nombre_idx" ON "registro_indice" USING btree ("nombre");--> statement-breakpoint
CREATE INDEX "registro_apellido1_idx" ON "registro_indice" USING btree ("apellido_1");--> statement-breakpoint
CREATE INDEX "registro_provincia_nacim_idx" ON "registro_indice" USING btree ("provincia_nacimiento");--> statement-breakpoint
CREATE INDEX "registro_tipo_caso_idx" ON "registro_indice" USING btree ("tipo_caso");