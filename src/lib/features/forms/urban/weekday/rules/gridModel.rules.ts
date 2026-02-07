import type { GridModel, RowDef } from '$lib/shared/ui/widgets/dataGrid/grid.types';
import { URBAN_MODES } from '$lib/shared/rules/modes.rules';
import { pruneByActiveModes } from '$lib/shared/rules/modesVisibility.rules';

const URBAN_TEMPLATE: Omit<RowDef, 'id' | 'sumOf'> & {
	idSuffix: string;
	sumOfSuffixes?: string[];
}[] = [
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

function rotate<T>(arr: T[], start: number) {
	return [...arr.slice(start), ...arr.slice(0, start)];
}

export function buildUrbanWeekdayGridModel(activeModeIds?: Set<string>): GridModel {
	const fiscalStartMonthIndex = 6; // July
	const baseMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	const months = rotate(baseMonths, fiscalStartMonthIndex);

	// TEMP: make everything active so /forms/urban/2025/weekday renders a full grid immediately
	const active = activeModeIds ?? new Set(URBAN_MODES.map((m) => m.id));

	const rows: RowDef[] = [];
	rows.push({ id: 'operating_days', type: 'number', label: 'Operating Days' });

	for (const mode of URBAN_MODES) {
		rows.push({ id: `${mode.id}__section`, type: 'section', label: mode.label });

		for (const base of URBAN_TEMPLATE) {
			const id = `${mode.id}__${base.idSuffix}`;
			const sumOf =
				base.type === 'sum' && base.sumOfSuffixes
					? base.sumOfSuffixes.map((s) => `${mode.id}__${s}`)
					: undefined;

			rows.push({ id, type: base.type, label: base.label, indent: base.indent, sumOf });
		}
	}

	const prunedRows = pruneByActiveModes(rows, active);

	return {
		config: { fiscalStartMonthIndex, months, showQuarters: true },
		rows: prunedRows
	};
}
