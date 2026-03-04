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
	{ idSuffix: 'passenger_trips__section', type: 'section', label: 'Passenger Trips' },
	{ idSuffix: 'pt_nc', type: 'number', label: 'Non-Contract', indent: 1 },
	{ idSuffix: 'medicaid', type: 'number', label: 'Medicaid Contract', indent: 1 },
	{ idSuffix: 'nonmedicaid', type: 'number', label: 'Non-Medicaid Contract', indent: 1 },
	{ idSuffix: 'brokered_medicaid', type: 'number', label: 'Brokered Medicaid Contract', indent: 1 },
	{
		idSuffix: 'total_trips',
		type: 'sum',
		label: 'Total Passenger Trips for This Mode',
		sumOfSuffixes: ['pt_nc', 'medicaid', 'nonmedicaid', 'brokered_medicaid']
	}
];

export const WEEKDAY_TEMPLATE: ModeTemplateRow[] = WEEK_SAT_SUN_TEMPLATE;

export function buildWeekSatSunRows(opts: {
	activeModes: Set<string>;
	modeCatalog: ModeDef<string>[];
	template: ModeTemplateRow[];
}): RowDef[] {
	const rows: RowDef[] = [];
	const activeModeIds = opts.modeCatalog
		.map((mode) => mode.id)
		.filter((modeId) => opts.activeModes.has(modeId));

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

	if (activeModeIds.length > 0) {
		const makeTransitTotalRow = (id: string, label: string, modeSuffix: string): RowDef => ({
			id,
			type: 'sum',
			label,
			sumOf: activeModeIds.map((modeId) => `${modeId}__${modeSuffix}`)
		});

		rows.push({ id: 'transit_totals_section', type: 'section', label: 'Transit Totals' });
		rows.push(makeTransitTotalRow('transit_totals_hours', 'Hours', 'hours'));
		rows.push(makeTransitTotalRow('transit_totals_miles', 'Miles', 'miles'));
		rows.push(makeTransitTotalRow('transit_totals_pt_nc', 'Non-Contract', 'pt_nc'));
		rows.push(makeTransitTotalRow('transit_totals_medicaid', 'Medicaid Contract', 'medicaid'));
		rows.push(
			makeTransitTotalRow('transit_totals_nonmedicaid', 'Non-Medicaid Contract', 'nonmedicaid')
		);
		rows.push(
			makeTransitTotalRow(
				'transit_totals_brokered_medicaid',
				'Brokered Medicaid Contract',
				'brokered_medicaid'
			)
		);
	}

	return pruneByActiveModes(rows, opts.activeModes);
}
