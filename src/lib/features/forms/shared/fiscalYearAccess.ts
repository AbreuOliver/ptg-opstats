export const EDITABLE_HISTORICAL_FISCAL_YEARS = [2026, 2025] as const;

export function isEditableFiscalYear(year: number, currentFiscalYear: number): boolean {
	return year === currentFiscalYear || (EDITABLE_HISTORICAL_FISCAL_YEARS as readonly number[]).includes(year);
}
