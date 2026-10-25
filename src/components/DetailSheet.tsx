import { useEffect, useState } from 'react';
import { BY_ID, SECTIONS, catsOf, sectionOf, type CatId } from '../lib/categories';
import { dateText, money, parseMoney, pctText, plain } from '../lib/money';
import { donutOpts, stat, type AppState, type Tx } from '../lib/state';
import { Donut } from './Donut';
import { SheetHead, useActions } from './ui';

function TxRow({ tx, open, onToggle }: { tx: Tx; open: boolean; onToggle: () => void }) {
  const { updateTx, deleteTx, toast } = useActions();
  const [amt, setAmt] = useState(plain(tx.amt));
  const [cat, setCat] = useState<CatId>(tx.cat);
  const [err, setErr] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (open) {
      setAmt(plain(tx.amt));
      setCat(tx.cat);
      setErr(false);
      setArmed(false);
    }
  }, [open, tx.amt, tx.cat]);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  const up = tx.cat === 'ahorro';
  return (
    <div className="tx">
      <button className="tx-main" type="button" onClick={onToggle} aria-expanded={open}>
        <span className={`tx-amt ${up ? 'up' : ''}`}>
          {up ? '+' : ''}
          {money(tx.amt)}
        </span>
        <span className="tx-date">{dateText(tx.ts)}</span>
        <span className="tx-cat">{BY_ID[tx.cat].name}</span>
      </button>
      {open && (
        <div className="tx-edit">
          <span className={`money-in ${err ? 'err' : ''}`}>
            <span>$</span>
            <input
              id={`e-amt-${tx.id}`}
              inputMode="decimal"
              autoComplete="off"
              aria-label="Monto"
              value={amt}
              onChange={(e) => {
                setAmt(e.target.value);
                setErr(false);
              }}
            />
          </span>
          <select id={`e-cat-${tx.id}`} aria-label="Categoría" value={cat} onChange={(e) => setCat(e.target.value as CatId)}>
            {SECTIONS.map((s) => (
              <optgroup label={s.name} key={s.id}>
                {catsOf(s.id).map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <div className="tx-btns">
            <button
              type="button"
              className={`sm-btn del ${armed ? 'arm' : ''}`}
              onClick={() => {
                if (!armed) return setArmed(true);
                deleteTx(tx.id);
              }}
            >
              {armed ? '¿Seguro?' : 'Eliminar'}
            </button>
            <button type="button" className="sm-btn" onClick={onToggle}>
              Cancelar
            </button>
            <button
              type="button"
              className="sm-btn pri"
              onClick={() => {
                const v = parseMoney(amt);
                if (!(v && v > 0)) {
                  setErr(true);
                  toast('El monto debe ser mayor a $0');
                  return;
                }
                updateTx(tx.id, v, cat);
              }}
            >
              Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DetailSheet({ S, id }: { S: AppState; id: CatId }) {
  const { setBudget, openAdd, closeSheet, toast } = useActions();
  const c = BY_ID[id];
  const isSave = id === 'ahorro';
  const st = stat(S, id);
  const [draft, setDraft] = useState(plain(S.budgets[id] ?? 0));
  const [err, setErr] = useState(false);
  const [openTx, setOpenTx] = useState<string | null>(null);

  useEffect(() => {
    setDraft(plain(S.budgets[id] ?? 0));
    setErr(false);
    setOpenTx(null);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const txs = S.txs.filter((t) => t.cat === id).sort((a, b) => b.ts - a.ts);

  // Cierra el editor si el movimiento se movió o eliminó.
  useEffect(() => {
    if (openTx && !txs.some((t) => t.id === openTx)) setOpenTx(null);
  }, [txs, openTx]);

  const saveBudget = () => {
    const v = parseMoney(draft);
    if (v != null && isNaN(v)) {
      setErr(true);
      toast('Escribe un monto válido');
      return;
    }
    setErr(false);
    setBudget(id, v ?? 0);
    setDraft(plain(v ?? 0));
    (document.activeElement as HTMLElement | null)?.blur();
  };

  return (
    <>
      <SheetHead title={c.name} eyebrow={sectionOf(id).name} onClose={closeSheet} />
      <div className="detail-top">
        <Donut key={id} opts={donutOpts(S, id)} className="big" />
      </div>

      <div className="stats">
        {st.kind === 'save' ? (
          <>
            <div className="st">
              <small>Meta mensual</small>
              <b>{money(st.b)}</b>
            </div>
            <div className="st">
              <small>Aportado</small>
              <b>{money(st.s)}</b>
            </div>
            {st.over > 0 ? (
              <div className="st">
                <small>Superada por</small>
                <b className="up">+{money(st.over)}</b>
              </div>
            ) : (
              <div className="st">
                <small>Pendiente</small>
                <b>{money(st.pending)}</b>
              </div>
            )}
            <div className="st">
              <small>Completado</small>
              <b className={st.done ? 'up' : ''}>{st.b > 0 ? pctText(st.pct) : '—'}</b>
            </div>
          </>
        ) : (
          <>
            <div className="st">
              <small>Presupuesto</small>
              <b>{money(st.b)}</b>
            </div>
            <div className="st">
              <small>Gastado</small>
              <b>{money(st.s)}</b>
            </div>
            <div className="st">
              <small>Disponible</small>
              <b className={st.avail < 0 ? 'neg' : ''}>{money(st.avail)}</b>
            </div>
            <div className="st">
              <small>Utilizado</small>
              <b>{st.b > 0 ? pctText(st.pct) : '—'}</b>
            </div>
          </>
        )}
      </div>

      <div className="bedit">
        <label htmlFor="d-budget">{isSave ? 'Meta mensual' : 'Presupuesto del mes'}</label>
        <span className={`money-in ${err ? 'err' : ''}`}>
          <span>$</span>
          <input
            id="d-budget"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setErr(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveBudget();
            }}
          />
        </span>
        <button className="sm-btn pri" type="button" onClick={saveBudget}>
          Actualizar
        </button>
      </div>

      <button className="add-here" type="button" onClick={() => openAdd(id)}>
        + Registrar {isSave ? 'aportación' : 'gasto'} aquí
      </button>

      <h4>Movimientos</h4>
      <div className="txs">
        {txs.length === 0 ? (
          <p className="empty">Aún no hay movimientos en esta categoría.</p>
        ) : (
          txs.map((t) => <TxRow key={t.id} tx={t} open={openTx === t.id} onToggle={() => setOpenTx(openTx === t.id ? null : t.id)} />)
        )}
      </div>
    </>
  );
}
