export const EDITABLE_HISTORICAL_FISCAL_YEARS = [2025] as const;

export function isEditableFiscalYear(year: number, currentFiscalYear: number): boolean {
	return year === currentFiscalYear || EDITABLE_HISTORICAL_FISCAL_YEARS.includes(year as 2025);
}
