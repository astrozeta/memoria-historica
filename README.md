# Memoria Histórica

Aplicación web pública y sin ánimo de lucro para ayudar a familiares de personas desaparecidas durante la Guerra Civil española y la posguerra a averiguar qué ocurrió con sus seres queridos.

**Estado:** scaffolding del MVP en producción — https://memoria-historica.netlify.app

Aún no hay funcionalidad de búsqueda ni ingesta de datasets; solo la pantalla de bienvenida traducida a los cuatro idiomas. La base de datos y la infraestructura están listas para la siguiente fase.

## Qué hace

Combina dos funciones:

- **Buscador unificado** sobre datasets abiertos de víctimas, fosas y represaliados (Catalunya, Euskadi, Andalucía, Valencia y otros), con matching difuso (fuzzy + fonético) y score de confianza.
- **Guía asistida paso a paso** personalizada según el caso del familiar: a qué archivo escribir, qué plantilla usar, qué procedimiento seguir.

El usuario crea una ficha del desaparecido, la app busca, encuentra hallazgos y la guía orienta los siguientes pasos.

## Documentación

Toda la documentación viva del proyecto está en [docs/](docs/):

- [Visión y alcance](docs/vision.md)
- [Decisiones tomadas](docs/decisiones.md) — con justificación de cada una
- [Roadmap](docs/roadmap.md)
- [Auditoría de fuentes](docs/auditoria-fuentes.md) — qué hay, qué se puede usar y bajo qué licencia
- [Plan técnico](docs/plan-tecnico.md) — stack, modelo de datos, wireframes
- [Caso piloto](docs/caso-piloto.md) — Luciano Herrera Calonge

## Stack

Next.js 16 + React 19 + TypeScript + Tailwind 4 + App Router. Postgres (Netlify DB / Neon) con `pg_trgm`, `unaccent` y `dmetaphone` para matching difuso, y PostGIS para datos geoespaciales. Auth.js con magic links. i18n con next-intl (es, ca, gl, eu).

## Desarrollo local

```bash
cd web
pnpm install
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Licencia

- **Código**: MIT — ver [LICENSE](LICENSE).
- **Datos servidos por la aplicación**: CC BY-NC-SA cuando incluya Todos los Nombres (ver decisión #18).
- **Cada fuente externa indexada** mantiene su propia licencia y se cita siempre.

## Contribuir

El proyecto está en una fase muy temprana. Si te interesa colaborar (en código, en contenido de la guía, en investigación archivística o en contacto con asociaciones), abre un issue para hablarlo antes.

## Sobre los datos sensibles

Esta aplicación trata información sobre víctimas de represión política. Se sigue un cuidado especial con la privacidad de terceros vivos, con el respeto a las familias y con las implicaciones del RGPD. Cualquier persona puede solicitar la retirada de un nombre concreto.
