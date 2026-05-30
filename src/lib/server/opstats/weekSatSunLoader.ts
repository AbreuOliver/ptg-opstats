import { error } from '@sveltejs/kit';
import type { DaySlug, FormType } from '$lib/features/forms/shared/types/capabilities.types';
import { getOpStatsRepository } from '$lib/server/opstats/repository';

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
	const readonlyYear = args.year !== currentFiscalYear;

	if (!args.agency) {
		return {
			currentFiscalYear,
			readonlyYear,
			systemId: null,
			rdsSnapshot: null
		};
	}

	const repo = getOpStatsRepository();
	const systemId = await repo.resolveSystemIdByAgencyName(args.agency);
	if (!systemId) {
		throw error(404, `No OpStats SystemID mapping found for agency "${args.agency}".`);
	}

	const snapshot = await repo.getDaySnapshot({
		systemId,
		year: args.year,
		slug: args.slug
	});

	return {
		currentFiscalYear,
		readonlyYear,
		systemId,
		rdsSnapshot: snapshot
	};
}
