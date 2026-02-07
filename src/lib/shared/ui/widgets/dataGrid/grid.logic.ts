import type { GridModel, GridValues } from './grid.types';

export type GridDerived = {
  colMonths: number;
  colQ1: number;
  colQ2: number;
  colQ3: number;
  colQ4: number;
  colYtd: number;
  totalCols: number;
  quarterIndices: { q1: number[]; q2: number[]; q3: number[]; q4: number[] };
};

export function getDerived(model: GridModel): GridDerived {
  const colMonths = 12;
  const colQ1 = colMonths + 0;
  const colQ2 = colMonths + 1;
  const colQ3 = colMonths + 2;
  const colQ4 = colMonths + 3;
  const colYtd = colMonths + 4;
  const totalCols = model.config.showQuarters ? colMonths + 5 : colMonths;

  return {
    colMonths,
    colQ1,
    colQ2,
    colQ3,
    colQ4,
    colYtd,
    totalCols,
    quarterIndices: {
      q1: [0, 1, 2],
      q2: [3, 4, 5],
      q3: [6, 7, 8],
      q4: [9, 10, 11]
    }
  };
}

export function createEmptyValues(model: GridModel): GridValues {
  const d = getDerived(model);
  return Array.from({ length: model.rows.length }, () =>
    Array.from({ length: d.totalCols }, () => null)
  );
}

export function isEditableCell(model: GridModel, r: number, c: number): boolean {
  const d = getDerived(model);
  const row = model.rows[r];
  if (row.type !== 'number') return false;
  if (c >= d.colMonths) return false;
  return true;
}

export function recalcAll(model: GridModel, values: GridValues): GridValues {
  const d = getDerived(model);
  const rowIndexById = new Map<string, number>();
  model.rows.forEach((row, idx) => rowIndexById.set(row.id, idx));

  const next = values.map((row) => row.slice());

  for (let r = 0; r < model.rows.length; r++) {
    const rowDef = model.rows[r];

    // sum rows: compute month cells from sources
    if (rowDef.type === 'sum' && rowDef.sumOf?.length) {
      for (let m = 0; m < d.colMonths; m++) {
        const sum = rowDef.sumOf.reduce((acc, id) => {
          const srcIdx = rowIndexById.get(id);
          if (srcIdx == null) return acc;
          const v = next[srcIdx][m];
          return acc + (typeof v === 'number' ? v : 0);
        }, 0);
        next[r][m] = sum;
      }
    }

    // quarters/ytd for number+sum rows
    if (model.config.showQuarters && (rowDef.type === 'number' || rowDef.type === 'sum')) {
      const sumMonths = (idxs: number[]) => idxs.reduce((acc, m) => acc + (next[r][m] ?? 0), 0);
      next[r][d.colQ1] = sumMonths(d.quarterIndices.q1);
      next[r][d.colQ2] = sumMonths(d.quarterIndices.q2);
      next[r][d.colQ3] = sumMonths(d.quarterIndices.q3);
      next[r][d.colQ4] = sumMonths(d.quarterIndices.q4);
      next[r][d.colYtd] =
        (next[r][d.colQ1] ?? 0) +
        (next[r][d.colQ2] ?? 0) +
        (next[r][d.colQ3] ?? 0) +
        (next[r][d.colQ4] ?? 0);
    }
  }

  return next;
}

export function applyCellEdit(model: GridModel, values: GridValues, r: number, c: number, v: number | null): GridValues {
  if (!isEditableCell(model, r, c)) return values;
  const next = values.map((row) => row.slice());
  next[r][c] = v;
  return recalcAll(model, next);
}
