import type { RowDef } from '$lib/shared/ui/widgets/fiscalGrid/fiscalGrid.types';
import type { ModeDef } from '$lib/shared/types/modes.types';
import { pruneByActiveModes } from '$lib/shared/rules/pruneByActiveModes.rules';

export type ModeTemplateRow = Omit<RowDef, 'id' | 'sumOf'> & {
	idSuffix: string;
	sumOfSuffixes?: string[];
};

export type TransitTotalSpec = {
	id: string;
	label: string;
	modeSuffix: string;
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
export const URBAN_WEEK_SAT_SUN_TEMPLATE: ModeTemplateRow[] = [
	{ idSuffix: 'am_pm_peak_period_vehicles', type: 'number', label: 'AM/PM Peak Period Vehicles' },
	{ idSuffix: 'midday_vehicles', type: 'number', label: 'Midday Vehicles' },
	{
		idSuffix: 'total_unlinked_passenger_trips',
		type: 'number',
		label: 'Total Unlinked Passenger Trips'
	},
	{ idSuffix: 'vehicle_revenue_miles', type: 'number', label: 'Vehicle Revenue Miles' },
	{ idSuffix: 'vehicle_revenue_hours', type: 'number', label: 'Vehicle Revenue Hours' }
];
export const URBAN_WEEKDAY_TEMPLATE: ModeTemplateRow[] = URBAN_WEEK_SAT_SUN_TEMPLATE;

export const RURAL_TRANSIT_TOTALS: TransitTotalSpec[] = [
	{ id: 'transit_totals_hours', label: 'Hours', modeSuffix: 'hours' },
	{ id: 'transit_totals_miles', label: 'Miles', modeSuffix: 'miles' },
	{ id: 'transit_totals_pt_nc', label: 'Non-Contract', modeSuffix: 'pt_nc' },
	{ id: 'transit_totals_medicaid', label: 'Medicaid Contract', modeSuffix: 'medicaid' },
	{
		id: 'transit_totals_nonmedicaid',
		label: 'Non-Medicaid Contract',
		modeSuffix: 'nonmedicaid'
	},
	{
		id: 'transit_totals_brokered_medicaid',
		label: 'Brokered Medicaid Contract',
		modeSuffix: 'brokered_medicaid'
	}
];

export const URBAN_TRANSIT_TOTALS: TransitTotalSpec[] = [
	{
		id: 'transit_totals_am_pm_peak_period_vehicles',
		label: 'AM/PM Peak Period Vehicles',
		modeSuffix: 'am_pm_peak_period_vehicles'
	},
	{
		id: 'transit_totals_midday_vehicles',
		label: 'Midday Vehicles',
		modeSuffix: 'midday_vehicles'
	},
	{
		id: 'transit_totals_total_unlinked_passenger_trips',
		label: 'Total Unlinked Passenger Trips',
		modeSuffix: 'total_unlinked_passenger_trips'
	},
	{
		id: 'transit_totals_vehicle_revenue_miles',
		label: 'Vehicle Revenue Miles',
		modeSuffix: 'vehicle_revenue_miles'
	},
	{
		id: 'transit_totals_vehicle_revenue_hours',
		label: 'Vehicle Revenue Hours',
		modeSuffix: 'vehicle_revenue_hours'
	}
];

export function buildWeekSatSunRows(opts: {
	activeModes: Set<string>;
	modeCatalog: ModeDef<string>[];
	template: ModeTemplateRow[];
	transitTotals: TransitTotalSpec[];
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
		for (const total of opts.transitTotals) {
			rows.push(makeTransitTotalRow(total.id, total.label, total.modeSuffix));
		}
	}

	return pruneByActiveModes(rows, opts.activeModes);
}
