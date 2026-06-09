# Plan técnico

Borrador inicial del 2026-06-09. Se redacta inmediatamente tras cerrar la auditoría de fuentes y la validación real de los 5 datasets clave. Parte de las decisiones ya está fijada por restricciones del proyecto (sin ánimo de lucro, web responsive, multilingüe, sin almacenamiento de archivos). Aquí se cierran las decisiones técnicas concretas.

## 1. Stack recomendado

| Capa | Elección | Razón |
|---|---|---|
| **Lenguaje / framework web** | **Next.js 15** (App Router) + TypeScript | SSR + i18n + fácil de desplegar gratis. Buen ecosistema. Una sola codebase para web pública + backoffice. |
| **Base de datos** | **PostgreSQL 16** | SQL maduro, **fuzzy search nativo** (`pg_trgm`, `unaccent`, `dmetaphone`), tipos geoespaciales (PostGIS), JSON, full-text. Cubre matching difuso + geoespacial sin meter otro motor. |
| **ORM / acceso a BD** | **Drizzle ORM** + driver `pg` | Ligero, type-safe, sintaxis cercana a SQL. Migraciones gestionadas con `drizzle-kit`. Mejor encaje que Prisma para Postgres serverless (Neon/Netlify DB) por menor cold-start y sin engine binario. |
| **Validación de datos** | **Zod** | Validación type-safe de entrada de formulario, payloads de API y parseo de datasets ingestados. |
| **Búsqueda / indexación** | **Postgres FTS + pg_trgm + unaccent + fuzzystrmatch** para el MVP. Migración a **Meilisearch** o **Typesense** si el tamaño lo justifica más adelante. | Empezar simple. Postgres aguanta varios cientos de miles de registros con índices bien hechos. Cambiar de motor cuando duela, no antes. |
| **Auth** | **Auth.js (NextAuth)** con email passwordless + Google OAuth opcional | Sin fricción para el modo invitado. Email magic link evita gestionar contraseñas. |
| **Almacenamiento de datos** | Solo Postgres. **Sin object storage** (no se suben archivos — decisión #10). | Coste cero por este flanco. |
| **Despliegue web** | **Netlify** (free tier; subdominio `*.netlify.app` al arrancar, dominio propio cuando proceda) | Decisión #16. Coste cero para tráfico bajo. |
| **Postgres gestionado** | **Netlify DB** (Postgres serverless, powered by Neon) | Decisión #17. Provisioning 1 clic desde Netlify. Free hasta 1 jul 2026 y después tier Neon (0.5 GB + 100 CU-h/mes). Migración trivial a Neon directo si cambian los términos. |
| **Ingesta de datasets** | Scripts de Node/TypeScript ejecutados como **GitHub Actions cron** (gratis para repos públicos) | Decisión #19 confirma repo público, lo que da GitHub Actions sin límite práctico para este uso. Job semanal/mensual que descarga, normaliza e indexa. |
| **i18n** | **next-intl** (App Router) | Estándar actual de Next.js, soporta segmentos de URL por idioma. |
| **Email transaccional** | **Resend** o **Postmark** (free tiers) | Para magic links de auth y notificaciones futuras. |
| **Observabilidad** | **Sentry** (free tier) + **Plausible** o **Umami** self-hosted para analítica respetuosa | Plausible/Umami no usan cookies → menos fricción legal con RGPD. |

**Decisión sobre presupuesto:** todo el stack inicial se puede operar en free tiers durante meses. Cuando el tráfico justifique pagar, los servicios son intercambiables. **Cero compromiso económico para arrancar.**

## 2. Modelo de datos conceptual

### Entidades principales

```
Usuario
├─ id, email (único), nombre_mostrar, idioma_preferido, creado_en
└─ Relaciones: crea Fichas, Colabora en Fichas, deja Notas

Ficha (expediente del desaparecido)
├─ id, creador_id (Usuario)
├─ visibilidad (privada | publica | publica_anonimizada)
├─ estado (recien_creada | en_curso | con_hallazgos | cerrada)
├─ datos_identidad (JSON: nombre, apellidos, apodo, nacimiento, profesion...)
├─ datos_familia (JSON: padre, madre, conyuge, hijos...)
├─ datos_contexto (JSON: bando, afiliacion, cargo) ← SENSIBLE
├─ datos_desaparicion (JSON: fecha, lugar, circunstancias, testimonios)
├─ datos_investigacion (JSON: pistas, busquedas_previas, hipotesis)
├─ visibilidad_sensible (publico | solo_colaboradores)
└─ creada_en, actualizada_en

ColaboradorFicha
├─ ficha_id, usuario_id, rol (lectura | edicion | propietario)
└─ invitado_por, aceptado_en

Hallazgo (lo que la búsqueda encuentra)
├─ id, ficha_id (puede ser NULL si es un hit de buscador anónimo)
├─ fuente_id (Fuente)
├─ score_confianza (0-1)
├─ datos_origen (JSON: campos tal como vienen de la fuente)
├─ datos_normalizados (JSON: campos en el esquema unificado)
├─ tipo_caso (consejo_de_guerra | fosa | bdst | deportado_nazi | brigadista | exiliado | nino_evacuado | prision | responsabilidades_politicas | otro)
├─ url_externa (para redirección c1 cuando aplique)
└─ estado_revision (sin_revisar | confirmado_por_usuario | descartado_por_usuario)

Fuente (catálogo de fuentes integradas)
├─ id, nombre, slug, url_origen, organismo
├─ licencia, ultima_descarga, frecuencia_actualizacion
├─ tipo_integracion (indexada | redireccion_c1 | scraping_futuro)
└─ activa (boolean)

RegistroIndice (lo que se ingesta y busca)
├─ id, fuente_id
├─ nombre, apellido_1, apellido_2 (normalizados)
├─ nombre_fonetico (Metaphone adaptado al español)
├─ fecha_nacimiento_aprox, lugar_nacimiento (provincia, municipio)
├─ fecha_desaparicion_aprox, lugar_desaparicion
├─ tipo_caso (mismo enum que Hallazgo.tipo_caso)
├─ datos_completos (JSONB con todo lo que aporta la fuente original)
├─ geom (PostGIS POINT para fosas y lugares)
└─ hash_dedup (para evitar duplicados al re-ingestar la misma fuente)

ModuloGuia (biblioteca estática de la guía)
├─ id, slug, idioma, titulo, contenido_markdown
├─ trigger (JSONB: condiciones para activarse — provincia, fechas, tipo_caso, bando...)
├─ plantillas_carta (JSON array)
└─ enlaces_externos (JSON array)

Notificacion
├─ id, usuario_id, ficha_id, tipo, leida, datos, creada_en
```

### Decisiones clave del modelo
- **Trazabilidad**: cada `RegistroIndice` referencia su `Fuente`. Cada `Hallazgo` referencia su `RegistroIndice` y por tanto su fuente. Esto permite citar el origen y respetar atribución CC BY.
- **`tipo_caso` etiquetado**: pieza esencial para que la guía dinámica active el módulo correcto. Surge directamente de la auditoría temática (tercera pasada).
- **`datos_completos` JSONB**: cada fuente trae campos distintos. Los campos comunes se normalizan en columnas; el resto se preserva en JSONB para no perder información.
- **Separación `Ficha.datos_*` y `RegistroIndice`**: la ficha es lo que crea el usuario; los registros indexados son los datos externos. Se enlazan por `Hallazgo`.
- **Sensibilidad por bloque**: `datos_contexto` es el bloque sensible (bando, afiliación). `visibilidad_sensible` controla su acceso independientemente de la visibilidad general de la ficha (decisión #9).

## 3. Wireframes (descripción funcional)

### Pantalla 1 — Bienvenida
- Cabecera mínima: logo, idioma, login/registrarse (sin imponer).
- Dos botones grandes claramente diferenciados:
  - "**Busco a alguien**" → dispara el flujo de creación de ficha guiada.
  - "**No sé por dónde empezar**" → entra a la guía general (biblioteca estática), con menú lateral por casuísticas.
- Bloque inferior: explicación corta de qué es la app, quién hay detrás, aviso de respeto al duelo y a la sensibilidad.

### Pantalla 2 — Formulario guiado paso a paso
- Una pregunta por pantalla, barra de progreso visible.
- Orden: identidad → familia → desaparición → contexto político (advertencia previa de sensibilidad) → investigación previa.
- Cada paso permite "no lo sé" sin penalizar.
- Al final, resumen revisable antes de lanzar la búsqueda.
- En cualquier paso, "guardar y continuar más tarde" (si está logueado; si no, ofrece registro).

### Pantalla 3 — Ficha del desaparecido
- Cabecera: nombre, foto-placeholder, estado de la investigación, visibilidad.
- Tabs: **Datos** / **Hallazgos** / **Guía personalizada** / **Colaboradores** / **Historial**.
- Tab Datos: campos editables agrupados por bloques. Marca visual en datos sensibles.
- Tab Hallazgos: lista de resultados de la búsqueda con score, origen (fuente), datos clave, botón "ir a fuente original", botón "confirmar/descartar".
- Tab Guía: módulos relevantes para esta ficha, en orden de prioridad. Plantillas de carta descargables.
- Tab Colaboradores: invitar, gestionar permisos.

### Pantalla 4 — Resultados de búsqueda (también accesible sin ficha)
- Filtros: provincia, fechas, tipo de caso, fuente.
- Cada resultado: nombre, score, fuente, fecha (si la hay), enlace.
- Acción rápida: "crear ficha con este registro como punto de partida".

## 4. Estrategia de matching

### Pipeline de búsqueda
1. **Normalización**: minúsculas, sin tildes (`unaccent`), trimming, gestión de partículas (de, del, la).
2. **Búsqueda fuzzy** con `pg_trgm` (similitud de trigramas) sobre nombre y apellidos.
3. **Búsqueda fonética** con `dmetaphone` adaptado para español (instalamos extensión y posiblemente un wrapper propio para variantes regionales — ver más abajo).
4. **Filtros opcionales**: provincia, rango de fechas (±5 años por defecto, ajustable).
5. **Score combinado**: peso por (a) similitud nombre + apellidos, (b) coincidencia fonética, (c) cruce de provincia, (d) cruce de fechas.
6. **Umbral mínimo** para que un resultado aparezca como "posible coincidencia"; bajo el umbral, no se muestra.

### Variantes lingüísticas regionales
Tabla de equivalencias inicial (semilla manual, ampliable): Joan↔Juan, Iñaki↔Ignacio, Xoán↔Juan, Antoni↔Antonio, Josep↔José, Mikel↔Miguel, etc. Esta tabla se aplica como expansión del término antes de buscar: si el usuario teclea "Juan", también buscamos "Joan", "Xoán", etc.

### Desambiguación
Para el MVP, mostrar todos los candidatos con score y dejar al usuario decidir. La desambiguación interactiva ("¿tu tío tenía hermano X?") queda para fase posterior (decisión #11).

## 5. Internacionalización (i18n)

- **Idiomas de interfaz**: castellano, catalán, gallego, euskera.
- **Estrategia**: archivos JSON por idioma cargados por `next-intl`. Segmentos de URL por idioma (`/es/`, `/ca/`, `/gl/`, `/eu/`).
- **Contenido de la guía**: cada `ModuloGuia` tiene una entrada por idioma. La biblioteca arranca en castellano y se traduce progresivamente.
- **Búsqueda**: la tabla de equivalencias de nombres aplica en todos los idiomas. La interfaz de búsqueda no impone idioma — el usuario teclea como quiera.

## 6. Ingesta de datasets (job)

### Pipeline por fuente
1. **Download** desde la URL canónica (Euskadi, Andalucía, Valencia, Catalunya).
2. **Parseo** según formato (CSV, JSON, XML, GeoJSON).
3. **Normalización** al esquema `RegistroIndice` (mapping fuente-específico).
4. **Etiquetado de `tipo_caso`** según la naturaleza del dataset.
5. **Geocodificación** si hay coordenadas (Valencia, Euskadi-fosas).
6. **Cálculo de hash de deduplicación** sobre nombre+apellidos+fecha+provincia.
7. **Upsert** en `RegistroIndice` (idempotente).
8. **Refresh de índices** Postgres.
9. **Registro en `Fuente.ultima_descarga`**.

### Programación
- **GitHub Actions cron** semanal para Euskadi-víctimas (que se actualiza semanalmente) y mensual para el resto (que no declaran frecuencia o son anuales).
- Log de ejecuciones consultable desde un endpoint privado.

## 7. Despliegue y operación

- Repositorio único en GitHub, **público desde el inicio** (decisión #19). Licencia MIT o equivalente para el código.
- Branch `main` con CI: lint, type check, tests.
- **Despliegue automático a Netlify desde `main`** (decisión #16).
- Base de datos: **Netlify DB** (decisión #17). Backup semanal a un bucket externo cuando el tamaño justifique pagar.
- **Sin dominio propio al arrancar** — se usa el subdominio `*.netlify.app`. Asociar dominio más adelante.

## 8. Aspectos legales y de cumplimiento

- **Aviso legal y política de privacidad**: redacción profesional antes de salir a producción (queda en el roadmap como paso 4).
- **Atribución de fuentes**: cada `Hallazgo` muestra la fuente de la que viene. La cita CC BY se respeta.
- **Mecanismo de retirada**: formulario público para solicitar retirada de un nombre concreto. Notificación al equipo, evaluación caso a caso, retirada o anonimización si procede.
- **Cookies**: solo las técnicamente imprescindibles (sesión). Analítica sin cookies (Plausible/Umami). No hay banner-trampa.
- **Logs**: sin almacenamiento de IPs más allá de lo estrictamente necesario para seguridad. Rotación corta.

## 9. Decisiones técnicas cerradas (2026-06-09)

- **Dominio**: sin dominio propio al arrancar. Subdominio `*.netlify.app`. Asociar dominio cuando proceda (decisión #16).
- **Todos los Nombres**: se incluirá en el índice cuando se consiga la cesión. **Consecuencia de licencia**: el agregado del índice se publica bajo **CC BY-NC-SA** (decisión #18). Esto contamina los datasets CC BY puros cuando se sirven mezclados. El modelo de datos mantiene `Fuente.licencia` por registro para poder, en el futuro, ofrecer un subconjunto solo-CC-BY si tuviera sentido.
- **Postgres**: **Netlify DB** (Neon por debajo). Decisión #17.
- **Repositorio**: público desde el inicio, licencia OSS permisiva (MIT o equivalente). Decisión #19.

## 10. Estado actual del scaffolding (2026-06-09)

**El MVP base está vivo en producción** — https://memoria-historica.netlify.app

Lo que está hecho:

- **Repositorio público** en https://github.com/astrozeta/memoria-historica con auto-deploy a Netlify en cada push a `main`.
- **Sitio en Netlify** (`memoria-historica.netlify.app`) en el team Interfase, build en runners Linux.
- **Base de datos Netlify DB** (Postgres serverless, powered by Neon) **aprovisionada**. La URL se inyecta como `NETLIFY_DATABASE_URL` en runtime de funciones.
- **Migración 0001_init aplicada** en producción: 8 tablas, 7 enums, FKs, índices y las 4 extensiones (`postgis`, `pg_trgm`, `unaccent`, `fuzzystrmatch`).
- **Estructura `web/`** con Next.js 16 + React 19 + TypeScript + Tailwind 4 (App Router).
- **i18n verificada en producción**: `/es`, `/ca`, `/gl`, `/eu` sirven correctamente sus traducciones; `/` redirige a `/es`.
- **Configuración de monorepo en Netlify**: `netlify.toml` en la raíz con `base = "web"`, build command `pnpm install --ignore-scripts && pnpm run build`.
- **Scripts npm** para gestión de BD: `db:generate`, `db:migrate`, `db:push`, `db:studio`.
- **Licencia MIT + README + .env.example** publicados.

Detalles técnicos resueltos:
- pnpm 11 sale con exit 1 si tiene "ignored build scripts" pendientes de aprobar. La flag `--ignore-scripts` en el install de CI lo evita. Trade-off: sharp y otros binarios nativos no se compilan, aceptable en esta fase.
- Las migraciones se aplican automáticamente al desplegar; no hay paso manual de `db:migrate` contra la BD remota.
- El plugin `@netlify/plugin-nextjs` falla en Windows con symlinks; por eso el build se ejecuta solo en runners Linux (deploy desde GitHub, no desde local).

## 11. Siguientes pasos concretos

1. ~~Scaffolding del repo~~ ✅ hecho.
2. ~~i18n configurada y verificada en producción~~ ✅ hecho.
3. ~~BD aprovisionada y migración aplicada~~ ✅ hecho.
4. ~~Formulario guiado paso a paso (UI cliente, persistencia en sessionStorage)~~ ✅ hecho en local, pendiente de push: 6 pasos (identidad, familia, desaparición, contexto sensible con aviso, investigación, resumen), navegable, navegable, traducido a los 4 idiomas, botón de búsqueda deshabilitado con mensaje "próximamente".
5. ~~Ingestor del primer dataset (**Catalunya ANC**, ~69.834 registros open data)~~ ✅ código listo, pendiente de push:
   - `web/src/lib/ingest/anc.ts`: paginación Socrata (5000/página), normalización al esquema (split de cognoms, inferencia de `tipo_caso` desde `tipus_procediment_1/2`, cálculo de `fechaNacimientoAprox` desde `any_inicial - edat`), upsert con `ON CONFLICT (fuente_id, hash_dedup) DO UPDATE`.
   - `hash_dedup` = `codi` del ANC (ID único estable).
   - Endpoint `POST /api/admin/ingest/anc` protegido por `INGEST_SECRET`. Acepta `?maxPages=N` y `?startOffset=N` para smoke tests y para trocear si el timeout de función no llega (60s).
   - Antes del primer trigger en producción, hay que: (a) setear `INGEST_SECRET` en env vars de Netlify; (b) hacer push para desplegar. Después: `curl -X POST -H "x-ingest-secret: $TOKEN" ".../api/admin/ingest/anc?maxPages=1"` como smoke test.
6. Auth.js (magic links con Resend) cuando se tenga cuenta de Resend.
7. Persistir ficha del usuario en BD una vez haya auth.
8. Implementar la búsqueda real sobre el índice cuando haya datos ingestados.
9. Iterar con más datasets (Euskadi víctimas, Andalucía, Valencia, +Catalunya deportados, +SIDBRINT, etc.) y módulos de guía dinámica por `tipo_caso`.
10. Validar el flujo con el caso piloto Luciano Herrera Calonge (al no estar en datasets abiertos, valida el patrón c1 de redirección a fuente externa).
