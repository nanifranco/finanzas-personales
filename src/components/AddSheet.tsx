import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { BY_ID, CATEGORIES, catVars, type CatId } from '../lib/categories';
import { money, parseMoney } from '../lib/money';
import { stat, type AppState } from '../lib/state';
import { BackspaceIcon, CatIcon } from './Icon';
import { SheetHead, useActions } from './ui';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];
const intFmt = new Intl.NumberFormat('es-MX');

/** Aplica una tecla al texto del monto: máx. 8 enteros y 2 decimales. */
export function pressKey(s: string, k: string): string {
  if (k === 'del') return s.slice(0, -1);
  if (k === '.') return s.includes('.') ? s : (s || '0') + '.';
  if (s.includes('.')) {
    if (s.split('.')[1].length >= 2) return s;
  } else if (s.replace(/^0+/, '').length >= 8) return s;
  return s === '0' ? k : s + k;
}

export function AddSheet({ S, preset, active }: { S: AppState; preset: CatId | null; active: boolean }) {
  const { addTx, closeSheet } = useActions();
  const [amt, setAmt] = useState('');
  const [cat, setCat] = useState<CatId | null>(preset);

  const cents = parseMoney(amt) || 0;
  const canSave = cents > 0 && !!cat;

  const save = useCallback(() => {
    if (!canSave || !cat) return;
    addTx(cat, cents);
  }, [canSave, cat, cents, addTx]);

  // Teclado físico (útil en computadora).
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (/^[0-9]$/.test(e.key)) setAmt((s) => pressKey(s, e.key));
      else if (e.key === '.' || e.key === ',') setAmt((s) => pressKey(s, '.'));
      else if (e.key === 'Backspace') setAmt((s) => pressKey(s, 'del'));
      else if (e.key === 'Enter') save();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, save]);

  const [ip, dec] = amt.split('.');
  const display = intFmt.format(parseInt(ip || '0', 10) || 0) + (dec !== undefined ? '.' + dec : '');

  let hint: JSX.Element | string = 'Elige una categoría';
  if (cat) {
    const st = stat(S, cat);
    if (st.kind === 'save') {
      const after = st.s + cents - st.b;
      hint = (
        <>
          <b>Aportación</b> · {after > 0 ? <>quedarías <b>+{money(after)}</b> sobre la meta</> : <>faltarían <b>{money(-after)}</b></>}
        </>
      );
    } else {
      const av = st.avail - cents;
      hint = (
        <>
          <b>{BY_ID[cat].name}</b> · te quedarían <span className={av < 0 ? 'neg' : ''}>{money(av)}</span>
        </>
      );
    }
  }

  return (
    <>
      <SheetHead title="Nuevo movimiento" onClose={closeSheet} />
      <div className="amt-display" aria-live="polite">
        <span className="cur">$</span>
        <span className={`a-num ${amt ? '' : 'zero'}`}>{display}</span>
      </div>
      <div className="a-hint">{hint}</div>

      <div className={`tiles ${cat ? 'has' : ''}`}>
        {CATEGORIES.map((c) => {
          const st = stat(S, c.id);
          const on = c.id === cat;
          let ta: string;
          let neg = false;
          if (st.kind === 'save') {
            ta = st.b === 0 && st.s === 0 ? 'Sin meta' : st.over > 0 ? `+${money(st.over)} sobre la meta` : `Faltan ${money(st.pending)}`;
          } else {
            const av = on ? st.avail - cents : st.avail;
            ta = st.b === 0 && st.s === 0 && !on ? 'Sin presupuesto' : money(av);
            neg = av < 0;
          }
          return (
            <button
              key={c.id}
              type="button"
              className={`tile ${c.id === 'ahorro' ? 'wide' : ''} ${on ? 'on' : ''}`}
              style={catVars(c) as CSSProperties}
              onClick={() => setCat(c.id)}
              aria-pressed={on}
            >
              <span className="ic">
                <CatIcon id={c.id} />
              </span>
              <span className="tt">
                <span className="tn">{c.short}</span>
                <span className={`ta ${neg ? 'neg' : ''}`}>{ta}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="keypad">
        {KEYS.map((k) => (
          <button key={k} type="button" className="key" aria-label={k === 'del' ? 'Borrar' : k} onClick={() => setAmt((s) => pressKey(s, k))}>
            {k === 'del' ? <BackspaceIcon /> : k}
          </button>
        ))}
      </div>
      <button className="btn primary full" type="button" disabled={!canSave} onClick={save}>
        Guardar
      </button>
    </>
  );
}
