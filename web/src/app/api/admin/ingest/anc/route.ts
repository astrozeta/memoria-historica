import {NextResponse} from 'next/server';
import {ingest} from '@/lib/ingest/anc';

// Endpoint admin para disparar la ingesta del dataset del ANC.
// Protegido por header x-ingest-secret == process.env.INGEST_SECRET.
//
// Uso típico:
//   curl -X POST -H "x-ingest-secret: $TOKEN" \
//     "https://memoria-historica.netlify.app/api/admin/ingest/anc?maxPages=1"
//
// El parámetro maxPages limita cuántas páginas (de PAGE_SIZE registros) se
// piden. Útil para hacer smoke tests sin meter los 69k registros de golpe.
// Si se omite, ingesta el dataset completo (puede agotar el timeout de la
// función — entonces se llama varias veces ajustando startOffset).

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
  const maxPagesParam = url.searchParams.get('maxPages');
  const startOffsetParam = url.searchParams.get('startOffset');

  const maxPages = maxPagesParam ? parseInt(maxPagesParam, 10) : undefined;
  const startOffset = startOffsetParam ? parseInt(startOffsetParam, 10) : 0;

  if (
    (maxPages !== undefined && (Number.isNaN(maxPages) || maxPages < 1)) ||
    Number.isNaN(startOffset) ||
    startOffset < 0
  ) {
    return NextResponse.json(
      {ok: false, error: 'parámetros inválidos'},
      {status: 400}
    );
  }

  const startedAt = Date.now();
  try {
    const result = await ingest({maxPages, startOffset});
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
