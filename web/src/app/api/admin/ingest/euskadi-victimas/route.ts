import {NextResponse} from 'next/server';
import {ingest} from '@/lib/ingest/euskadi-victimas';

// POST /api/admin/ingest/euskadi-victimas
// Protegido por header x-ingest-secret == process.env.INGEST_SECRET.
// Parámetro opcional ?maxRows=N para smoke tests sin descargar el dataset
// completo (~13 MB JSON, ~50k registros).

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  const expected = process.env.INGEST_SECRET;
  if (!expected) {
    return NextResponse.json(
      {ok: false, error: 'INGEST_SECRET no configurado en el servidor'},
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

  const url = new URL(req.url);
  const maxRowsParam = url.searchParams.get('maxRows');
  const maxRows = maxRowsParam ? parseInt(maxRowsParam, 10) : undefined;
  if (maxRows !== undefined && (Number.isNaN(maxRows) || maxRows < 1)) {
    return NextResponse.json(
      {ok: false, error: 'maxRows inválido'},
      {status: 400}
    );
  }

  const startedAt = Date.now();
  try {
    const result = await ingest({maxRows});
    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - startedAt,
      ...result
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        durationMs: Date.now() - startedAt,
        error: err instanceof Error ? err.message : String(err)
      },
      {status: 500}
    );
  }
}
