export type SectionId = 'fijos' | 'variables' | 'ahorro';
export type CatId =
  | 'psicologa'
  | 'canto'
  | 'suscripciones'
  | 'deporte'
  | 'restaurantes'
  | 'entretenimiento'
  | 'personales'
  | 'extras'
  | 'taller'
  | 'ahorro';

export interface Section {
  id: SectionId;
  name: string;
  short: string;
}

export interface Category {
  id: CatId;
  name: string;
  short: string;
  sec: SectionId;
  color: string;
}

export const SECTIONS: Section[] = [
  { id: 'fijos', name: 'Gastos fijos', short: 'Fijos' },
  { id: 'variables', name: 'Gastos variables', short: 'Variables' },
  { id: 'ahorro', name: 'Ahorro e inversión', short: 'Ahorro' }
];

/** Las diez categorías son fijas: no se agregan, eliminan ni renombran desde la app. */
export const CATEGORIES: Category[] = [
  { id: 'psicologa', name: 'Psicóloga', short: 'Psicóloga', sec: 'fijos', color: '#C9A7FF' },
  { id: 'canto', name: 'Clases de canto', short: 'Canto', sec: 'fijos', color: '#F5A9D6' },
  { id: 'suscripciones', name: 'Suscripciones', short: 'Suscripciones', sec: 'fijos', color: '#7FC9FF' },
  { id: 'deporte', name: 'Clases de deporte', short: 'Deporte', sec: 'fijos', color: '#9FE38F' },
  { id: 'restaurantes', name: 'Restaurantes y comidas', short: 'Restaurantes', sec: 'variables', color: '#EAD57C' },
  { id: 'entretenimiento', name: 'Entretenimiento y salidas', short: 'Salidas', sec: 'variables', color: '#A9B2FF' },
  { id: 'personales', name: 'Gastos personales', short: 'Personales', sec: 'variables', color: '#6FDFD7' },
  { id: 'extras', name: 'Ocasionales o extras', short: 'Extras', sec: 'variables', color: '#C3CBDD' },
  { id: 'taller', name: 'Proyectos o taller', short: 'Taller', sec: 'variables', color: '#DCC39C' },
  { id: 'ahorro', name: 'Fondo de emergencia e inversiones', short: 'Fondo e inversiones', sec: 'ahorro', color: '#79D7B5' }
];

export const BY_ID: Record<CatId, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<CatId, Category>;

export const SPENDING: Category[] = CATEGORIES.filter((c) => c.sec !== 'ahorro');

export const catsOf = (sec: SectionId) => CATEGORIES.filter((c) => c.sec === sec);
export const sectionOf = (id: CatId) => SECTIONS.find((s) => s.id === BY_ID[id].sec)!;

export function soft(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Variables CSS de color por categoría (--cc color, --cs color suave). */
export function catVars(c: Category): Record<string, string> {
  return { '--cc': c.color, '--cs': soft(c.color, 0.16) };
}
