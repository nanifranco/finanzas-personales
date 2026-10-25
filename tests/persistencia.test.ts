import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { closeDb, loadState, saveState } from '../src/lib/db';
import { freshState, spendStat, saveStat, totals, uid, type AppState } from '../src/lib/state';
import { money, parseMoney } from '../src/lib/money';
import { pressKey } from '../src/components/AddSheet';

function mes(): AppState {
  const s = freshState();
  s.started = true;
  s.monthStart = Date.now();
  s.budgets = { restaurantes: 50000, psicologa: 150000, ahorro: 500000 };
  s.txs = [
    { id: uid(), cat: 'restaurantes', amt: 60000, ts: Date.now() },
    { id: uid(), cat: 'psicologa', amt: 60000, ts: Date.now() },
    { id: uid(), cat: 'ahorro', amt: 300000, ts: Date.now() }
  ];
  return s;
}

describe('persistencia en IndexedDB', () => {
  it('conserva movimientos y presupuestos al cerrar y volver a abrir', async () => {
    const s = mes();
    await saveState(s);
    await closeDb(); // simula cerrar la app
    const back = await loadState();
    expect(back.txs).toHaveLength(3);
    expect(back.budgets.restaurantes).toBe(50000);
    expect(back.started).toBe(true);
  });

  it('conserva ediciones y eliminaciones', async () => {
    const s = await loadState();
    s.txs = s.txs.filter((t) => t.cat !== 'psicologa');
    s.budgets.restaurantes = 100000;
    await saveState(s);
    await closeDb();
    const back = await loadState();
    expect(back.txs).toHaveLength(2);
    expect(back.budgets.restaurantes).toBe(100000);
  });

  it('el reset deja todo en cero y guarda los presupuestos previos', async () => {
    const s = await loadState();
    const r: AppState = { ...s, prevBudgets: { ...s.budgets }, budgets: {}, txs: [], started: false, closing: false, monthStart: null };
    await saveState(r);
    await closeDb();
    const back = await loadState();
    expect(back.txs).toHaveLength(0);
    expect(back.started).toBe(false);
    expect(back.prevBudgets.restaurantes).toBe(100000);
  });
});

describe('cálculos', () => {
  it('saldo negativo visible, sin topes en cero', () => {
    const st = spendStat(mes(), 'restaurantes');
    expect(st.avail).toBe(-10000);
    expect(money(st.avail)).toBe('-$100');
    expect(st.tone).toBe('over');
    expect(st.fill).toBe(1);
  });
  it('umbrales de color', () => {
    const s = freshState();
    s.budgets = { canto: 100000, deporte: 100000, extras: 100000 };
    s.txs = [
      { id: '1', cat: 'canto', amt: 79000, ts: 0 },
      { id: '2', cat: 'deporte', amt: 80000, ts: 0 },
      { id: '3', cat: 'extras', amt: 100000, ts: 0 }
    ];
    expect(spendStat(s, 'canto').tone).toBe('ok');
    expect(spendStat(s, 'deporte').tone).toBe('warn');
    expect(spendStat(s, 'extras').tone).toBe('limit');
  });
  it('ahorro: pendiente y excedente', () => {
    const s = mes();
    expect(saveStat(s).pending).toBe(200000);
    s.txs.push({ id: 'x', cat: 'ahorro', amt: 250000, ts: 0 });
    const sv = saveStat(s);
    expect(sv.pending).toBe(0);
    expect(sv.over).toBe(50000);
  });
  it('total disponible incluye saldos negativos', () => {
    const t = totals(mes());
    expect(t.b).toBe(200000);
    expect(t.s).toBe(120000);
    expect(t.avail).toBe(80000);
  });
  it('entrada de montos', () => {
    expect(parseMoney('1,500.50')).toBe(150050);
    expect(Number.isNaN(parseMoney('12.345'))).toBe(true);
    let a = '';
    for (const k of ['1', '2', '.', '5', '0', '9']) a = pressKey(a, k);
    expect(a).toBe('12.50');
    expect(money(150050)).toBe('$1,500.50');
  });
});
