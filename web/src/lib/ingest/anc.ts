import {eq, sql} from 'drizzle-orm';
import {db, schema} from '@/db';

// Dataset: Llista de reparació jurídica de víctimes del franquisme (1938-1978)
// Publicado por el Arxiu Nacional de Catalunya en analisi.transparenciacatalunya.cat (Socrata).
// ID: 3bjt-k7vu — ~69.834 registros (al 2026-06-09).

const SOCRATA_BASE =
  'https://analisi.transparenciacatalunya.cat/resource/3bjt-k7vu.json';
const PAGE_SIZE = 5000;
const FUENTE_SLUG = 'anc-llista-reparacio-juridica';

type AncRow = {
  codi?: string;
  cognoms_nom?: string;
  cognoms?: string;
  nom?: string;
  sexe?: string;
  edat?: string;
  municipi_naixement?: string;
  pedanies_agregats_naixement?: string;
  comarca_naixement?: string;
  prov_ncia_naixement?: string;
  comunitat_aut_noma_naixement?: string;
  pa_s_naixement?: string;
  municipi_resid_ncia?: string;
  pedanies_agregats_residencia?: string;
  comarca_resid_ncia?: string;
  prov_ncia_resid_ncia?: string;
  comunitat_aut_noma_resid_ncia?: string;
  pa_s_resid_ncia?: string;
  tipus_procediment_1?: string;
  tipus_procediment_2?: string;
  num_causa?: string;
  any_inicial?: string;
  any_aprovaci_sen_o_altra_resol?: string;
  pena?: string;
  ref_num_arxiu?: string;
  autoria_de_la_descripci_?: string;
  data_de_la_descripci_?: string;
  municipi_naixement_longitud_etrs89?: string;
  municipi_naixement_latitud_etrs89?: string;
  municipi_residencia_longitud_etrs89?: string;
  municipi_residencia_latitud_etrs89?: string;
  // permitimos cualquier campo extra
  [key: string]: unknown;
};

const cleanStr = (v?: string): string | undefined => {
  if (!v) return undefined;
  const t = v.trim();
  if (!t || t === '--' || t === 'NaN') return undefined;
  return t;
};

const splitCognoms = (
  cognoms?: string
): {apellido1?: string; apellido2?: string} => {
  const c = cleanStr(cognoms);
  if (!c) return {};
  const parts = c.split(/\s+/);
  return {
    apellido1: parts[0],
    apellido2: parts.length > 1 ? parts.slice(1).join(' ') : undefined
  };
};

const inferTipoCaso = (
  t1?: string,
  t2?: string
): (typeof schema.tipoCasoEnum.enumValues)[number] => {
  const t = `${t1 ?? ''} ${t2 ?? ''}`.toLowerCase();
  if (
    t.includes('consell') ||
    t.includes('sumar') ||
    t.includes('guerra') ||
    t.includes('militar')
  )
    return 'consejo_de_guerra';
  if (t.includes('responsab')) return 'responsabilidades_politicas';
  if (t.includes('depor')) return 'deportado_nazi';
  if (t.includes('pres') || t.includes('penal')) return 'prision';
  return 'otro';
};

const calcFechaNacimientoAprox = (
  anyInicial?: string,
  edat?: string
): string | undefined => {
  const a = cleanStr(anyInicial);
  const e = cleanStr(edat);
  if (!a || !e) return undefined;
  const ai = parseInt(a, 10);
  const ei = parseInt(e, 10);
  if (Number.isNaN(ai) || Number.isNaN(ei)) return undefined;
  if (ai < 1900 || ai > 2000 || ei < 0 || ei > 110) return undefined;
  return String(ai - ei);
};

type NormalizedRow = {
  fuenteId: string;
  nombre?: string;
  apellido1?: string;
  apellido2?: string;
  nombreFonetico?: string;
  apellidoFonetico?: string;
  fechaNacimientoAprox?: string;
  provinciaNacimiento?: string;
  municipioNacimiento?: string;
  fechaDesaparicionAprox?: string;
  provinciaDesaparicion?: string;
  municipioDesaparicion?: string;
  tipoCaso: (typeof schema.tipoCasoEnum.enumValues)[number];
  datosCompletos: AncRow;
  hashDedup: string;
};

