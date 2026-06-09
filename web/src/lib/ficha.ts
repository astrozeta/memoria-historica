import {z} from 'zod';

// Schemas de los datos que el usuario rellena en el formulario guiado.
// Todos los campos son opcionales: la app debe permitir "no lo sé" en cada paso.

const trimToUndef = (v: unknown) =>
  typeof v === 'string' && v.trim() === '' ? undefined : v;

const optStr = z.preprocess(trimToUndef, z.string().trim().min(1).optional());

export const bandoEnum = z.enum([
  'republicano',
  'nacional',
  'sin_definir',
  'desconocido'
]);
export type Bando = z.infer<typeof bandoEnum>;

export const identidadSchema = z.object({
  nombre: optStr,
  apellido1: optStr,
  apellido2: optStr,
  apodo: optStr,
  fechaNacimientoAprox: optStr,
  provinciaNacimiento: optStr,
  municipioNacimiento: optStr,
  profesion: optStr
});

export const familiaSchema = z.object({
  padre: optStr,
  madre: optStr,
  conyuge: optStr,
  hijos: optStr,
  estadoCivil: optStr
});

export const desaparicionSchema = z.object({
  fechaAprox: optStr,
  provincia: optStr,
  municipio: optStr,
  circunstancias: optStr,
  testimonios: optStr
});

export const contextoSchema = z.object({
  afiliacion: optStr,
  bando: z.preprocess(trimToUndef, bandoEnum.optional()),
  cargo: optStr
});

export const investigacionSchema = z.object({
  pistas: optStr,
  busquedasPrevias: optStr,
  hipotesis: optStr
});

export const fichaDraftSchema = z.object({
  identidad: identidadSchema,
  familia: familiaSchema,
  desaparicion: desaparicionSchema,
  contexto: contextoSchema,
  investigacion: investigacionSchema
});

export type FichaDraft = z.infer<typeof fichaDraftSchema>;

export const emptyFichaDraft: FichaDraft = {
  identidad: {},
  familia: {},
  desaparicion: {},
  contexto: {},
  investigacion: {}
};

export const DRAFT_STORAGE_KEY = 'mh:ficha-draft:v1';

export type StepId =
  | 'identidad'
  | 'familia'
  | 'desaparicion'
  | 'contexto'
  | 'investigacion'
  | 'resumen';

export const STEP_ORDER: StepId[] = [
  'identidad',
  'familia',
  'desaparicion',
  'contexto',
  'investigacion',
  'resumen'
];

export function hasAnyValue(obj: Record<string, unknown>): boolean {
  return Object.values(obj).some(
    (v) => v !== undefined && v !== null && String(v).trim() !== ''
  );
}
