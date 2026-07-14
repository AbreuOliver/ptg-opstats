export const EDITABLE_HISTORICAL_FISCAL_YEARS = [2026, 2025] as const;
export const MAX_VISIBLE_FISCAL_YEARS = 8;

export function isVisibleFiscalYear(year: number, currentFiscalYear: number): boolean {
	return (
		year <= currentFiscalYear &&
		year >= currentFiscalYear - (MAX_VISIBLE_FISCAL_YEARS - 1)
	);
}

export function getVisibleFiscalYears(
	years: readonly number[],
	currentFiscalYear: number
): number[] {
	const visibleYears = new Set<number>();
	for (const year of years) {
		if (isVisibleFiscalYear(year, currentFiscalYear)) {
			visibleYears.add(year);
		}
	}
	visibleYears.add(currentFiscalYear);
	return Array.from(visibleYears).sort((a, b) => b - a).slice(0, MAX_VISIBLE_FISCAL_YEARS);
}

export function isEditableFiscalYear(year: number, currentFiscalYear: number): boolean {
	return year === currentFiscalYear || (EDITABLE_HISTORICAL_FISCAL_YEARS as readonly number[]).includes(year);
}
