// src/lib/dataGrid/gridStore.ts
import { writable, get } from 'svelte/store';
import type { ColumnDef, GridRow } from './schema';

export type Selection = { row: number; col: number };

function createGridStore() {
  const rows = writable<GridRow[]>([]);
  const columns = writable<ColumnDef[]>([]);
  const selection = writable<Selection>({ row: 0, col: 0 });
  const saving = writable(false);
  const changed = writable<Map<string, any>>(new Map()); // `${rowId}:${colId}` -> raw

  let debounce: any;

  function setData(rs: GridRow[], cs: ColumnDef[]) {
    rows.set(rs);
    columns.set(cs);
  }

  function updateCell(r: number, c: number, raw: any) {
    rows.update(list => {
      const copy = list.slice();
      const row = { ...copy[r] };
      const colId = get(columns)[c].id;
      row[colId] = raw;
      copy[r] = row;
      return copy;
    });
    const rowId = get(rows)[r].id;
    const colId = get(columns)[c].id;
    changed.update(m => (m.set(`${rowId}:${colId}`, raw), m));
    scheduleSave();
  }

  function scheduleSave() {
    clearTimeout(debounce);
    debounce = setTimeout(async () => {
      const payload = Array.from(get(changed).entries()).map(([k, v]) => {
        const [rowId, colId] = k.split(':');
        return { rowId, colId, value: v };
      });
      if (!payload.length) return;
      saving.set(true);
      try {
        // TODO: replace with your API
        await new Promise(r => setTimeout(r, 300));
        changed.set(new Map());
      } finally {
        saving.set(false);
      }
    }, 600);
  }

  function moveSelection(dr: number, dc: number) {
    const rs = get(rows).length;
    const cs = get(columns).length;
    const s = get(selection);
    selection.set({
      row: Math.max(0, Math.min(rs - 1, s.row + dr)),
      col: Math.max(0, Math.min(cs - 1, s.col + dc))
    });
  }

  return { rows, columns, selection, saving, setData, updateCell, moveSelection };
}

export const grid = createGridStore();
