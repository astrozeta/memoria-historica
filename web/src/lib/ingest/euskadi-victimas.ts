import {createHash} from 'node:crypto';
import {eq, sql} from 'drizzle-orm';
import {db, schema} from '@/db';

// Dataset: Víctimas mortales de la Guerra Civil en Euskadi.
// Mantenedor: Gogora — Instituto de la Memoria, Convivencia y Derechos Humanos.
// Publicado en opendata.euskadi.eus, CC BY 4.0, actualización semanal.

const SOURCE_URL =
  'https://opendata.euskadi.eus/contenidos/ds_general/victimas_guerra_civil/opendata/victimas_guerra_civil.json';
const CHUNK_SIZE = 1000;
const FUENTE_SLUG = 'gogora-victimas-gc-euskadi';

type GogoraRow = {
  Apellidos?: string;
  Nombre?: string;
  Provincianacimiento?: string;
  Municipionacimiento?: string;
  Provinciadomicilio?: string;
  Municipiodomicilio?: string;
  Batallon?: string;
  Causamuerte?: string;
  Fechafallecimiento?: string;
  Lugarfallecimiento?: string;
  Provinciafallecimiento?: string;
  Lugarinhumacion?: string;
  Fuentes?: string;
  [key: string]: unknown;
};

const UNKNOWN_VALUES = new Set([
  'ezezaguna/desconocido',
  'ezezaguna / desconocida',
  'ezezaguna/desconocida',
  'identifikatu gabe/sin identificar',
  'sin identificar',
  'desconocido',
  'desconocida',
  '--',
  ''
]);

const cleanStr = (v?: string): string | undefined => {
  if (!v) return undefined;
  const t = v.trim();
  if (!t) return undefined;
  if (UNKNOWN_VALUES.has(t.toLowerCase())) return undefined;
  return t;
};

const splitApellidos = (
  apellidos?: string
): {apellido1?: string; apellido2?: string} => {
  const a = cleanStr(apellidos);
  if (!a) return {};
  const parts = a.split(/\s+/);
  return {
    apellido1: parts[0],
    apellido2: parts.length > 1 ? parts.slice(1).join(' ') : undefined
  };
};

const extractYear = (fecha?: string): string | undefined => {
  const f = cleanStr(fecha);
  if (!f) return undefined;
  const m = f.match(/(\d{4})/);
  return m ? m[1] : undefined;
};

const inferTipoCaso = (
  row: GogoraRow
): (typeof schema.tipoCasoEnum.enumValues)[number] => {
  const causa = (row.Causamuerte ?? '').toLowerCase();
  const inhum = (row.Lugarinhumacion ?? '').toLowerCase();
  if (causa.includes('fosa') || inhum.includes('fosa')) return 'fosa';
  if (causa.includes('campo') || causa.includes('depor')) return 'deportado_nazi';
  if (causa.includes('consejo') || causa.includes('ejecuc') || causa.includes('fusil'))
    return 'consejo_de_guerra';
  return 'otro';
};

const hashDedup = (row: GogoraRow): string => {
  const key = [
    row.Apellidos ?? '',
    row.Nombre ?? '',
    row.Fechafallecimiento ?? '',
    row.Lugarfallecimiento ?? '',
    row.Lugarinhumacion ?? '',
    row.Fuentes ?? ''
  ]
    .map((s) => s.trim().toLowerCase())
    .join('|');
  return createHash('sha1').update(key).digest('hex');
};

type NormalizedRow = {
  fuenteId: string;
  nombre?: string;
  apellido1?: string;
  apellido2?: string;
  fechaDesaparicionAprox?: string;
  provinciaNacimiento?: string;
  municipioNacimiento?: string;
  provinciaDesaparicion?: string;
  municipioDesaparicion?: string;
  tipoCaso: (typeof schema.tipoCasoEnum.enumValues)[number];
  datosCompletos: GogoraRow;
  hashDedup: string;
};

const normalize = (row: GogoraRow, fuenteId: string): NormalizedRow | null => {
  const {apellido1, apellido2} = splitApellidos(row.Apellidos);
  const nombre = cleanStr(row.Nombre);
  if (!nombre && !apellido1) {
    // Sin nombre ni apellido no aporta nada al buscador.
    return null;
  }
  return {
    fuenteId,
    nombre,
    apellido1,
    apellido2,
    fechaDesaparicionAprox: extractYear(row.Fechafallecimiento),
    provinciaNacimiento: cleanStr(row.Provincianacimiento),
    municipioNacimiento: cleanStr(row.Municipionacimiento),
    provinciaDesaparicion: cleanStr(row.Provinciafallecimiento),
    municipioDesaparicion:
      cleanStr(row.Lugarfallecimiento) ?? cleanStr(row.Municipiodomicilio),
    tipoCaso: inferTipoCaso(row),
    datosCompletos: row,
    hashDedup: hashDedup(row)
  };
};

