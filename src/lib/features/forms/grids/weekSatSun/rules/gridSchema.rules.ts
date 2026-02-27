import type { Capabilities, FormType } from '$lib/features/forms/shared/types/capabilities.types';
import type { RowDef } from '$lib/shared/ui/widgets/fiscalGrid/fiscalGrid.types';
import { RURAL_MODES, URBAN_MODES } from '$lib/shared/rules/modes.rules';
import {
	buildWeekSatSunRows,
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
	const template = args.slug === 'weekday' ? WEEKDAY_TEMPLATE : WEEK_SAT_SUN_TEMPLATE;

	return buildWeekSatSunRows({
		activeModes,
		modeCatalog,
		template
	});
}
