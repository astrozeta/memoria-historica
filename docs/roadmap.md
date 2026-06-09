# Roadmap

## Paso 1 — Auditoría de fuentes (esencialmente cerrada)

**Estado:** primera, segunda y tercera pasada (ampliación por CCAA + temáticas) completadas el 2026-06-09 → ver [auditoria-fuentes.md](auditoria-fuentes.md).

**Hallazgo principal corregido:** la entrada de datos.gob.es del "agregado de 230.000 registros" **no es descargable** — es solo una redirección al buscador de SCWD/IHR. Por tanto, lo realmente abierto y descargable hoy son los **datasets autonómicos** (Euskadi en CSV/XML/XLS, Andalucía, Comunitat Valenciana) **+ el Banc de la Memòria Democràtica de Catalunya** (69.833 registros como open data reutilizable vía ANC). El Censo Estatal Cenomi (510.857 registros) sigue pendiente de apertura pública prevista 1S 2026.

**Ampliación temática y regional:** identificadas también fuentes para deportados a campos nazis (Amical Mauthausen, memoria.gencat.cat/deportats — 9.161 personas), brigadistas internacionales (SIDBRINT — 7.000 brigadistas), exilio (Colección Digital SRE México, CIDA), niños evacuados (losninosquenuncavolvieron.es). Por CCAA: confirmadas Catalunya, Euskadi, Andalucía, Valencia, Galicia (vía IHR), Extremadura (PREMHEX), Asturias, Navarra, Aragón (DARA). Pendientes claras: Castilla y León, Castilla-La Mancha, Madrid, Murcia, Canarias, Cantabria, Baleares, La Rioja.

**Decisión tomada:** MVP "A + B en paralelo" — arrancar indexando lo descargable hoy + abrir en paralelo negociación con IHR y fuentes con licencia restrictiva.

**Acciones manuales remanentes** (no resolubles automáticamente, requieren Nacho con navegador): inspeccionar parámetros de deep linking en PARES, patrimoniocultural.defensa, TLN, ARMH, buscar-combatientes; verificar estado actual del Cenomi; revisar CDMH Salamanca; contactar IHR y CGT Andalucía / Nuestra Memoria.

Estas acciones no bloquean pasar al paso 2 — son detalles que se cierran en paralelo.

**Fuentes a auditar:**

- **SCWD / IHR** (`scwd.ihr.world`) — Spanish Civil War Database del Institute for Historical Research. 137.898 nombres digitalizados de Batallones Disciplinarios de Soldados Trabajadores. Confirmada como muy relevante por el caso piloto.
- **patrimoniocultural.defensa.gob.es** — catálogo del Ministerio de Defensa, incluye fondos del Archivo General Militar de Guadalajara. Confirmada por el caso piloto.
- **Mapa de Fosas del Ministerio de Memoria Democrática** — datos abiertos descargables.
- **Censo estatal de víctimas** del Ministerio de Memoria Democrática.
- **Todos los Nombres** (Andalucía).
- **PARES** (Portal de Archivos Españoles) — sin API oficial; usar para redirección con parámetros en URL.
- **ARMH y asociaciones regionales** — contacto y cesión de listados (medio plazo).

**Entregable:** tabla con una fila por fuente y columnas: nombre, URL, tipo de acceso (descarga / API / scraping / URL pre-rellenada), licencia, formato, número aprox. de registros, campos relevantes, frecuencia de actualización, observaciones.

## Paso 2 — Plan técnico y wireframes (borrador inicial completado)

**Estado:** borrador del plan técnico redactado el 2026-06-09 → ver [plan-tecnico.md](plan-tecnico.md).

Stack propuesto: Next.js 15 (App Router) + TypeScript + Postgres con `pg_trgm` / `unaccent` / `dmetaphone` + PostGIS para geoespacial. Auth.js, Supabase free tier para BD, Vercel para hosting, GitHub Actions para ingesta. Coste cero al arrancar.

Modelo de datos conceptual definido (Usuario, Ficha, Colaborador, Hallazgo, Fuente, RegistroIndice, ModuloGuia, Notificación). Wireframes descritos funcionalmente para las cuatro pantallas críticas.

**Decisiones técnicas pendientes** (sección 9 del plan): dominio, inclusión o no de Todos los Nombres, Supabase vs Neon, repo público desde el inicio.

## Paso 3 — MVP acotado (en curso)

- ✅ Repo público + sitio en producción (https://memoria-historica.netlify.app).
- ✅ Netlify DB aprovisionada con la migración inicial aplicada.
- ✅ Página de bienvenida traducida en es/ca/gl/eu.
- ✅ Formulario guiado de creación de ficha (`/buscar`): 6 pasos, persistencia local, traducido. Pendiente de push.
- ✅ Ingestores de Catalunya ANC (~69.834) y Euskadi víctimas (Gogora, ~50k). Endpoints admin protegidos por `INGEST_SECRET`. Pendientes de push.
- 🔜 Auth.js con magic links (Resend) y persistencia de ficha en BD.
- 🔜 Búsqueda real sobre el índice cuando haya datos.

MVP enfocado en **una sola provincia o un solo tipo de represión** como caso piloto, usando a Luciano Herrera Calonge como prueba real de extremo a extremo.

## Paso 4 — Aspectos legales antes de producción

- Redacción de aviso legal y política de privacidad por persona competente.
- Mecanismo de retirada de datos.
- Términos de uso de las fuentes que se indexen.
