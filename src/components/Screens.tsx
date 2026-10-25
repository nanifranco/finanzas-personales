import { useState, type CSSProperties, type FormEvent } from 'react';
import { BY_ID, catVars, catsOf, type CatId } from '../lib/categories';
import { money, monthName } from '../lib/money';
import { saveStat, spendStat, totals, type AppState } from '../lib/state';
import { BudgetFields, draftFrom, readDraft, type BudgetDraft } from './BudgetFields';
import { CatIcon } from './Icon';
import { SheetHead, useActions } from './ui';

const dayFmt = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
const timeFmt = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' });
const dayKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/** Desglose de todos los movimientos del mes, agrupados por día, para cotejar con el estado de cuenta. */
function Breakdown({ S }: { S: AppState }) {
  const txs = [...S.txs].sort((a, b) => a.ts - b.ts);
  if (txs.length === 0) return <p className="empty">No registraste movimientos este mes.</p>;

  const days: { key: string; ts: number; items: typeof txs }[] = [];
  for (const t of txs) {
    const k = dayKey(t.ts);
    const last = days[days.length - 1];
    if (last && last.key === k) last.items.push(t);
    else days.push({ key: k, ts: t.ts, items: [t] });
  }

  return (
    <div className="bd">
      {days.map((d) => {
        const spent = d.items.reduce((a, t) => (t.cat === 'ahorro' ? a : a + t.amt), 0);
        const label = dayFmt.format(new Date(d.ts));
        return (
          <div className="bd-day" key={d.key}>
            <div className="bd-head">
              <span>{label.charAt(0).toUpperCase() + label.slice(1)}</span>
              {spent > 0 && <span className="num">{money(spent)}</span>}
            </div>
            <div className="cl-card">
              {d.items.map((t) => {
                const c = BY_ID[t.cat];
                const up = t.cat === 'ahorro';
                return (
                  <div className="bd-row" key={t.id} style={catVars(c) as CSSProperties}>
                    <span className="cic">
                      <CatIcon id={t.cat} />
                    </span>
                    <span className="bd-txt">
                      <span className="bd-cat">{c.name}</span>
                      <span className="bd-time">{timeFmt.format(new Date(t.ts))}</span>
                    </span>
                    <b className={`bd-amt num ${up ? 'up' : ''}`}>
                      {up ? '+' : ''}
                      {money(t.amt)}
                    </b>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Setup({ S }: { S: AppState }) {
  const { startMonth, toast } = useActions();
  const [draft, setDraft] = useState<BudgetDraft>(() => draftFrom({}));
  const [bad, setBad] = useState<CatId[]>([]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = readDraft(draft);
    if (!r.ok) {
      setBad(r.bad);
      document.getElementById('su-' + r.bad[0])?.focus();
      toast('Revisa el monto marcado en rojo');
      return;
    }
    startMonth(r.values);
  };

  return (
    <section className="view">
      <div className="setup-head">
        <div className="eyebrow">{monthName(Date.now())}</div>
        <h1>¿Cuánto planeas para cada categoría?</h1>
        <p>Escribe el presupuesto de este mes. Puedes cambiar cualquier monto después, aunque ya tengas gastos registrados.</p>
      </div>
      <form onSubmit={submit} noValidate>
        <BudgetFields
          prefix="su"
          draft={draft}
          bad={bad}
          hints={S.prevBudgets}
          onChange={(d) => {
            setDraft(d);
            setBad([]);
          }}
        />
        <div className="setup-foot">
          <button className="btn primary" type="submit">
            Comenzar el mes
          </button>
        </div>
      </form>
    </section>
  );
}

export function BudgetsSheet({ S }: { S: AppState }) {
  const { setBudgets, closeSheet, toast } = useActions();
  const [draft, setDraft] = useState<BudgetDraft>(() => draftFrom(S.budgets));
  const [bad, setBad] = useState<CatId[]>([]);
  return (
    <>
      <SheetHead title="Presupuestos" eyebrow={monthName(S.monthStart ?? Date.now())} onClose={closeSheet} />
      <BudgetFields
        prefix="eb"
        draft={draft}
        bad={bad}
        onChange={(d) => {
          setDraft(d);
          setBad([]);
        }}
      />
      <div className="setup-foot">
        <button
          className="btn primary"
          type="button"
          onClick={() => {
            const r = readDraft(draft);
            if (!r.ok) {
              setBad(r.bad);
              toast('Revisa el monto marcado en rojo');
              return;
            }
            setBudgets(r.values);
          }}
        >
          Guardar presupuestos
        </button>
      </div>
    </>
  );
}

function Row({ name, total, cols }: { name: string; total?: boolean; cols: [string, string, string?][] }) {
  return (
    <div className={`cl-row ${total ? 'total' : ''}`}>
      <div className="cl-name">{name}</div>
      <div className="cl-nums">
        {cols.map(([label, value, cls]) => (
          <div key={label}>
            <small>{label}</small>
            <b className={cls ?? ''}>{value}</b>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Closing({ S }: { S: AppState }) {
  const { setClosing, resetMonth, confirm } = useActions();
  const [copied, setCopied] = useState(false);
  const [showTx, setShowTx] = useState(false);
  const T = totals(S);
  const sv = saveStat(S);

  return (
    <section className="view">
      <div className="cl-head">
        <div className="eyebrow">{monthName(S.monthStart ?? Date.now())}</div>
        <h1>Cierre del mes</h1>
        <p>Copia estos resultados a tu archivo de finanzas. Nada se borra hasta que tú lo confirmes.</p>
      </div>

      {(['fijos', 'variables'] as const).map((sid) => {
        let tb = 0;
        let ts = 0;
        const rows = catsOf(sid).map((c) => {
          const st = spendStat(S, c.id);
          tb += st.b;
          ts += st.s;
          return (
            <Row
              key={c.id}
              name={c.name}
              cols={[
                ['Presupuesto', money(st.b)],
                ['Gastado', money(st.s)],
                ['Saldo final', money(st.avail), st.avail < 0 ? 'neg' : '']
              ]}
            />
          );
        });
        return (
          <div className="cl-sec" key={sid}>
            <h3>{sid === 'fijos' ? 'Gastos fijos' : 'Gastos variables'}</h3>
            <div className="cl-card">
              {rows}
              <Row
                total
                name={'Subtotal ' + sid}
                cols={[
                  ['Presupuesto', money(tb)],
                  ['Gastado', money(ts)],
                  ['Saldo', money(tb - ts), tb - ts < 0 ? 'neg' : '']
                ]}
              />
            </div>
          </div>
        );
      })}

      <div className="cl-sec">
        <h3>Total de gastos</h3>
        <div className="cl-card">
          <Row
            total
            name="Todos los gastos"
            cols={[
              ['Presupuesto', money(T.b)],
              ['Gastado', money(T.s)],
              ['Saldo final', money(T.avail), T.avail < 0 ? 'neg' : '']
            ]}
          />
        </div>
      </div>

      <div className="cl-sec">
        <h3>Ahorro e inversión</h3>
        <div className="cl-card">
          <Row
            name={BY_ID.ahorro.name}
            cols={[
              ['Meta', money(sv.b)],
              ['Aportado', money(sv.s)],
              sv.over > 0 ? ['Superada por', '+' + money(sv.over), 'up'] : ['Pendiente', money(sv.pending)]
            ]}
          />
        </div>
      </div>

      <div className="cl-sec">
        <button className="bd-toggle" type="button" aria-expanded={showTx} onClick={() => setShowTx((v) => !v)}>
          <span>{showTx ? 'Ocultar desglose de movimientos' : 'Ver desglose de movimientos'}</span>
          <span className="bd-count">{S.txs.length}</span>
        </button>
        {showTx && <Breakdown S={S} />}
      </div>

      <label className="check" htmlFor="cl-ok">
        <input id="cl-ok" type="checkbox" checked={copied} onChange={(e) => setCopied(e.target.checked)} />
        Ya copié mis resultados
      </label>
      <div className="setup-foot">
        <button
          className="btn danger"
          type="button"
          disabled={!copied}
          onClick={() =>
            confirm({
              title: '¿Resetear el mes?',
              body: 'Se borrarán todos los gastos y aportaciones de este mes y las donas volverán a cero. Las categorías se conservan. Esto no se puede deshacer.',
              ok: 'Resetear mes',
              onOk: resetMonth
            })
          }
        >
          Resetear mes
        </button>
        <button className="btn line" type="button" onClick={() => setClosing(false)}>
          Volver al mes
        </button>
      </div>
    </section>
  );
}
