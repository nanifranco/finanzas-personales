# Finanzas Nani

App personal de presupuesto mensual en MXN, instalable en iPhone como PWA.
React + TypeScript + Vite. Los datos viven solo en el dispositivo, en IndexedDB.

## Comandos

```bash
npm install
npm run dev       # desarrollo en http://localhost:5173
npm test          # pruebas de cálculos, persistencia y flujo completo
npm run build     # genera dist/ (app + service worker para uso sin conexión)
npm run preview   # sirve dist/ localmente
```

## Publicar e instalar en el iPhone

Una PWA necesita servirse por HTTPS para instalarse. La opción incluida es GitHub Pages:

1. Crea un repositorio en GitHub (puede ser privado si tu plan permite Pages privadas; si no, público: el código no contiene datos tuyos).
2. Sube este proyecto a la rama `main`.
3. En el repo: **Settings → Pages → Source: GitHub Actions**.
4. El flujo `.github/workflows/deploy.yml` corre las pruebas, compila y publica. La URL queda en `https://<usuario>.github.io/<repo>/`.
5. En el iPhone, abre esa URL en **Safari** → botón **Compartir** → **Agregar a inicio**.
6. Abre Finanzas Nani desde el ícono de inicio (no desde Safari) y registra tus datos ahí.

Alternativas equivalentes: Netlify o Vercel (arrastrar la carpeta `dist/` o conectar el repo).

## Datos y almacenamiento

- Base IndexedDB `finanzas-nani`, registro `state`, con una copia del guardado anterior en `state-prev`.
- Cada cambio se guarda al instante y la app espera la confirmación de escritura.
- Al iniciar se pide `navigator.storage.persist()` para que el sistema no borre los datos por falta de espacio.
- Nada se envía a servidores. El service worker solo guarda en caché los archivos de la app para que funcione sin conexión.

Qué puede borrar tus datos:
- Eliminar la app de la pantalla de inicio.
- Ajustes → Safari → Borrar historial y datos de sitios web (si la usas desde Safari).
- Cambiar de iPhone: los datos no se transfieren ni se respaldan en iCloud.

La app instalada en inicio tiene su propio almacenamiento, separado del de Safari y del prototipo en Claude.

## Estructura

```
src/
  lib/categories.ts   10 categorías fijas, colores
  lib/money.ts        formato MXN y entrada de montos (centavos)
  lib/state.ts        modelo de datos y cálculos (saldos, tonos, totales)
  lib/db.ts           IndexedDB y persistencia
  components/         Donut, Dashboard, AddSheet, DetailSheet, Screens (inicio, cierre), UI
tests/                pruebas con fake-indexeddb y jsdom
```
