'use client';

import {useEffect, useMemo, useReducer, useState} from 'react';
import {useTranslations} from 'next-intl';
import {
  DRAFT_STORAGE_KEY,
  STEP_ORDER,
  type Bando,
  type FichaDraft,
  emptyFichaDraft,
  fichaDraftSchema,
  hasAnyValue
} from '@/lib/ficha';
import {Link} from '@/i18n/navigation';

type SearchResult = {
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
  fuenteNombre: string;
  fuenteUrl: string;
  fuenteOrganismo: string | null;
  fuenteLicencia: string | null;
};

type Section = keyof FichaDraft;

type Action =
  | {type: 'hydrate'; draft: FichaDraft}
  | {type: 'update'; section: Section; field: string; value: string | undefined}
  | {type: 'reset'};

function reducer(state: FichaDraft, action: Action): FichaDraft {
  switch (action.type) {
    case 'hydrate':
      return action.draft;
    case 'update':
      return {
        ...state,
        [action.section]: {
          ...state[action.section],
          [action.field]: action.value
        }
      };
    case 'reset':
      return emptyFichaDraft;
  }
}

function loadDraft(): FichaDraft {
  if (typeof window === 'undefined') return emptyFichaDraft;
  try {
    const raw = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return emptyFichaDraft;
    const parsed = fichaDraftSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : emptyFichaDraft;
  } catch {
    return emptyFichaDraft;
  }
}

function saveDraft(draft: FichaDraft) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // ignorar quota errors u otros
  }
}

