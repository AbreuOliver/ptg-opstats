import type { GridValues, RowDef } from './fiscalGrid.types';

export const BASE_MONTHS = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec'
];

export const DEFAULT_FISCAL_START_MONTH_INDEX = 6; // July

export function rotate<T>(arr: T[], start: number) {
	return [...arr.slice(start), ...arr.slice(0, start)];
}

export function getFiscalMonths(startIndex = DEFAULT_FISCAL_START_MONTH_INDEX) {
	return rotate(BASE_MONTHS, startIndex);
}

export const QUARTER_INDICES = {
	q1: [0, 1, 2],
	q2: [3, 4, 5],
	q3: [6, 7, 8],
	q4: [9, 10, 11]
};

export type ColConfig = {
	COL_MONTHS: number;
	COL_Q1: number;
	COL_Q2: number;
	COL_Q3: number;
	COL_Q4: number;
	COL_YTD: number;
	TOTAL_COLS: number;
	quarterIndices: typeof QUARTER_INDICES;
};

export function createColConfig(monthCount: number): ColConfig {
	const COL_MONTHS = monthCount;
	const COL_Q1 = COL_MONTHS + 0;
	const COL_Q2 = COL_MONTHS + 1;
	const COL_Q3 = COL_MONTHS + 2;
	const COL_Q4 = COL_MONTHS + 3;
	const COL_YTD = COL_MONTHS + 4;
	const TOTAL_COLS = COL_MONTHS + 5;

	return {
		COL_MONTHS,
		COL_Q1,
		COL_Q2,
		COL_Q3,
		COL_Q4,
		COL_YTD,
		TOTAL_COLS,
		quarterIndices: QUARTER_INDICES
	};
}

export function formatNum(n: number | null, nf: Intl.NumberFormat): string {
	if (n === null || Number.isNaN(n)) return '';
	return nf.format(n);
}

export function parseNum(s: string): number | null {
	const cleaned = s.replace(/[,\s]/g, '');
	if (cleaned === '') return null;
	if (!/^-?\d+$/.test(cleaned)) return null;
	const n = parseInt(cleaned, 10);
	if (Number.isNaN(n)) return null;
	return n;
}

export function isEditableCell(rows: RowDef[], rowIndex: number, colIndex: number, config: ColConfig) {
	const row = rows[rowIndex];
	if (row?.type !== 'number') return false;
	if (colIndex >= config.COL_MONTHS) return false;
	return true;
}

export function recalcRow(
	rows: RowDef[],
	values: GridValues,
	rowIndex: number,
	config: ColConfig,
	rowIndexById: Map<string, number>
) {
	const row = rows[rowIndex];
	if (!row) return;

	if (row.type === 'sum' && row.sumOf && row.sumOf.length > 0) {
		for (let m = 0; m < config.COL_MONTHS; m++) {
			const sum = row.sumOf.reduce((acc, id) => {
				const srcIdx = rowIndexById.get(id);
				if (srcIdx == null) return acc;
				const v = values[srcIdx]?.[m];
				return acc + (typeof v === 'number' ? v : 0);
			}, 0);
			values[rowIndex][m] = sum;
		}
	}

	if (row.type === 'number' || row.type === 'sum') {
		const sumMonths = (idxs: number[]) =>
			idxs.reduce((acc, m) => acc + (values[rowIndex]?.[m] ?? 0), 0);

		values[rowIndex][config.COL_Q1] = sumMonths(config.quarterIndices.q1);
		values[rowIndex][config.COL_Q2] = sumMonths(config.quarterIndices.q2);
		values[rowIndex][config.COL_Q3] = sumMonths(config.quarterIndices.q3);
		values[rowIndex][config.COL_Q4] = sumMonths(config.quarterIndices.q4);
		values[rowIndex][config.COL_YTD] =
			(values[rowIndex][config.COL_Q1] ?? 0) +
			(values[rowIndex][config.COL_Q2] ?? 0) +
			(values[rowIndex][config.COL_Q3] ?? 0) +
			(values[rowIndex][config.COL_Q4] ?? 0);
		return;
	}

	values[rowIndex][config.COL_Q1] = null;
	values[rowIndex][config.COL_Q2] = null;
	values[rowIndex][config.COL_Q3] = null;
	values[rowIndex][config.COL_Q4] = null;
	values[rowIndex][config.COL_YTD] = null;
}

export function recalcAll(
	rows: RowDef[],
	values: GridValues,
	config: ColConfig,
	rowIndexById: Map<string, number>
) {
	for (let r = 0; r < rows.length; r++) recalcRow(rows, values, r, config, rowIndexById);
}