const normalize = (row: AncRow, fuenteId: string): NormalizedRow | null => {
  // hash_dedup obligatorio. ANC garantiza unicidad de `codi`.
  const hashDedup =
    cleanStr(row.codi) ??
    (cleanStr(row.ref_num_arxiu)
      ? `ref-${row.ref_num_arxiu}-${row.cognoms_nom ?? ''}`
      : null);
  if (!hashDedup) return null;

  const {apellido1, apellido2} = splitCognoms(row.cognoms);

  return {
    fuenteId,
    nombre: cleanStr(row.nom),
    apellido1,
    apellido2,
    fechaNacimientoAprox: calcFechaNacimientoAprox(row.any_inicial, row.edat),
    provinciaNacimiento: cleanStr(row.prov_ncia_naixement),
    municipioNacimiento: cleanStr(row.municipi_naixement),
    fechaDesaparicionAprox: cleanStr(row.any_inicial),
    provinciaDesaparicion: cleanStr(row.prov_ncia_resid_ncia),
    municipioDesaparicion: cleanStr(row.municipi_resid_ncia),
    tipoCaso: inferTipoCaso(row.tipus_procediment_1, row.tipus_procediment_2),
    datosCompletos: row,
    hashDedup
  };
};

async function fetchPage(offset: number, limit = PAGE_SIZE): Promise<AncRow[]> {
  const url = `${SOCRATA_BASE}?$limit=${limit}&$offset=${offset}&$order=codi`;
  const res = await fetch(url, {headers: {Accept: 'application/json'}});
  if (!res.ok) {
    throw new Error(
      `ANC fetch failed at offset ${offset}: HTTP ${res.status} ${res.statusText}`
    );
  }
  return (await res.json()) as AncRow[];
}

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
      nombre:
        'Llista de reparació jurídica de víctimes del franquisme (1938-1978)',
      urlOrigen:
        'https://analisi.transparenciacatalunya.cat/Legislaci-just-cia/Llista-de-reparaci-jur-dica-de-v-ctimes-del-franqu/3bjt-k7vu',
      organismo: 'Arxiu Nacional de Catalunya',
      licencia: 'Dades obertes — Govern de Catalunya',
      licenciaUrl: 'https://analisi.transparenciacatalunya.cat/d/avis-legal',
      tipoIntegracion: 'indexada',
      frecuenciaActualizacion: 'anual'
    })
    .returning({id: schema.fuente.id});
  return created;
}

export type IngestResult = {
  fuenteId: string;
  pagesFetched: number;
  rowsFetched: number;
  rowsNormalized: number;
  rowsInsertedOrUpdated: number;
};

export async function ingest({
  maxPages = Infinity,
  startOffset = 0
}: {maxPages?: number; startOffset?: number} = {}): Promise<IngestResult> {
  const fuente = await ensureFuente();
  let offset = startOffset;
  let page = 0;
  let rowsFetched = 0;
  let rowsNormalized = 0;
  let rowsInsertedOrUpdated = 0;

  while (page < maxPages) {
    const rows = await fetchPage(offset);
    if (rows.length === 0) break;
    rowsFetched += rows.length;

    const normalized = rows
      .map((r) => normalize(r, fuente.id))
      .filter((r): r is NormalizedRow => r !== null);
    rowsNormalized += normalized.length;

    if (normalized.length > 0) {
      const inserted = await db
        .insert(schema.registroIndice)
        .values(normalized)
        .onConflictDoUpdate({
          target: [
            schema.registroIndice.fuenteId,
            schema.registroIndice.hashDedup
          ],
          set: {
            nombre: sql`excluded.nombre`,
            apellido1: sql`excluded.apellido_1`,
            apellido2: sql`excluded.apellido_2`,
            fechaNacimientoAprox: sql`excluded.fecha_nacimiento_aprox`,
            provinciaNacimiento: sql`excluded.provincia_nacimiento`,
            municipioNacimiento: sql`excluded.municipio_nacimiento`,
            fechaDesaparicionAprox: sql`excluded.fecha_desaparicion_aprox`,
            provinciaDesaparicion: sql`excluded.provincia_desaparicion`,
            municipioDesaparicion: sql`excluded.municipio_desaparicion`,
            tipoCaso: sql`excluded.tipo_caso`,
            datosCompletos: sql`excluded.datos_completos`
          }
        })
        .returning({id: schema.registroIndice.id});
      rowsInsertedOrUpdated += inserted.length;
    }

    offset += rows.length;
    page += 1;
    if (rows.length < PAGE_SIZE) break;
  }

  await db
    .update(schema.fuente)
    .set({ultimaDescarga: new Date()})
    .where(eq(schema.fuente.id, fuente.id));

  return {
    fuenteId: fuente.id,
    pagesFetched: page,
    rowsFetched,
    rowsNormalized,
    rowsInsertedOrUpdated
  };
}
