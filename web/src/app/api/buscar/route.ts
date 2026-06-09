import {NextResponse} from 'next/server';
import {search, searchInputSchema} from '@/lib/search';

// POST /api/buscar
// Endpoint público de búsqueda contra el índice unificado.
// Body JSON con los campos del searchInputSchema.

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
  const startedAt = Date.now();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {ok: false, error: 'JSON inválido'},
      {status: 400}
    );
  }

  const parsed = searchInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {ok: false, error: 'parámetros inválidos', details: parsed.error.issues},
      {status: 400}
    );
  }

  try {
    const results = await search(parsed.data);
    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - startedAt,
      total: results.length,
      results
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
