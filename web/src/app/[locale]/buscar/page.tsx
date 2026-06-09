import {setRequestLocale} from 'next-intl/server';
import BuscarWizard from '@/components/buscar/BuscarWizard';

export default async function BuscarPage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  return <BuscarWizard />;
}
