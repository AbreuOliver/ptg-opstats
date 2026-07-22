import type { PageServerLoad } from './$types';
import { getOpStatsRepository } from '$lib/server/opstats/repository';
import { getCurrentFiscalYear } from '$lib/server/opstats/weekSatSunLoader';
import {
	EDITABLE_HISTORICAL_FISCAL_YEARS,
	getVisibleFiscalYears,
	isEditableFiscalYear
} from '$lib/features/forms/shared/fiscalYearAccess';

export const load: PageServerLoad = async ({ parent }) => {
	const parentData = await parent();
	const agency =
		typeof parentData?.rbac?.selectedAgency === 'string' && parentData.rbac.selectedAgency.length > 0
			? parentData.rbac.selectedAgency
			: null;

	const currentFiscalYear = getCurrentFiscalYear();
	if (!agency) {
		const visibleYears = getVisibleFiscalYears(
			[currentFiscalYear, ...EDITABLE_HISTORICAL_FISCAL_YEARS],
			currentFiscalYear
		);
		return {
			agency: null,
			currentFiscalYear,
			editableYears: visibleYears,
			historicalEditableYears: visibleYears.filter(
				(year) => year !== currentFiscalYear && isEditableFiscalYear(year, currentFiscalYear)
			)
		};
	}

	let years: number[] = [];
	try {
		const repo = getOpStatsRepository();
		const systemIds = await repo.resolveWritableSystemIdsByAgencyName(agency);
		if (systemIds.length > 0) {
			years = await repo.listAllFiscalYearsForSystems(systemIds);
		}
	} catch (err) {
		console.error('[forms] failed to load historical fiscal years for agency', { agency, err });
		// default to current FY only if DB lookup is unavailable
	}

	const allYears = getVisibleFiscalYears(
		[currentFiscalYear, ...EDITABLE_HISTORICAL_FISCAL_YEARS, ...years],
		currentFiscalYear
	);

	return {
		agency,
		currentFiscalYear,
		editableYears: allYears,
		historicalEditableYears: allYears.filter(
			(year) => year !== currentFiscalYear && isEditableFiscalYear(year, currentFiscalYear)
		)
	};
};
