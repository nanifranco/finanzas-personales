import type { CatId } from '../lib/categories';

const PATHS: Record<CatId, JSX.Element> = {
  psicologa: (
    <>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 20.5l1.5-5A8.5 8.5 0 1 1 21 11.5z" />
      <path d="M12 15s-3.5-2.1-3.5-4.4a1.9 1.9 0 0 1 3.5-1 1.9 1.9 0 0 1 3.5 1C15.5 12.9 12 15 12 15z" />
    </>
  ),
  canto: (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </>
  ),
  suscripciones: (
    <>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a3 3 0 0 1 3-3h15" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a3 3 0 0 1-3 3H3" />
    </>
  ),
  deporte: <path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11" />,
  restaurantes: <path d="M7 2v20M4 2v6a3 3 0 0 0 6 0V2M17 22V2c-2.5 1.5-3.5 4-3.5 7.5S15 14 17 14" />,
  entretenimiento: (
    <>
      <path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z" />
      <path d="M14 7v10" strokeDasharray="2 2" />
    </>
  ),
  personales: (
    <>
      <path d="M6 8h12l-1 13H7z" />
      <path d="M9 8a3 3 0 0 1 6 0" />
    </>
  ),
  extras: (
    <>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
      <path d="M19 16l.6 1.9 1.9.6-1.9.6L19 21l-.6-1.9-1.9-.6 1.9-.6z" />
    </>
  ),
  taller: (
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z" />
  ),
  ahorro: (
    <>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </>
  )
};

export function CatIcon({ id }: { id: CatId }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[id]}
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function BackspaceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z" />
      <path d="M17 9l-6 6M11 9l6 6" />
    </svg>
  );
}