export default function BuscarWizard() {
  const t = useTranslations('wizard');
  const tField = useTranslations('wizard.fields');
  const tBando = useTranslations('wizard.bando');
  const tStepName = useTranslations('wizard.stepNames');

  const [draft, dispatch] = useReducer(reducer, emptyFichaDraft);
  const [stepIdx, setStepIdx] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Hidratar desde sessionStorage tras montar (evita mismatch SSR).
  useEffect(() => {
    const initial = loadDraft();
    dispatch({type: 'hydrate', draft: initial});
    setHydrated(true);
  }, []);

  // Persistir cada cambio (después de la hidratación inicial).
  useEffect(() => {
    if (hydrated) saveDraft(draft);
  }, [draft, hydrated]);

  const stepId = STEP_ORDER[stepIdx];
  const totalSteps = STEP_ORDER.length;

  const goNext = () => setStepIdx((i) => Math.min(i + 1, totalSteps - 1));
  const goBack = () => setStepIdx((i) => Math.max(i - 1, 0));
  const goTo = (id: (typeof STEP_ORDER)[number]) => {
    const next = STEP_ORDER.indexOf(id);
    if (next >= 0) setStepIdx(next);
  };
  const resetAll = () => {
    if (typeof window !== 'undefined') {
      const ok = window.confirm(t('actions.clearAll') + '?');
      if (!ok) return;
    }
    dispatch({type: 'reset'});
    setStepIdx(0);
    setResults(null);
    setSearchError(null);
  };

  const doSearch = async () => {
    const body = {
      nombre: draft.identidad.nombre,
      apellido1: draft.identidad.apellido1,
      apellido2: draft.identidad.apellido2,
      provincia:
        draft.desaparicion.provincia ?? draft.identidad.provinciaNacimiento
    };
    setSearching(true);
    setSearchError(null);
    setResults(null);
    try {
      const res = await fetch('/api/buscar', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
      });
      const data = (await res.json()) as
        | {ok: true; results: SearchResult[]; total: number}
        | {ok: false; error: string};
      if (!data.ok) {
        setSearchError(data.error);
      } else {
        setResults(data.results);
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : String(err));
    } finally {
      setSearching(false);
    }
  };

  const canSearch =
    !!(draft.identidad.nombre ||
      draft.identidad.apellido1 ||
      draft.identidad.apellido2);

  const setField = (section: Section, field: string) => (value: string) =>
    dispatch({
      type: 'update',
      section,
      field,
      value: value.trim() === '' ? undefined : value
    });

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-12">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← {t('actions.back')}
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('title')}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">{t('intro')}</p>
        </header>

        <ProgressBar current={stepIdx + 1} total={totalSteps} label={t('progressLabel', {current: stepIdx + 1, total: totalSteps})} />

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-1 mb-5">
            <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {tStepName(stepId)}
            </span>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {t(`steps.${stepId}.title`)}
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {t(`steps.${stepId}.intro`)}
            </p>
          </div>

          {stepId === 'identidad' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label={tField('nombre')} value={draft.identidad.nombre ?? ''} onChange={setField('identidad', 'nombre')} />
              <TextField label={tField('apellido1')} value={draft.identidad.apellido1 ?? ''} onChange={setField('identidad', 'apellido1')} />
              <TextField label={tField('apellido2')} value={draft.identidad.apellido2 ?? ''} onChange={setField('identidad', 'apellido2')} />
              <TextField label={tField('apodo')} value={draft.identidad.apodo ?? ''} onChange={setField('identidad', 'apodo')} />
              <TextField
                label={tField('fechaNacimientoAprox')}
                hint={tField('fechaNacimientoHint')}
                value={draft.identidad.fechaNacimientoAprox ?? ''}
                onChange={setField('identidad', 'fechaNacimientoAprox')}
              />
              <TextField label={tField('profesion')} value={draft.identidad.profesion ?? ''} onChange={setField('identidad', 'profesion')} />
              <TextField label={tField('provinciaNacimiento')} value={draft.identidad.provinciaNacimiento ?? ''} onChange={setField('identidad', 'provinciaNacimiento')} />
              <TextField label={tField('municipioNacimiento')} value={draft.identidad.municipioNacimiento ?? ''} onChange={setField('identidad', 'municipioNacimiento')} />
            </div>
          )}

          {stepId === 'familia' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label={tField('padre')} value={draft.familia.padre ?? ''} onChange={setField('familia', 'padre')} />
              <TextField label={tField('madre')} value={draft.familia.madre ?? ''} onChange={setField('familia', 'madre')} />
              <TextField label={tField('conyuge')} value={draft.familia.conyuge ?? ''} onChange={setField('familia', 'conyuge')} />
              <TextField label={tField('estadoCivil')} value={draft.familia.estadoCivil ?? ''} onChange={setField('familia', 'estadoCivil')} />
              <div className="sm:col-span-2">
                <TextArea label={tField('hijos')} value={draft.familia.hijos ?? ''} onChange={setField('familia', 'hijos')} />
              </div>
            </div>
          )}

          {stepId === 'desaparicion' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label={tField('fechaAprox')} value={draft.desaparicion.fechaAprox ?? ''} onChange={setField('desaparicion', 'fechaAprox')} />
              <div />
              <TextField label={tField('provincia')} value={draft.desaparicion.provincia ?? ''} onChange={setField('desaparicion', 'provincia')} />
              <TextField label={tField('municipio')} value={draft.desaparicion.municipio ?? ''} onChange={setField('desaparicion', 'municipio')} />
              <div className="sm:col-span-2">
                <TextArea
                  label={tField('circunstancias')}
                  hint={tField('circunstanciasHint')}
                  value={draft.desaparicion.circunstancias ?? ''}
                  onChange={setField('desaparicion', 'circunstancias')}
                />
              </div>
              <div className="sm:col-span-2">
                <TextArea
                  label={tField('testimonios')}
                  hint={tField('testimoniosHint')}
                  value={draft.desaparicion.testimonios ?? ''}
                  onChange={setField('desaparicion', 'testimonios')}
                />
              </div>
            </div>
          )}

          {stepId === 'contexto' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                {t('steps.contexto.sensitivityNotice')}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label={tField('afiliacion')} value={draft.contexto.afiliacion ?? ''} onChange={setField('contexto', 'afiliacion')} />
                <SelectField
                  label={tField('bando')}
                  placeholder={t('placeholders.selectBando')}
                  value={draft.contexto.bando ?? ''}
                  onChange={(v) =>
                    dispatch({
                      type: 'update',
                      section: 'contexto',
                      field: 'bando',
                      value: v === '' ? undefined : (v as Bando)
                    })
                  }
                  options={[
                    {value: 'republicano', label: tBando('republicano')},
                    {value: 'nacional', label: tBando('nacional')},
                    {value: 'sin_definir', label: tBando('sin_definir')},
                    {value: 'desconocido', label: tBando('desconocido')}
                  ]}
                />
                <div className="sm:col-span-2">
                  <TextField label={tField('cargo')} value={draft.contexto.cargo ?? ''} onChange={setField('contexto', 'cargo')} />
                </div>
              </div>
            </div>
          )}

          {stepId === 'investigacion' && (
            <div className="flex flex-col gap-4">
              <TextArea label={tField('pistas')} value={draft.investigacion.pistas ?? ''} onChange={setField('investigacion', 'pistas')} />
              <TextArea label={tField('busquedasPrevias')} value={draft.investigacion.busquedasPrevias ?? ''} onChange={setField('investigacion', 'busquedasPrevias')} />
              <TextArea label={tField('hipotesis')} value={draft.investigacion.hipotesis ?? ''} onChange={setField('investigacion', 'hipotesis')} />
            </div>
          )}

          {stepId === 'resumen' && (
            <Summary
              draft={draft}
              onEdit={goTo}
              results={results}
              searching={searching}
              searchError={searchError}
            />
          )}
        </section>

        <p className="text-xs text-zinc-500 dark:text-zinc-500">
          {t('draft.savedLocally')}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={resetAll}
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            {t('actions.clearAll')}
          </button>

          <div className="flex gap-2">
            {stepIdx > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                {t('actions.back')}
              </button>
            )}
            {stepIdx < totalSteps - 1 && (
              <button
                type="button"
                onClick={goNext}
                className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {stepIdx === totalSteps - 2 ? t('actions.finish') : t('actions.next')}
              </button>
            )}
            {stepIdx === totalSteps - 1 && (
              <button
                type="button"
                onClick={doSearch}
                disabled={!canSearch || searching}
                className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
              >
                {searching ? t('search.searching') : t('actions.search')}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// ---------- Subcomponentes ----------

function ProgressBar({current, total, label}: {current: number; total: number; label: string}) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-zinc-500 dark:text-zinc-400">{label}</span>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full bg-zinc-900 transition-all dark:bg-zinc-100"
          style={{width: `${pct}%`}}
        />
      </div>
    </div>
  );
}

