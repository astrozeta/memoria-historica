import {NextResponse} from 'next/server';
import {sql} from 'drizzle-orm';
import {db, schema} from '@/db';

// GET /api/admin/stats
// Devuelve conteo de registros por fuente para verificar el estado de la
// ingesta. Protegido por header x-ingest-secret (mismo secret que la
// ingesta — son endpoints internos del operador).

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const expected = process.env.INGEST_SECRET;
  if (!expected) {
    return NextResponse.json(
      {ok: false, error: 'INGEST_SECRET no configurado'},
      {status: 500}
    );
  }
  const provided = req.headers.get('x-ingest-secret');
  if (provided !== expected) {
    return NextResponse.json(
      {ok: false, error: 'unauthorized'},
      {status: 401}
    );
  }

  const rows = await db.execute(sql`
    SELECT
      f.id,
      f.slug,
      f.nombre,
      f.url_origen AS "urlOrigen",
      f.organismo,
      f.licencia,
      f.frecuencia_actualizacion AS "frecuenciaActualizacion",
      f.ultima_descarga AS "ultimaDescarga",
      (SELECT count(*) FROM ${schema.registroIndice} r WHERE r.fuente_id = f.id) AS registros
    FROM ${schema.fuente} f
    ORDER BY f.slug
  `);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const list: any[] = Array.isArray(rows) ? rows : (rows as any).rows ?? [];

  const totalRows = await db.execute(sql`
    SELECT count(*)::int AS total FROM ${schema.registroIndice}
  `);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalList: any[] = Array.isArray(totalRows)
    ? totalRows
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (totalRows as any).rows ?? [];

  return NextResponse.json({
    ok: true,
    fuentes: list,
    totalRegistros: totalList[0]?.total ?? 0
  });
}
