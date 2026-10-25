import { freshState, sanitize, type AppState } from './state';

/**
 * Almacenamiento local en IndexedDB. Nada sale del dispositivo.
 * Base "finanzas-nani", almacén "kv", un registro "state" con todo el mes.
 * Cada guardado conserva además la versión anterior en "state-prev" como respaldo
 * por si un guardado quedara corrupto.
 */
const DB_NAME = 'finanzas-nani';
const DB_VERSION = 1;
const STORE = 'kv';

let dbPromise: Promise<IDBDatabase> | null = null;

function idb(): IDBFactory {
  const f = (globalThis as { indexedDB?: IDBFactory }).indexedDB;
  if (!f) throw new Error('IndexedDB no disponible');
  return f;
}

export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = idb().open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => {
      const db = req.result;
      // Si otra pestaña actualiza la base, cerramos para no bloquearla.
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

/** Solo para pruebas: simula cerrar la app. */
export async function closeDb(): Promise<void> {
  if (!dbPromise) return;
  const db = await dbPromise;
  db.close();
  dbPromise = null;
}

function get(db: IDBDatabase, key: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadState(): Promise<AppState> {
  const db = await openDb();
  const cur = await get(db, 'state');
  if (cur) return sanitize(cur);
  const prev = await get(db, 'state-prev');
  if (prev) return sanitize(prev);
  return freshState();
}

/** Resuelve cuando la transacción quedó confirmada en disco. */
export async function saveState(state: AppState): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite', { durability: 'strict' } as IDBTransactionOptions);
    const store = tx.objectStore(STORE);
    const getReq = store.get('state');
    getReq.onsuccess = () => {
      if (getReq.result) store.put(getReq.result, 'state-prev');
      store.put(structuredClone(state), 'state');
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('Guardado cancelado'));
  });
}

/** Pide al sistema que no borre los datos por falta de espacio. */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export function isStandalone(): boolean {
  try {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  } catch {
    return false;
  }
}
