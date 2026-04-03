import type { Capabilities, FormType } from '$lib/features/forms/shared/types/capabilities.types';
import type { RowDef } from '$lib/shared/ui/widgets/fiscalGrid/fiscalGrid.types';
import { RURAL_MODES, URBAN_MODES } from '$lib/shared/rules/modes.rules';
import {
	buildWeekSatSunRows,
	RURAL_TRANSIT_TOTALS,
	URBAN_TRANSIT_TOTALS,
	URBAN_WEEKDAY_TEMPLATE,
	URBAN_WEEK_SAT_SUN_TEMPLATE,
	WEEKDAY_TEMPLATE,
	WEEK_SAT_SUN_TEMPLATE
} from './buildWeekSatSunRows.rules';

export function buildWeekSatSunSchema(args: {
	type: FormType;
	slug: 'weekday' | 'saturday' | 'sunday';
	capabilities: Capabilities;
}): RowDef[] {
	const activeModes = new Set(args.capabilities.selectedModes);
	const modeCatalog = args.type === 'urban' ? URBAN_MODES : RURAL_MODES;
	const template =
		args.type === 'urban'
			? args.slug === 'weekday'
				? URBAN_WEEKDAY_TEMPLATE
				: URBAN_WEEK_SAT_SUN_TEMPLATE
			: args.slug === 'weekday'
				? WEEKDAY_TEMPLATE
				: WEEK_SAT_SUN_TEMPLATE;
	const transitTotals = args.type === 'urban' ? URBAN_TRANSIT_TOTALS : RURAL_TRANSIT_TOTALS;

	return buildWeekSatSunRows({
		activeModes,
		modeCatalog,
		template,
		transitTotals
	});
}