function TextField({
  label,
  hint,
  value,
  onChange
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
      {hint ? (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>
      ) : null}
    </label>
  );
}

function TextArea({
  label,
  hint,
  value,
  onChange
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {label}
      </span>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
      {hint ? (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>
      ) : null}
    </label>
  );
}

function SelectField({
  label,
  placeholder,
  value,
  onChange,
  options
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  options: {value: string; label: string}[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Summary({
  draft,
  onEdit,
  results,
  searching,
  searchError
}: {
  draft: FichaDraft;
  onEdit: (id: (typeof STEP_ORDER)[number]) => void;
  results: SearchResult[] | null;
  searching: boolean;
  searchError: string | null;
}) {
  const t = useTranslations('wizard');
  const tField = useTranslations('wizard.fields');
  const tBando = useTranslations('wizard.bando');
  const tStepName = useTranslations('wizard.stepNames');

  const sections: {id: 'identidad' | 'familia' | 'desaparicion' | 'contexto' | 'investigacion'; rows: {label: string; value: string | undefined}[]}[] = useMemo(
    () => [
      {
        id: 'identidad',
        rows: [
          {label: tField('nombre'), value: draft.identidad.nombre},
          {label: tField('apellido1'), value: draft.identidad.apellido1},
          {label: tField('apellido2'), value: draft.identidad.apellido2},
          {label: tField('apodo'), value: draft.identidad.apodo},
          {label: tField('fechaNacimientoAprox'), value: draft.identidad.fechaNacimientoAprox},
          {label: tField('provinciaNacimiento'), value: draft.identidad.provinciaNacimiento},
          {label: tField('municipioNacimiento'), value: draft.identidad.municipioNacimiento},
          {label: tField('profesion'), value: draft.identidad.profesion}
        ]
      },
      {
        id: 'familia',
        rows: [
          {label: tField('padre'), value: draft.familia.padre},
          {label: tField('madre'), value: draft.familia.madre},
          {label: tField('conyuge'), value: draft.familia.conyuge},
          {label: tField('estadoCivil'), value: draft.familia.estadoCivil},
          {label: tField('hijos'), value: draft.familia.hijos}
        ]
      },
      {
        id: 'desaparicion',
        rows: [
          {label: tField('fechaAprox'), value: draft.desaparicion.fechaAprox},
          {label: tField('provincia'), value: draft.desaparicion.provincia},
          {label: tField('municipio'), value: draft.desaparicion.municipio},
          {label: tField('circunstancias'), value: draft.desaparicion.circunstancias},
          {label: tField('testimonios'), value: draft.desaparicion.testimonios}
        ]
      },
      {
        id: 'contexto',
        rows: [
          {label: tField('afiliacion'), value: draft.contexto.afiliacion},
          {
            label: tField('bando'),
            value: draft.contexto.bando ? tBando(draft.contexto.bando) : undefined
          },
          {label: tField('cargo'), value: draft.contexto.cargo}
        ]
      },
      {
        id: 'investigacion',
        rows: [
          {label: tField('pistas'), value: draft.investigacion.pistas},
          {label: tField('busquedasPrevias'), value: draft.investigacion.busquedasPrevias},
          {label: tField('hipotesis'), value: draft.investigacion.hipotesis}
        ]
      }
    ],
    [draft, tField, tBando]
  );

  const tSearch = useTranslations('wizard.search');

  return (
    <div className="flex flex-col gap-6">
      {results === null && !searching && !searchError && (
        <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          {tSearch('hint')}
        </p>
      )}

      {searching && (
        <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          {tSearch('searching')}
        </p>
      )}

      {searchError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
          <strong>{tSearch('errorTitle')}:</strong> {searchError}
        </div>
      )}

      {results !== null && !searching && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
            {tSearch('resultsTitle', {count: results.length})}
          </h3>
          {results.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {tSearch('noResults')}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {results.map((r) => (
                <li
                  key={r.id}
                  className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {[r.nombre, r.apellido1, r.apellido2]
                          .filter(Boolean)
                          .join(' ') || '—'}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {[r.municipioNacimiento, r.provinciaNacimiento]
                          .filter(Boolean)
                          .join(', ')}
                        {r.fechaDesaparicionAprox
                          ? ` · ${r.fechaDesaparicionAprox}`
                          : ''}
                        {r.tipoCaso && r.tipoCaso !== 'otro' ? ` · ${r.tipoCaso}` : ''}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {tSearch('source')}: {r.fuenteNombre}
                        {r.fuenteOrganismo ? ` (${r.fuenteOrganismo})` : ''}
                      </span>
                    </div>
                    <span className="text-xs rounded-full bg-zinc-100 px-2 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {tSearch('score')} {(r.score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <a
                    href={r.fuenteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    {tSearch('viewSource')} →
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {sections.map((sec) => {
        const empty = !hasAnyValue(draft[sec.id] as Record<string, unknown>);
        return (
          <div key={sec.id} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
                {tStepName(sec.id)}
              </h3>
              <button
                type="button"
                onClick={() => onEdit(sec.id)}
                className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {t('actions.editStep')}
              </button>
            </div>
            {empty ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                {t('summary.empty')}
              </p>
            ) : (
              <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                {sec.rows
                  .filter((r) => r.value && r.value.trim() !== '')
                  .map((r) => (
                    <div key={r.label} className="flex flex-col">
                      <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                        {r.label}
                      </dt>
                      <dd className="text-sm text-zinc-800 dark:text-zinc-200">
                        {r.value}
                      </dd>
                    </div>
                  ))}
              </dl>
            )}
          </div>
        );
      })}
    </div>
  );
}
