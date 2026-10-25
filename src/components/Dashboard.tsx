import { useEffect, useRef, type CSSProperties } from 'react';
import { BY_ID, SECTIONS, catVars, catsOf, type CatId } from '../lib/categories';
import { money, monthName, pctText } from '../lib/money';
import { donutOpts, stat, totals, type AppState } from '../lib/state';
import { Donut, useTweenMoney } from './Donut';
import { CatIcon } from './Icon';
import { useActions } from './ui';

export interface Bump {
  cat: CatId | null;
  n: number;
}

function Card({ S, id, wide, bump }: { S: AppState; id: CatId; wide: boolean; bump: Bump }) {
  const { openDetail } = useActions();
  const c = BY_ID[id];
  const st = stat(S, id);
  const o = donutOpts(S, id);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (bump.cat !== id || !ref.current) return;
    const el = ref.current;
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }, [bump.n, bump.cat, id]);

  let meta;
  if (st.kind === 'save') {
    meta = (
      <>
        <div className="sv-list">
          <div>
            <span>Meta</span>
            <b className="num">{money(st.b)}</b>
          </div>
          <div>
            <span>Aportado</span>
            <b className="num">{money(st.s)}</b>
          </div>
          {st.over > 0 ? (
            <div className="up">
              <span>Superada por</span>
              <b className="num">+{money(st.over)}</b>
            </div>
          ) : (
            <div>
              <span>Pendiente</span>
              <b className="num">{money(st.pending)}</b>
            </div>
          )}
        </div>
        {st.b > 0 && <span className="tag">{pctText(st.pct)} completado</span>}
      </>
    );
  } else {
    const of = st.b === 0 && st.s === 0 ? 'Sin presupuesto' : `${money(st.s)} de ${money(st.b)}`;
    meta = (
      <>
        <span className="of">{of}</span>
        <span className="tag">{st.tone === 'limit' ? 'Límite' : pctText(st.pct)}</span>
      </>
    );
  }

  return (
    <button
      ref={ref}
      type="button"
      className={`card ${wide ? 'wide' : ''} ${id === 'ahorro' ? 'save' : ''}`}
      data-tone={o.tone}
      style={catVars(c) as CSSProperties}
      onClick={() => openDetail(id)}
    >
      <div className="name">
        <span className="cic">
          <CatIcon id={id} />
        </span>
        {c.name}
      </div>
      <Donut opts={o} />
      <div className="meta">{meta}</div>
    </button>
  );
}

function SectionSum({ S, sec }: { S: AppState; sec: 'fijos' | 'variables' }) {
  const a = catsOf(sec).reduce((acc, c) => {
    const st = stat(S, c.id);
    return st.kind === 'spend' ? acc + st.avail : acc;
  }, 0);
  return (
    <span className="sec-sum">
      Disponible <b className="num">{money(a)}</b>
    </span>
  );
}

export function Dashboard({
  S,
  bump,
  storageNote
}: {
  S: AppState;
  bump: Bump;
  storageNote: { bad: boolean; text: string };
}) {
  const { openBudgets, setClosing } = useActions();
  const T = totals(S);
  const avail = useTweenMoney(T.avail);
  const budget = useTweenMoney(T.b);
  const spent = useTweenMoney(T.s);
  const contrib = useTweenMoney(T.contrib);
  const used = T.b > 0 ? T.s / T.b : T.s > 0 ? 1 : 0;
  const barColor = T.s > T.b ? 'var(--over)' : used >= 0.8 ? 'var(--warn)' : 'var(--ok)';

  return (
    <section className="view">
      <header className="top">
        <div className="month">
          <small>Mes en curso</small>
          <span>{monthName(S.monthStart ?? Date.now())}</span>
        </div>
        <button className="pill" type="button" onClick={openBudgets}>
          Presupuestos
        </button>
      </header>

      <div className="hero">
        <div>
          <div className="hero-l">Disponible para gastar</div>
          <div className={`hero-amt num ${T.avail < 0 ? 'neg' : ''}`}>{avail}</div>
        </div>
        <div className="bar" aria-hidden="true">
          <i style={{ width: Math.min(used, 1) * 100 + '%', background: barColor }} />
        </div>
        <div className="hero-stats">
          <div className="hs">
            <small>Presupuesto de gastos</small>
            <b className="num">{budget}</b>
          </div>
          <div className="hs">
            <small>Total gastado</small>
            <b className="num">{spent}</b>
          </div>
          <div className="hs hs-save">
            <div className="row">
              <small>Ahorro e inversión</small>
              <small>{T.goal > 0 ? pctText(T.pct) : ''}</small>
            </div>
            <div className="row">
              <b className="num">{contrib}</b>
              <small>{T.goal > 0 ? 'de ' + money(T.goal) : 'Sin meta definida'}</small>
            </div>
            <div className="bar" aria-hidden="true">
              <i style={{ width: Math.min(T.pct, 1) * 100 + '%' }} />
            </div>
          </div>
        </div>
        <div className="plan">Plan total del mes: {money(T.b + T.goal)} (gastos + meta de ahorro)</div>
      </div>

      {SECTIONS.map((sec) => {
        const cats = catsOf(sec.id);
        return (
          <section className="sec" key={sec.id}>
            <div className="sec-head">
              <h2>{sec.name}</h2>
              {sec.id !== 'ahorro' && <SectionSum S={S} sec={sec.id} />}
            </div>
            <div className="grid">
              {cats.map((c, i) => (
                <Card
                  key={c.id}
                  S={S}
                  id={c.id}
                  bump={bump}
                  wide={sec.id === 'ahorro' || (cats.length % 2 === 1 && i === cats.length - 1)}
                />
              ))}
            </div>
          </section>
        );
      })}

      <div className="endbar">
        <button className="btn line" type="button" onClick={() => setClosing(true)}>
          Cerrar mes
        </button>
        <p className={`storage ${storageNote.bad ? 'bad' : ''}`}>{storageNote.text}</p>
      </div>
    </section>
  );
}
