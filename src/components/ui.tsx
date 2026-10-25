import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import type { CatId } from '../lib/categories';

export interface ConfirmOpts {
  title: string;
  body: string;
  ok: string;
  onOk: () => void;
}

export interface Actions {
  addTx: (cat: CatId, amt: number) => void;
  updateTx: (id: string, amt: number, cat: CatId) => void;
  deleteTx: (id: string) => void;
  setBudget: (cat: CatId, cents: number) => void;
  setBudgets: (b: Partial<Record<CatId, number>>) => void;
  startMonth: (b: Partial<Record<CatId, number>>) => void;
  setClosing: (v: boolean) => void;
  resetMonth: () => void;
  toast: (msg: string) => void;
  openAdd: (cat?: CatId) => void;
  openDetail: (cat: CatId) => void;
  openBudgets: () => void;
  closeSheet: () => void;
  confirm: (o: ConfirmOpts) => void;
}

export const ActionsCtx = createContext<Actions | null>(null);
export const useActions = () => useContext(ActionsCtx)!;

export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open && panel.current) panel.current.scrollTop = 0;
  }, [open]);
  return (
    <div className={`sheet ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="scrim" onClick={onClose} />
      <div className="panel" role="dialog" aria-modal="true" ref={panel}>
        <div className="grab" />
        {children}
      </div>
    </div>
  );
}

export function SheetHead({ title, eyebrow, onClose }: { title: string; eyebrow?: string; onClose: () => void }) {
  return (
    <div className="sh-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h3>{title}</h3>
      </div>
      <button className="x" type="button" onClick={onClose} aria-label="Cerrar">
        ×
      </button>
    </div>
  );
}

export function ConfirmModal({ opts, onClose }: { opts: ConfirmOpts | null; onClose: () => void }) {
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (opts) cancel.current?.focus();
  }, [opts]);
  return (
    <div
      className={`modal ${opts ? 'open' : ''}`}
      aria-hidden={!opts}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box" role="alertdialog">
        <h3>{opts?.title}</h3>
        <p>{opts?.body}</p>
        <div className="modal-btns">
          <button className="btn line" type="button" ref={cancel} onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn danger"
            type="button"
            onClick={() => {
              const f = opts?.onOk;
              onClose();
              f?.();
            }}
          >
            {opts?.ok}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Toast({ msg, n }: { msg: string; n: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!n || !ref.current) return;
    const el = ref.current;
    el.classList.add('show');
    const t = setTimeout(() => el.classList.remove('show'), 2200);
    return () => clearTimeout(t);
  }, [n]);
  return (
    <div className="toast" ref={ref} role="status" aria-live="polite">
      {msg}
    </div>
  );
}
