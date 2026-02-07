import type { RowDef } from '$lib/shared/ui/widgets/fiscalGrid/fiscalGrid.types';
import type { ModeDef } from '$lib/shared/types/modes.types';
import { pruneByActiveModes } from '$lib/shared/rules/pruneByActiveModes.rules';

export type ModeTemplateRow = Omit<RowDef, 'id' | 'sumOf'> & {
	idSuffix: string;
	sumOfSuffixes?: string[];
};

export const WEEK_SAT_SUN_TEMPLATE: ModeTemplateRow[] = [
	{ idSuffix: 'hours', type: 'number', label: 'Hours' },
	{ idSuffix: 'miles', type: 'number', label: 'Miles' },
	{ idSuffix: 'pt_nc', type: 'number', label: 'Passenger Trips: Non-Contract' },
	{ idSuffix: 'medicaid', type: 'number', label: '  Medicaid Contract', indent: 1 },
	{ idSuffix: 'nonmedicaid', type: 'number', label: '  Non-Medicaid Contract', indent: 1 },
	{
		idSuffix: 'total_trips',
		type: 'sum',
		label: 'Total Passenger Trips for This Mode',
		sumOfSuffixes: ['pt_nc', 'medicaid', 'nonmedicaid']
	}
];

export function buildWeekSatSunRows(opts: {
	activeModes: Set<string>;
	modeCatalog: ModeDef<string>[];
	template: ModeTemplateRow[];
}): RowDef[] {
	const rows: RowDef[] = [];

	rows.push({ id: 'operating_days', type: 'number', label: 'Operating Days' });

	for (const mode of opts.modeCatalog) {
		rows.push({ id: `${mode.id}__section`, type: 'section', label: mode.label });

		for (const base of opts.template) {
			const id = `${mode.id}__${base.idSuffix}`;
			const sumOf =
				base.type === 'sum' && base.sumOfSuffixes
					? base.sumOfSuffixes.map((s) => `${mode.id}__${s}`)
					: undefined;

			rows.push({ id, type: base.type, label: base.label, indent: base.indent, sumOf });
		}
	}

	return pruneByActiveModes(rows, opts.activeModes);
}
