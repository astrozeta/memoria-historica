# Decisiones tomadas

Decisiones cerradas durante la entrevista de requisitos del 2026-06-09. No reabrir sin motivo nuevo.

| # | Decisión | Justificación |
|---|----------|---------------|
| 1 | Aplicación combina buscador unificado (A) + guía asistida (C). | El usuario quiere ambas, no solo una. |
| 2 | Usuario principal: familiares con o sin investigación previa. Escalable a investigadores y asociaciones. | Foco claro para el MVP sin cerrar la puerta a más adelante. |
| 3 | Fuentes de datos: enfoque híbrido (índice propio + redirección con URL pre-rellenadas). | Única vía realista a corto plazo; scraping y acuerdos van a medio/largo plazo. |
| 4 | Entrada: bienvenida con dos caminos ("buscar" / "guíame") + formulario guiado paso a paso. | Reduce barrera para usuarios sin conocimientos previos. |
| 5 | Núcleo: ficha del desaparecido como expediente persistente. | Permite enriquecimiento incremental, colaboración y notificaciones. |
| 6 | Cuentas: modo invitado + registro opcional. Fichas colaborativas entre familiares. | Mínima fricción inicial; alineado con el espíritu colaborativo del proyecto. |
| 7 | Guía asistida: biblioteca estática + guía dinámica personalizada. Sin IA conversacional. | La IA sin fuentes fiables alucinaría nombres de archivos y formularios. |
| 8 | Visibilidad por ficha: privada / pública / pública anonimizada. Por defecto pública. | Equilibrio entre valor colaborativo y protección RGPD/ética. |
| 9 | Datos sensibles con control independiente: en fichas públicas, ocultos a anónimos salvo autorización. | Protege a terceros vivos y respeta sensibilidad familiar. |
| 10 | Sin subida de archivos ni fotos. Solo texto estructurado. | Elimina coste de almacenamiento, moderación y derechos de imagen. |
| 11 | Matching difuso para el MVP (fuzzy + fonético + cruce con fechas y provincia + score de confianza). | Equilibrio entre cobertura y falsos positivos en datos históricos ruidosos. |
| 12 | Multilingüe: español, catalán, gallego, euskera. Afecta interfaz y matching de nombres. | Cobertura nacional real. |
| 13 | Solo web responsive. Sin app nativa por ahora. | Reduce alcance del MVP sin perder usuarios móviles. |
| 14 | Proyecto personal, público, sin ánimo de lucro. | Define el modelo: aviso legal claro, infraestructura de bajo coste, sin presión de monetización. |
| 15 | Estrategia MVP: **Opción A + B en paralelo**. Arrancar indexando solo lo descargable y abierto hoy (datasets autonómicos de fosas y víctimas: Euskadi, Andalucía, Valencia, +otros que aparezcan), con redirección c1 para el resto. En paralelo, abrir negociación con IHR (SCWD) y otras fuentes con licencia restrictiva (TLN). | El MVP arranca sin negociaciones bloqueantes; las cesiones que se consigan a tiempo se integran antes del lanzamiento, las que no, llegan después. |
| 16 | **Despliegue inicial en Netlify**, sin dominio propio al arrancar (subdominio `*.netlify.app`). | Nacho ya tiene Netlify como referencia; cambio de Vercel a Netlify en el plan técnico. Dominio se asocia más adelante. |
| 17 | **Base de datos: Netlify DB** (Postgres serverless, powered by Neon). | Provisioning 1 clic desde Netlify, mismo proveedor, free hasta 1 jul 2026 y después tier Neon. Migración trivial a Neon directo si los términos cambian. Supabase descartado porque su valor diferencial (auth + storage) no se necesita aquí (no se suben archivos, auth se resuelve con Auth.js + magic links). |
| 18 | **Incluir Todos los Nombres** en el índice del MVP cuando se consiga la cesión / acuerdo. | Decisión consciente del usuario. **Implicación importante:** TLN está bajo CC BY-NC-SA, lo que obliga a relicenciar el conjunto agregado del índice bajo la misma licencia (share-alike y non-commercial). Esto contamina los datasets CC BY puros (Euskadi, Andalucía, Valencia, Catalunya) cuando se sirven mezclados. Estrategia técnica: mantener una marca por registro y servir TLN solo bajo CC BY-NC-SA, o aceptar que el agregado completo es CC BY-NC-SA. **Por defecto el agregado se publica como CC BY-NC-SA.** |
| 19 | **Repositorio público desde el inicio.** Licencia del código: MIT u otra OSS permisiva. | Alineado con el espíritu del proyecto y con la transparencia que merece un proyecto de memoria. |
| 20 | **ORM: Drizzle** (con driver `pg`). Migraciones con `drizzle-kit`. | Más ligero que Prisma, sin engine binario, mejor encaje con Postgres serverless (Neon/Netlify DB). Sintaxis cercana a SQL — el equipo no se aleja del modelo relacional. |

## Decisiones pendientes (no bloqueantes para arrancar el roadmap)

- Verificación de "soy familiar" para acceso a datos sensibles en fichas públicas.
- Gestión de conflictos de edición en fichas colaborativas.
- Quién redacta el contenido de la biblioteca estática (el usuario, encargo, colaboración con asociaciones).
- Cruce de fichas duplicadas cuando dos familias buscan a la misma persona.
