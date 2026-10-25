import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { money } from '../lib/money';
import type { DonutOpts } from '../lib/state';

const CIRC = 2 * Math.PI * 52;

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Cuenta animada hacia el nuevo valor (como un encoder que gira hasta su posición). */
export function useTweenMoney(to: number, plus?: boolean): string {
  const [shown, setShown] = useState(() => money(reducedMotion() ? to : 0, { plus }));
  const from = useRef(reducedMotion() ? to : 0);
  useEffect(() => {
    const start = from.current;
    from.current = to;
    const final = money(to, { plus });
    if (reducedMotion() || start === to) {
      setShown(final);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const d = 750;
    const step = (now: number) => {
      const k = Math.min((now - t0) / d, 1);
      const e = 1 - Math.pow(1 - k, 3);
      const v = start + (to - start) * e;
      setShown(k < 1 ? money(Math.round(v / 100) * 100, { plus }) : final);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, plus]);
  return shown;
}

export function Donut({ opts, className = '' }: { opts: DonutOpts; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(120);
  const [armed, setArmed] = useState(false);

  // Primero se pinta vacía y luego se llena, para que la animación de entrada se vea.
  useEffect(() => {
    let a = 0;
    const b = requestAnimationFrame(() => (a = requestAnimationFrame(() => setArmed(true))));
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth || 120);
    const ro = new ResizeObserver(() => setWidth(el.clientWidth || 120));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const text = useTweenMoney(opts.cents, opts.plus);
  const finalLen = money(opts.cents, { plus: opts.plus }).length;
  const fontSize = Math.min(width * 0.205, (width * 1.32) / Math.max(finalLen, 1));
  const fill = armed ? opts.fill : 0;

  const style: CSSProperties & Record<string, string> = {};
  if (opts.color && (opts.tone === 'ok' || opts.tone === 'save')) style['--tone'] = opts.color;

  return (
    <div
      ref={ref}
      className={`donut ${className} ${opts.plus ? 'plus' : ''} ${opts.done ? 'done' : ''}`}
      data-tone={opts.tone}
      style={style}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="trk" cx="60" cy="60" r="52" />
        <circle
          className="arc"
          cx="60"
          cy="60"
          r="52"
          strokeDasharray={`${CIRC} ${CIRC}`}
          strokeDashoffset={CIRC * (1 - fill)}
          style={{ opacity: fill > 0 ? 1 : 0 }}
        />
      </svg>
      <div className="center">
        <span className="amt" style={{ fontSize }}>
          {text}
        </span>
        <span className="lbl">{opts.label}</span>
      </div>
    </div>
  );
}
