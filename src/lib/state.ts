import { BY_ID, SPENDING, type CatId } from './categories';

export interface Tx {
  id: string;
  cat: CatId;
  /** centavos, siempre > 0 */
  amt: number;
  ts: number;
}

export interface AppState {
  v: 1;
  started: boolean;
  monthStart: number | null;
  budgets: Partial<Record<CatId, number>>;
  txs: Tx[];
  closing: boolean;
  prevBudgets: Partial<Record<CatId, number>>;
}

export const freshState = (): AppState => ({
  v: 1,
  started: false,
  monthStart: null,
  budgets: {},
  txs: [],
  closing: false,
  prevBudgets: {}
});

/** Acepta solo datos con la forma esperada; descarta movimientos corruptos o de categorías desconocidas. */
export function sanitize(raw: unknown): AppState {
  const base = freshState();
  if (!raw || typeof raw !== 'object' || (raw as AppState).v !== 1) return base;
  const r = raw as AppState;
  const cleanBudgets = (b: unknown) => {
    const out: Partial<Record<CatId, number>> = {};
    if (b && typeof b === 'object') {
      for (const [k, v] of Object.entries(b)) {
        if (k in BY_ID && Number.isFinite(v) && (v as number) >= 0) out[k as CatId] = Math.round(v as number);
      }
    }
    return out;
  };
  return {
    v: 1,
    started: !!r.started,
    monthStart: typeof r.monthStart === 'number' ? r.monthStart : null,
    budgets: cleanBudgets(r.budgets),
    txs: Array.isArray(r.txs)
      ? r.txs.filter(
          (t) => t && typeof t.id === 'string' && t.cat in BY_ID && Number.isFinite(t.amt) && t.amt > 0 && Number.isFinite(t.ts)
        )
      : [],
    closing: !!r.closing,
    prevBudgets: cleanBudgets(r.prevBudgets)
  };
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/* ---------- Cálculos ---------- */

export type Tone = 'ok' | 'warn' | 'limit' | 'over' | 'empty' | 'save';

export interface SpendStat {
  kind: 'spend';
  b: number;
  s: number;
  avail: number;
  pct: number;
  fill: number;
  tone: Tone;
}
export interface SaveStat {
  kind: 'save';
  b: number;
  s: number;
  pending: number;
  over: number;
  pct: number;
  fill: number;
  tone: Tone;
  done: boolean;
}

export const spentOf = (S: AppState, id: CatId) => S.txs.reduce((a, t) => (t.cat === id ? a + t.amt : a), 0);

export function stat(S: AppState, id: CatId): SpendStat | SaveStat {
  const b = S.budgets[id] ?? 0;
  const s = spentOf(S, id);
  if (id === 'ahorro') {
    const pct = b > 0 ? s / b : s > 0 ? 1 : 0;
    return {
      kind: 'save',
      b,
      s,
      pending: Math.max(b - s, 0),
      over: Math.max(s - b, 0),
      pct,
      fill: Math.min(pct, 1),
      tone: b === 0 && s === 0 ? 'empty' : 'save',
      done: b > 0 && s >= b
    };
  }
  const pct = b > 0 ? s / b : s > 0 ? Infinity : 0;
  let tone: Tone;
  if (s > b) tone = 'over';
  else if (b === 0) tone = 'empty';
  else if (s === b) tone = 'limit';
  else if (pct >= 0.8) tone = 'warn';
  else tone = 'ok';
  return { kind: 'spend', b, s, avail: b - s, pct, fill: Math.min(pct, 1), tone };
}

export function spendStat(S: AppState, id: CatId): SpendStat {
  return stat(S, id) as SpendStat;
}
export function saveStat(S: AppState): SaveStat {
  return stat(S, 'ahorro') as SaveStat;
}

export function totals(S: AppState) {
  let b = 0;
  let s = 0;
  for (const c of SPENDING) {
    b += S.budgets[c.id] ?? 0;
    s += spentOf(S, c.id);
  }
  const sv = saveStat(S);
  return { b, s, avail: b - s, goal: sv.b, contrib: sv.s, pct: sv.pct };
}

export interface DonutOpts {
  fill: number;
  tone: Tone;
  cents: number;
  label: string;
  color?: string;
  plus?: boolean;
  done?: boolean;
}

export function donutOpts(S: AppState, id: CatId): DonutOpts {
  const st = stat(S, id);
  const color = BY_ID[id].color;
  if (st.kind === 'save') {
    if (st.tone === 'empty') return { fill: 0, tone: 'empty', cents: 0, label: 'sin meta' };
    return {
      color,
      fill: st.fill,
      tone: 'save',
      done: st.done,
      plus: st.over > 0,
      cents: st.over > 0 ? st.over : st.pending,
      label: st.over > 0 ? 'sobre la meta' : st.done ? 'meta cumplida' : 'por aportar'
    };
  }
  return {
    color,
    fill: st.fill,
    tone: st.tone,
    cents: st.avail,
    label: st.tone === 'empty' ? 'sin presupuesto' : 'disponible'
  };
}
