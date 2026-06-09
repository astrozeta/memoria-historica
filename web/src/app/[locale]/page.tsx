import {getTranslations, setRequestLocale} from 'next-intl/server';
import {Link} from '@/i18n/navigation';

export default async function Home({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const tSite = await getTranslations('site');

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-3xl flex flex-col gap-10">
        <header className="flex flex-col gap-3 text-center sm:text-left">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {tSite('name')}
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            {tSite('tagline')}
          </p>
        </header>

        <p className="text-base leading-7 text-zinc-700 dark:text-zinc-300">
          {t('intro')}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/buscar"
            className="group flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
          >
            <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {t('ctaSearchTitle')}
            </span>
            <span className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {t('ctaSearchDescription')}
            </span>
          </Link>

          <Link
            href="/guia"
            className="group flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
          >
            <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              {t('ctaGuideTitle')}
            </span>
            <span className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {t('ctaGuideDescription')}
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
