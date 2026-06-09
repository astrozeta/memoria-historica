import {sql} from 'drizzle-orm';
import {z} from 'zod';
import {db} from '@/db';

// Búsqueda fuzzy sobre el índice unificado de registros.
// Combina:
//   - similarity() de pg_trgm sobre nombre, apellido_1 y apellido_2 con
//     normalización via unaccent + lower.
//   - dmetaphone para coincidencia fonética en español (capa adicional al
//     score, ayuda a sacar variantes de pronunciación).
//   - Filtros opcionales por provincia (nacimiento o desaparición) y rango
//     de años.
//   - Filtro por tipo_caso para acotar a "consejo_de_guerra", "fosa",
//     "deportado_nazi", etc.
// El umbral mínimo de score se aplica en SQL para no devolver ruido. El
// orden final es por score descendente con limit configurable.

export const searchInputSchema = z.object({
  nombre: z.string().trim().min(1).optional(),
  apellido1: z.string().trim().min(1).optional(),
  apellido2: z.string().trim().min(1).optional(),
  provincia: z.string().trim().min(1).optional(),
  yearFrom: z.coerce.number().int().min(1900).max(2000).optional(),
  yearTo: z.coerce.number().int().min(1900).max(2000).optional(),
  tipoCaso: z
    .enum([
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
    ])
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  minScore: z.coerce.number().min(0).max(1).default(0.5)
});
export type SearchInput = z.infer<typeof searchInputSchema>;

export type SearchResult = {
  id: string;
  score: number;
  nombre: string | null;
  apellido1: string | null;
  apellido2: string | null;
  fechaNacimientoAprox: string | null;
  provinciaNacimiento: string | null;
  municipioNacimiento: string | null;
  fechaDesaparicionAprox: string | null;
  provinciaDesaparicion: string | null;
  municipioDesaparicion: string | null;
  tipoCaso: string;
  datosCompletos: Record<string, unknown>;
  fuenteId: string;
  fuenteSlug: string;
  fuenteNombre: string;
  fuenteUrl: string;
  fuenteOrganismo: string | null;
  fuenteLicencia: string | null;
};

