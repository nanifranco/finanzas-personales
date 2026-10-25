import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BY_ID, type CatId } from './lib/categories';
import { isStandalone, loadState, requestPersistence, saveState } from './lib/db';
import { money } from './lib/money';
import { uid, type AppState } from './lib/state';
import { AddSheet } from './components/AddSheet';
import { Dashboard, type Bump } from './components/Dashboard';
import { DetailSheet } from './components/DetailSheet';
import { PlusIcon } from './components/Icon';
import { BudgetsSheet, Closing, Setup } from './components/Screens';
import { ActionsCtx, ConfirmModal, Sheet, Toast, type Actions, type ConfirmOpts } from './components/ui';

type SheetState = { kind: 'add'; cat: CatId | null; n: number } | { kind: 'detail'; cat: CatId; n: number } | { kind: 'budgets'; n: number };

export default function App() {
  const [S, setS] = useState<AppState | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saveOK, setSaveOK] = useState(true);
  const [persisted, setPersisted] = useState(false);
  const loaded = useRef(false);
  const sRef = useRef<AppState | null>(null);
  sRef.current = S;

  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeTimer = useRef<number>();
  const [confirmOpts, setConfirmOpts] = useState<ConfirmOpts | null>(null);
  const [toastMsg, setToastMsg] = useState({ msg: '', n: 0 });
  const [bump, setBump] = useState<Bump>({ cat: null, n: 0 });

  /* ---- Carga y guardado en IndexedDB ---- */
  useEffect(() => {
    loadState()
      .then((s) => {
        loaded.current = true;
        setS(s);
      })
      .catch(() => setLoadError(true));
    requestPersistence().then(setPersisted);
  }, []);

  useEffect(() => {
    if (!S || !loaded.current) return;
    saveState(S)
      .then(() => setSaveOK(true))
      .catch(() => setSaveOK(false));
  }, [S]);

  /* ---- Acciones ---- */
  const toast = useCallback((msg: string) => setToastMsg((t) => ({ msg, n: t.n + 1 })), []);
  const doBump = useCallback((cat: CatId) => setBump((b) => ({ cat, n: b.n + 1 })), []);

  const showSheet = useCallback((s: SheetState) => {
    window.clearTimeout(closeTimer.current);
    setSheet(s);
    setSheetOpen(true);
  }, []);
  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setSheet(null), 450);
  }, []);

  const update = useCallback((fn: (s: AppState) => AppState) => setS((s) => (s ? fn(s) : s)), []);

  const actions: Actions = useMemo(
    () => ({
      toast,
      closeSheet,
      confirm: setConfirmOpts,
      openAdd: (cat) => showSheet({ kind: 'add', cat: cat ?? null, n: Date.now() }),
      openDetail: (cat) => showSheet({ kind: 'detail', cat, n: Date.now() }),
      openBudgets: () => showSheet({ kind: 'budgets', n: Date.now() }),
      addTx: (cat, amt) => {
        update((s) => ({ ...s, txs: [...s.txs, { id: uid(), cat, amt, ts: Date.now() }] }));
        closeSheet();
        doBump(cat);
        toast(cat === 'ahorro' ? `Aportación de ${money(amt)} registrada` : `${money(amt)} en ${BY_ID[cat].name}`);
      },
      updateTx: (id, amt, cat) => {
        const old = sRef.current?.txs.find((t) => t.id === id)?.cat;
        update((s) => ({ ...s, txs: s.txs.map((t) => (t.id === id ? { ...t, amt, cat } : t)) }));
        doBump(cat);
        toast(old && old !== cat ? `Movido a ${BY_ID[cat].name}` : 'Movimiento actualizado');
      },
      deleteTx: (id) => {
        update((s) => ({ ...s, txs: s.txs.filter((t) => t.id !== id) }));
        toast('Movimiento eliminado');
      },
      setBudget: (cat, cents) => {
        update((s) => ({ ...s, budgets: { ...s.budgets, [cat]: cents } }));
        doBump(cat);
        toast(cat === 'ahorro' ? 'Meta actualizada' : 'Presupuesto actualizado');
      },
      setBudgets: (b) => {
        update((s) => ({ ...s, budgets: { ...b } }));
        closeSheet();
        toast('Presupuestos actualizados');
      },
      startMonth: (b) => {
        update((s) => ({ ...s, budgets: { ...b }, started: true, closing: false, monthStart: Date.now() }));
        window.scrollTo(0, 0);
        toast('Mes iniciado');
      },
      setClosing: (v) => {
        update((s) => ({ ...s, closing: v }));
        window.scrollTo(0, 0);
      },
      resetMonth: () => {
        update((s) => ({
          ...s,
          prevBudgets: { ...s.budgets },
          budgets: {},
          txs: [],
          closing: false,
          started: false,
          monthStart: null
        }));
        window.scrollTo(0, 0);
        toast('Mes reseteado');
      }
    }),
    [toast, closeSheet, showSheet, update, doBump]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirmOpts) setConfirmOpts(null);
      else if (sheetOpen) closeSheet();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirmOpts, sheetOpen, closeSheet]);

  if (loadError) {
    return (
      <div className="app">
        <div className="setup-head">
          <h1>No se pudo abrir el almacenamiento</h1>
          <p>Este navegador está bloqueando IndexedDB (por ejemplo, en modo privado). Abre la app desde la pantalla de inicio o en una ventana normal de Safari.</p>
        </div>
      </div>
    );
  }
  if (!S) return <div className="app loading" aria-busy="true" />;

  const standalone = isStandalone();
  const storageNote = !saveOK
    ? { bad: true, text: 'No se pudo guardar el último cambio. Revisa el espacio disponible en tu iPhone.' }
    : !standalone
      ? { bad: false, text: 'Guardado en este navegador. Instálala en tu pantalla de inicio (Compartir → Agregar a inicio) para que iOS no borre tus datos.' }
      : { bad: false, text: persisted ? 'Guardado en este iPhone · almacenamiento persistente activo.' : 'Guardado en este iPhone, sin conexión a servidores.' };

  const view = !S.started ? 'setup' : S.closing ? 'close' : 'dash';

  return (
    <ActionsCtx.Provider value={actions}>
      <div className="app">
        {view === 'setup' && <Setup S={S} />}
        {view === 'dash' && <Dashboard S={S} bump={bump} storageNote={storageNote} />}
        {view === 'close' && <Closing S={S} />}
      </div>

      {view === 'dash' && (
        <button className="fab" type="button" aria-label="Registrar movimiento" onClick={() => actions.openAdd()}>
          <PlusIcon />
        </button>
      )}

      <Sheet open={sheetOpen} onClose={closeSheet}>
        {sheet?.kind === 'add' && <AddSheet key={sheet.n} S={S} preset={sheet.cat} active={sheetOpen} />}
        {sheet?.kind === 'detail' && <DetailSheet key={sheet.n} S={S} id={sheet.cat} />}
        {sheet?.kind === 'budgets' && <BudgetsSheet key={sheet.n} S={S} />}
      </Sheet>

      <ConfirmModal opts={confirmOpts} onClose={() => setConfirmOpts(null)} />
      <Toast msg={toastMsg.msg} n={toastMsg.n} />
    </ActionsCtx.Provider>
  );
}
