/** Todas las cantidades se guardan en centavos (enteros) para evitar errores de punto flotante. */

const nf0 = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** $1,500 · $1,500.50 · -$100 · +$500 (con plus) */
export function money(cents: number, opts: { plus?: boolean } = {}): string {
  const neg = cents < 0;
  const a = Math.abs(cents);
  const txt = (a % 100 !== 0 ? nf2 : nf0).format(a / 100);
  return (neg ? '-' : opts.plus && cents > 0 ? '+' : '') + '$' + txt;
}

/** Convierte texto del usuario a centavos. null = vacío, NaN = inválido. */
export function parseMoney(input: string | null | undefined): number | null {
  if (input == null) return null;
  const s = String(input).replace(/[\s$,]/g, '');
  if (s === '') return null;
  if (!/^\d*\.?\d{0,2}$/.test(s)) return NaN;
  const v = parseFloat(s);
  if (isNaN(v)) return NaN;
  return Math.round(v * 100);
}

/** Valor para un campo editable: 1,500 o 1,500.50; vacío si es 0. */
export function plain(cents: number): string {
  if (!cents) return '';
  return (cents % 100 !== 0 ? nf2 : nf0).format(cents / 100);
}

export function pctText(p: number): string {
  return p === Infinity ? '—' : Math.round(p * 100) + '%';
}

const df = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const dateText = (ts: number) => df.format(new Date(ts));

export function monthName(ts: number): string {
  const s = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(new Date(ts));
  return s.charAt(0).toUpperCase() + s.slice(1);
}