export async function search(input: SearchInput): Promise<SearchResult[]> {
  // Si no hay ningún término sobre el que medir similitud, no devolvemos
  // nada — la página de resultados pediría que rellenes al menos algo.
  if (!input.nombre && !input.apellido1 && !input.apellido2) {
    return [];
  }

  const nombre = input.nombre ?? null;
  const apellido1 = input.apellido1 ?? null;
  const apellido2 = input.apellido2 ?? null;
  const provincia = input.provincia ?? null;
  const yearFrom = input.yearFrom ?? null;
  const yearTo = input.yearTo ?? null;
  const tipoCaso = input.tipoCaso ?? null;

  // Pesos de los componentes del score. Apellido 1 pesa más porque es el
  // más identificativo en muchos contextos históricos españoles.
  const W_NOMBRE = 0.3;
  const W_AP1 = 0.45;
  const W_AP2 = 0.15;
  // Bonus si dmetaphone coincide aunque la similitud por trigramas no sea
  // perfecta (por ejemplo "Ximenez" vs "Jiménez").
  const W_PHON = 0.1;

  const rows = await db.execute(sql`
    WITH q AS (
      SELECT
        ${nombre}::text AS nombre,
        ${apellido1}::text AS apellido1,
        ${apellido2}::text AS apellido2
    ),
    scored AS (
      SELECT
        r.id,
        r.nombre,
        r.apellido_1 AS "apellido1",
        r.apellido_2 AS "apellido2",
        r.fecha_nacimiento_aprox AS "fechaNacimientoAprox",
        r.provincia_nacimiento AS "provinciaNacimiento",
        r.municipio_nacimiento AS "municipioNacimiento",
        r.fecha_desaparicion_aprox AS "fechaDesaparicionAprox",
        r.provincia_desaparicion AS "provinciaDesaparicion",
        r.municipio_desaparicion AS "municipioDesaparicion",
        r.tipo_caso AS "tipoCaso",
        r.datos_completos AS "datosCompletos",
        r.fuente_id AS "fuenteId",
        f.slug AS "fuenteSlug",
        f.nombre AS "fuenteNombre",
        f.url_origen AS "fuenteUrl",
        f.organismo AS "fuenteOrganismo",
        f.licencia AS "fuenteLicencia",
        (
          ${W_NOMBRE}::float * (CASE WHEN (SELECT nombre FROM q) IS NULL THEN 0
            ELSE similarity(unaccent(lower(coalesce(r.nombre,''))), unaccent(lower((SELECT nombre FROM q))))
          END)
          + ${W_AP1}::float * (CASE WHEN (SELECT apellido1 FROM q) IS NULL THEN 0
            ELSE similarity(unaccent(lower(coalesce(r.apellido_1,''))), unaccent(lower((SELECT apellido1 FROM q))))
          END)
          + ${W_AP2}::float * (CASE WHEN (SELECT apellido2 FROM q) IS NULL THEN 0
            ELSE similarity(unaccent(lower(coalesce(r.apellido_2,''))), unaccent(lower((SELECT apellido2 FROM q))))
          END)
          + ${W_PHON}::float * (CASE
            WHEN (SELECT apellido1 FROM q) IS NOT NULL
              AND r.apellido_1 IS NOT NULL
              AND dmetaphone(r.apellido_1) = dmetaphone((SELECT apellido1 FROM q))
            THEN 1 ELSE 0 END)
        )::float AS score
      FROM registro_indice r
      JOIN fuente f ON f.id = r.fuente_id
      WHERE
        -- Prefiltro duro: el campo más identificativo aportado por el usuario
        -- debe superar 0.5 de similitud. Sin esto, cualquier coincidencia
        -- marginal en un único campo cuela y la lista se llena de ruido.
        (
          (
            ${apellido1}::text IS NOT NULL
            AND similarity(unaccent(lower(coalesce(r.apellido_1,''))), unaccent(lower(${apellido1}::text))) >= 0.5
          )
          OR (
            ${apellido1}::text IS NULL
            AND ${apellido2}::text IS NOT NULL
            AND similarity(unaccent(lower(coalesce(r.apellido_2,''))), unaccent(lower(${apellido2}::text))) >= 0.5
          )
          OR (
            ${apellido1}::text IS NULL
            AND ${apellido2}::text IS NULL
            AND ${nombre}::text IS NOT NULL
            AND similarity(unaccent(lower(coalesce(r.nombre,''))), unaccent(lower(${nombre}::text))) >= 0.5
          )
        )
        AND (${provincia}::text IS NULL OR
          unaccent(lower(coalesce(r.provincia_nacimiento,''))) = unaccent(lower(${provincia}::text))
          OR unaccent(lower(coalesce(r.provincia_desaparicion,''))) = unaccent(lower(${provincia}::text))
        )
        AND (${yearFrom}::int IS NULL OR
          (r.fecha_desaparicion_aprox ~ '^[0-9]{4}' AND substr(r.fecha_desaparicion_aprox,1,4)::int >= ${yearFrom}::int)
        )
        AND (${yearTo}::int IS NULL OR
          (r.fecha_desaparicion_aprox ~ '^[0-9]{4}' AND substr(r.fecha_desaparicion_aprox,1,4)::int <= ${yearTo}::int)
        )
        AND (${tipoCaso}::text IS NULL OR r.tipo_caso::text = ${tipoCaso}::text)
    )
    SELECT * FROM scored
    WHERE score >= ${input.minScore}::float
    ORDER BY score DESC
    LIMIT ${input.limit}
  `);

  // db.execute con neon-http devuelve filas en .rows; con node-postgres en .rows también.
  // Para compatibilidad, normalizamos.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const list: any[] = Array.isArray(rows) ? rows : (rows as any).rows ?? [];
  return list as SearchResult[];
}
