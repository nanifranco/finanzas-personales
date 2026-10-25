// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import { closeDb, loadState } from '../src/lib/db';

// jsdom no trae estas APIs del navegador
globalThis.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} } as any;
window.matchMedia = ((q: string) => ({ matches: q.includes('reduce'), addEventListener() {}, removeEventListener() {} })) as any;
window.scrollTo = vi.fn() as any;

describe('flujo completo de la app', () => {
  it('presupuesto → gasto con sobregiro → cierre → reset', async () => {
    const { container, unmount } = render(<App />);
    await screen.findByText('¿Cuánto planeas para cada categoría?');

    fireEvent.change(container.querySelector('#su-restaurantes')!, { target: { value: '500' } });
    fireEvent.change(container.querySelector('#su-ahorro')!, { target: { value: '5000' } });
    fireEvent.click(screen.getByText('Comenzar el mes'));
    await screen.findByText('Disponible para gastar');

    // Registrar $600 en restaurantes con el teclado
    fireEvent.click(screen.getByLabelText('Registrar movimiento'));
    for (const k of ['6', '0', '0']) fireEvent.click(screen.getAllByRole('button', { name: k })[0]);
    fireEvent.click(container.querySelector('.tile[aria-pressed]:not(.wide)')!.parentElement!.querySelectorAll('.tile')[4]);
    fireEvent.click(screen.getByText('Guardar'));

    const card = container.querySelector('.card[data-tone="over"]')!;
    expect(card).toBeTruthy();
    await waitFor(() => expect(card.querySelector('.amt')!.textContent).toBe('-$100'));
    expect(container.textContent).not.toMatch(/excedido/i);

    // Persistió: se puede leer desde IndexedDB tras "cerrar" la app
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    unmount();
    await closeDb();
    const saved = await loadState();
    expect(saved.txs).toHaveLength(1);
    expect(saved.txs[0].amt).toBe(60000);

    // Reabrir: los datos siguen ahí
    const again = render(<App />);
    await screen.findByText('Disponible para gastar');
    fireEvent.click(screen.getByText('Cerrar mes'));
    await screen.findByText('Cierre del mes');
    const reset = screen.getByText('Resetear mes', { selector: 'button.btn' }) as HTMLButtonElement;
    expect(reset.disabled).toBe(true);
    fireEvent.click(again.container.querySelector('#cl-ok')!);
    fireEvent.click(reset);
    fireEvent.click(again.container.querySelector('.modal .btn.danger')!);
    await screen.findByText('¿Cuánto planeas para cada categoría?');
    expect(screen.getByText(/Mes anterior: \$500/)).toBeTruthy();
  });
});
