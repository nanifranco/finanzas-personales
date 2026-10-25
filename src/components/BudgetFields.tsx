import { CATEGORIES, SECTIONS, catsOf, type CatId } from '../lib/categories';
import { money, parseMoney, plain } from '../lib/money';

export type BudgetDraft = Record<CatId, string>;

export function draftFrom(b: Partial<Record<CatId, number>>): BudgetDraft {
  return Object.fromEntries(CATEGORIES.map((c) => [c.id, plain(b[c.id] ?? 0)])) as BudgetDraft;
}

/** Devuelve los montos en centavos, o la lista de campos inválidos. */
export function readDraft(d: BudgetDraft): { ok: true; values: Record<CatId, number> } | { ok: false; bad: CatId[] } {
  const values = {} as Record<CatId, number>;
  const bad: CatId[] = [];
  for (const c of CATEGORIES) {
    const v = parseMoney(d[c.id]);
    if (v != null && isNaN(v)) bad.push(c.id);
    else values[c.id] = v ?? 0;
  }
  return bad.length ? { ok: false, bad } : { ok: true, values };
}

export function BudgetFields({
  prefix,
  draft,
  onChange,
  bad,
  hints
}: {
  prefix: string;
  draft: BudgetDraft;
  onChange: (d: BudgetDraft) => void;
  bad: CatId[];
  hints?: Partial<Record<CatId, number>>;
}) {
  const total = CATEGORIES.reduce((a, c) => {
    const v = parseMoney(draft[c.id]);
    return v && v > 0 ? a + v : a;
  }, 0);

  return (
    <div className="bf">
      {SECTIONS.map((sec) => (
        <fieldset key={sec.id}>
          <legend>{sec.name}</legend>
          {catsOf(sec.id).map((c) => {
            const parts: string[] = [];
            if (c.id === 'ahorro') parts.push('Meta mensual de aportación');
            if (hints?.[c.id]) parts.push('Mes anterior: ' + money(hints[c.id]!));
            const id = `${prefix}-${c.id}`;
            return (
              <label className="bf-row" htmlFor={id} key={c.id}>
                <span className="bf-name">
                  {c.name}
                  {parts.length > 0 && <small>{parts.join(' · ')}</small>}
                </span>
                <span className={`money-in ${bad.includes(c.id) ? 'err' : ''}`}>
                  <span>$</span>
                  <input
                    id={id}
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="0"
                    value={draft[c.id]}
                    onFocus={(e) => {
                      const t = e.currentTarget;
                      setTimeout(() => t.select(), 0);
                    }}
                    onChange={(e) => onChange({ ...draft, [c.id]: e.target.value })}
                    onBlur={() => {
                      const v = parseMoney(draft[c.id]);
                      if (v != null && !isNaN(v)) onChange({ ...draft, [c.id]: plain(v) });
                    }}
                  />
                </span>
              </label>
            );
          })}
        </fieldset>
      ))}
      <div className="bf-total">
        <span>Plan total del mes (gastos + meta)</span>
        <b className="num">{money(total)}</b>
      </div>
    </div>
  );
}
