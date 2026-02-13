import { browser } from '$app/environment';
import type { GridValues, RowDef } from '$lib/shared/ui/widgets/fiscalGrid/fiscalGrid.types';
import type { DaySlug, FormType } from '$lib/features/forms/shared/types/capabilities.types';

type DraftRow = (number | null)[];
type GridDraftByRowId = Record<string, DraftRow>;

export function gridDraftKey(type: FormType, year: number, slug: DaySlug) {
	return `grid:${type}:${year}:${slug}`;
}

function createEmptyValues(rowCount: number, colCount: number): GridValues {
	return Array.from({ length: rowCount }, () => Array.from({ length: colCount }, () => null));
}

function normalizeRow(row: unknown, colCount: number): DraftRow {
	const normalized: DraftRow = Array.from({ length: colCount }, () => null);
	if (!Array.isArray(row)) return normalized;

	for (let i = 0; i < Math.min(colCount, row.length); i++) {
		const cell = row[i];
		normalized[i] = typeof cell === 'number' || cell === null ? cell : null;
	}
	return normalized;
}

export function loadGridDraft(key: string, rows: RowDef[], colCount: number): GridValues {
	const t0 = performance.now();
	const empty = createEmptyValues(rows.length, colCount);
	if (!browser) return empty;

	try {
		const raw = localStorage.getItem(key);
		const tRead = performance.now();
		if (!raw) {
			console.log('[draft] miss', {
				key,
				rows: rows.length,
				cols: colCount,
				ms: +(tRead - t0).toFixed(1)
			});
			return empty;
		}
		const parsed = JSON.parse(raw);
		const tParse = performance.now();

		// New shape: Record<rowId, rowValues>
		if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
			const byRowId = parsed as GridDraftByRowId;
			for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
				const rowId = rows[rowIndex].id;
				empty[rowIndex] = normalizeRow(byRowId[rowId], colCount);
			}
			console.log('[draft] load', {
				key,
				bytes: raw.length,
				rows: rows.length,
				cols: colCount,
				readMs: +(tRead - t0).toFixed(1),
				parseMs: +(tParse - tRead).toFixed(1),
				totalMs: +(performance.now() - t0).toFixed(1)
			});
			return empty;
		}

		// Backward compatibility with old matrix shape.
		if (Array.isArray(parsed)) {
			for (let rowIndex = 0; rowIndex < Math.min(rows.length, parsed.length); rowIndex++) {
				empty[rowIndex] = normalizeRow(parsed[rowIndex], colCount);
			}
			console.log('[draft] load (legacy)', {
				key,
				bytes: raw.length,
				rows: rows.length,
				cols: colCount,
				readMs: +(tRead - t0).toFixed(1),
				parseMs: +(tParse - tRead).toFixed(1),
				totalMs: +(performance.now() - t0).toFixed(1)
			});
			return empty;
		}

		console.log('[draft] invalid shape', {
			key,
			bytes: raw.length,
			rows: rows.length,
			cols: colCount,
			readMs: +(tRead - t0).toFixed(1),
			parseMs: +(tParse - tRead).toFixed(1),
			totalMs: +(performance.now() - t0).toFixed(1)
		});
		return empty;
	} catch (err) {
		console.warn('[draft] invalid JSON', { key, err });
		return empty;
	}
}

export function saveGridDraft(key: string, rows: RowDef[], values: GridValues) {
	if (!browser) return;
	try {
		const draftByRowId: GridDraftByRowId = {};
		for (let rowIndex = 0; rowIndex < Math.min(rows.length, values.length); rowIndex++) {
			draftByRowId[rows[rowIndex].id] = Array.isArray(values[rowIndex])
				? (values[rowIndex].slice() as DraftRow)
				: [];
		}
		localStorage.setItem(key, JSON.stringify(draftByRowId));
	} catch {
		// ignore
	}
}

export function createGridDraftSaver(key: string, rows: RowDef[]) {
	let timer: ReturnType<typeof setTimeout> | null = null;
	return (values: GridValues) => {
		if (!browser) return;
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => saveGridDraft(key, rows, values), 300);
	};
}
