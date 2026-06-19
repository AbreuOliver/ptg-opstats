import { error } from '@sveltejs/kit';
import type { DaySlug, FormType } from '$lib/features/forms/shared/types/capabilities.types';
import { getOpStatsRepository } from '$lib/server/opstats/repository';
import { buildOverviewPrefill } from './overviewPrefill';
import { isEditableFiscalYear } from '$lib/features/forms/shared/fiscalYearAccess';

export function getCurrentFiscalYear(date = new Date()): number {
	const month = date.getMonth();
	const year = date.getFullYear();
	return month >= 6 ? year + 1 : year;
}

export async function loadWeekSatSunRdsData(args: {
	type: FormType;
	year: number;
	slug: DaySlug;
	agency: string | null;
}) {
	const currentFiscalYear = getCurrentFiscalYear();
	const readonlyYear = !isEditableFiscalYear(args.year, currentFiscalYear);

	if (!args.agency) {
		return {
			currentFiscalYear,
			readonlyYear,
			systemId: null,
			rdsSnapshot: null,
			overviewCapabilities: null
		};
	}

	const repo = getOpStatsRepository();
	const systemId = await repo.resolveSystemIdByAgencyName(args.agency);
	if (!systemId) {
		throw error(404, `No OpStats SystemID mapping found for agency "${args.agency}".`);
	}

	const [snapshot, overview, rows] = await Promise.all([
		repo.getDaySnapshot({
			systemId,
			year: args.year,
			slug: args.slug
		}),
		repo.getOverviewRow({ systemId, year: args.year }),
		repo.getYearMonthlyRows({ systemId, year: args.year })
	]);

	const overviewCapabilities =
		overview || rows.length > 0
			? buildOverviewPrefill({
					type: args.type,
					agency: args.agency,
					overview,
					rows
				})
			: null;

	return {
		currentFiscalYear,
		readonlyYear,
		systemId,
		rdsSnapshot: snapshot,
		overviewCapabilities
	};
}
