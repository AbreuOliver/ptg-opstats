import { browser } from '$app/environment';
import type { GridValues, RowDef } from '$lib/shared/ui/widgets/fiscalGrid/fiscalGrid.types';
import type { DaySlug, FormType } from '$lib/features/forms/shared/types/capabilities.types';
import {
	setFormDraftSnapshot,
	loadResolvedFormDraftSnapshot
} from '$lib/features/forms/persistence/formDraftRegistry';

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

function loadFromSource(source: unknown, rows: RowDef[], colCount: number): GridValues | null {
	if (!source || typeof source !== 'object') return null;
	const empty = createEmptyValues(rows.length, colCount);

	if (!Array.isArray(source)) {
		const byRowId = source as GridDraftByRowId;
		for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
			const rowId = rows[rowIndex].id;
			empty[rowIndex] = normalizeRow(byRowId[rowId], colCount);
		}
		return empty;
	}

	for (let rowIndex = 0; rowIndex < Math.min(rows.length, source.length); rowIndex++) {
		empty[rowIndex] = normalizeRow(source[rowIndex], colCount);
	}
	return empty;
}

export function loadGridDraft(
	key: string,
	rows: RowDef[],
	colCount: number,
	remoteValues: GridValues | null = null
): GridValues {
	const empty = createEmptyValues(rows.length, colCount);
	if (!browser) return empty;

	if (!remoteValues) {
		return (
			loadResolvedFormDraftSnapshot(key, empty, (value) => loadFromSource(value, rows, colCount) ?? empty) ??
			empty
		);
	}

	const remoteDraft = toDraftByRowId(rows, remoteValues);
	const merged = loadResolvedFormDraftSnapshot(key, remoteDraft, (value) => loadFromSource(value, rows, colCount) ?? empty);
	return loadFromSource(merged, rows, colCount) ?? empty;
}

function toDraftByRowId(rows: RowDef[], values: GridValues): GridDraftByRowId {
	const draftByRowId: GridDraftByRowId = {};
	for (let rowIndex = 0; rowIndex < Math.min(rows.length, values.length); rowIndex++) {
		draftByRowId[rows[rowIndex].id] = Array.isArray(values[rowIndex])
			? (values[rowIndex].slice() as DraftRow)
			: [];
	}
	return draftByRowId;
}

export function hasGridDraft(key: string): boolean {
	if (!browser) return false;
	return localStorage.getItem(key) !== null;
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
		setFormDraftSnapshot(key, draftByRowId);
	} catch {
		// ignore
	}
}

export function createGridDraftSaver(key: string, rows: RowDef[]) {
	let timer: ReturnType<typeof setTimeout> | null = null;
	return (values: GridValues) => {
		if (!browser) return;
		const draftByRowId: GridDraftByRowId = {};
		for (let rowIndex = 0; rowIndex < Math.min(rows.length, values.length); rowIndex++) {
			draftByRowId[rows[rowIndex].id] = Array.isArray(values[rowIndex])
				? (values[rowIndex].slice() as DraftRow)
				: [];
		}
		setFormDraftSnapshot(key, draftByRowId);
		if (timer) clearTimeout(timer);
		timer = setTimeout(() => saveGridDraft(key, rows, values), 300);
	};
}