export async function ensureFuente(): Promise<{id: string}> {
  const existing = await db
    .select({id: schema.fuente.id})
    .from(schema.fuente)
    .where(eq(schema.fuente.slug, FUENTE_SLUG))
    .limit(1);
  if (existing.length > 0) return existing[0];

  const [created] = await db
    .insert(schema.fuente)
    .values({
      slug: FUENTE_SLUG,
      nombre: 'Víctimas mortales de la Guerra Civil en Euskadi (Gogora)',
      urlOrigen:
        'https://datos.gob.es/es/catalogo/a16003011-victimas-mortales-de-la-guerra-civil-en-euskadi',
      organismo:
        'Gogora — Instituto de la Memoria, la Convivencia y los Derechos Humanos (Gobierno Vasco)',
      licencia: 'CC BY 4.0',
      licenciaUrl: 'https://creativecommons.org/licenses/by/4.0/',
      tipoIntegracion: 'indexada',
      frecuenciaActualizacion: 'semanal'
    })
    .returning();
  return {id: created.id};
}

async function fetchAll(): Promise<GogoraRow[]> {
  const res = await fetch(SOURCE_URL, {headers: {Accept: 'application/json'}});
  if (!res.ok) {
    throw new Error(
      `Gogora fetch failed: HTTP ${res.status} ${res.statusText}`
    );
  }
  return (await res.json()) as GogoraRow[];
}

export type IngestResult = {
  fuenteId: string;
  rowsFetched: number;
  rowsNormalized: number;
  rowsInsertedOrUpdated: number;
  chunks: number;
};

export async function ingest({
  maxRows,
  startOffset = 0
}: {maxRows?: number; startOffset?: number} = {}): Promise<IngestResult> {
  const fuente = await ensureFuente();
  const all = await fetchAll();
  const end =
    typeof maxRows === 'number' ? startOffset + maxRows : all.length;
  const slice = all.slice(startOffset, end);

  let rowsNormalized = 0;
  let rowsInsertedOrUpdated = 0;
  let chunks = 0;

  // Deduplicar dentro del propio lote por hashDedup (la fuente puede tener
  // duplicados literales; ON CONFLICT no permite dos filas con el mismo
  // hash dentro del mismo INSERT).
  const seen = new Set<string>();
  const normalized: NormalizedRow[] = [];
  for (const r of slice) {
    const n = normalize(r, fuente.id);
    if (!n) continue;
    if (seen.has(n.hashDedup)) continue;
    seen.add(n.hashDedup);
    normalized.push(n);
  }
  rowsNormalized = normalized.length;

  for (let i = 0; i < normalized.length; i += CHUNK_SIZE) {
    const chunk = normalized.slice(i, i + CHUNK_SIZE);
    const inserted = await db
      .insert(schema.registroIndice)
      .values(chunk)
      .onConflictDoUpdate({
        target: [
          schema.registroIndice.fuenteId,
          schema.registroIndice.hashDedup
        ],
        set: {
          nombre: sql`excluded.nombre`,
          apellido1: sql`excluded.apellido_1`,
          apellido2: sql`excluded.apellido_2`,
          fechaDesaparicionAprox: sql`excluded.fecha_desaparicion_aprox`,
          provinciaNacimiento: sql`excluded.provincia_nacimiento`,
          municipioNacimiento: sql`excluded.municipio_nacimiento`,
          provinciaDesaparicion: sql`excluded.provincia_desaparicion`,
          municipioDesaparicion: sql`excluded.municipio_desaparicion`,
          tipoCaso: sql`excluded.tipo_caso`,
          datosCompletos: sql`excluded.datos_completos`
        }
      })
      .returning();
    rowsInsertedOrUpdated += inserted.length;
    chunks += 1;
  }

  await db
    .update(schema.fuente)
    .set({ultimaDescarga: new Date()})
    .where(eq(schema.fuente.id, fuente.id));

  return {
    fuenteId: fuente.id,
    rowsFetched: slice.length,
    rowsNormalized,
    rowsInsertedOrUpdated,
    chunks
  };
}
