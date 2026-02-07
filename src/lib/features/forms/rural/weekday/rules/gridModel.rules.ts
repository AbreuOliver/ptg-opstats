// import type { GridModel, RowDef } from '$lib/shared/ui/widgets/dataGrid/grid.types';

// type ModeId = 'dr_do' | 'dr_pt' | 'mb_do' | 'mb_pt';

// type ModeDef = { id: ModeId; label: string };

// const MODE_ROW_TEMPLATE: Omit<RowDef, 'id' | 'sumOf'> & {
//   idSuffix: string;
//   sumOfSuffixes?: string[];
// }[] = [
//   { idSuffix: 'hours', type: 'number', label: 'Hours' },
//   { idSuffix: 'miles', type: 'number', label: 'Miles' },
//   { idSuffix: 'pt_nc', type: 'number', label: 'Passenger Trips: Non-Contract' },
//   { idSuffix: 'medicaid', type: 'number', label: '  Medicaid Contract', indent: 1 },
//   { idSuffix: 'nonmedicaid', type: 'number', label: '  Non-Medicaid Contract', indent: 1 },
//   { idSuffix: 'total_trips', type: 'sum', label: 'Total Passenger Trips for This Mode', sumOfSuffixes: ['pt_nc','medicaid','nonmedicaid'] }
// ];

// function rotate<T>(arr: T[], start: number) {
//   return [...arr.slice(start), ...arr.slice(0, start)];
// }

// export function buildRuralWeekdayGridModel(opts: { selectedModes: ModeDef[] }): GridModel {
//   const fiscalStartMonthIndex = 6; // July
//   const baseMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
//   const months = rotate(baseMonths, fiscalStartMonthIndex);

//   const rows: RowDef[] = [];
//   rows.push({ id: 'operating_days', type: 'number', label: 'Operating Days' });

//   for (const mode of opts.selectedModes) {
//     rows.push({ id: `${mode.id}__section`, type: 'section', label: mode.label });

//     for (const base of MODE_ROW_TEMPLATE) {
//       const id = `${mode.id}__${base.idSuffix}`;
//       const sumOf =
//         base.type === 'sum' && base.sumOfSuffixes
//           ? base.sumOfSuffixes.map((s) => `${mode.id}__${s}`)
//           : undefined;

//       rows.push({ id, type: base.type, label: base.label, indent: base.indent, sumOf });
//     }
//   }

//   return {
//     config: {
//       fiscalStartMonthIndex,
//       months,
//       showQuarters: true
//     },
//     rows
//   };
// }


import { buildModeGridModel } from '$lib/shared/ui/widgets/dataGrid/buildModelGridModel.rules';
import { RURAL_MODES } from '$lib/shared/rules/modes.rules';
import type { RuralModeId } from '$lib/shared/types/modes.types';
import { RURAL_TEMPLATE_ROWS } from './gridTemplate.rules';

export function buildRuralWeekdayGridModel(active: Set<RuralModeId>) {
  const modes = RURAL_MODES.filter((m) => active.has(m.id));

  return buildModeGridModel({
    fiscalStartMonthIndex: 6, // July
    showQuarters: true,
    includeOperatingDays: true,
    modes,
    template: RURAL_TEMPLATE_ROWS
  });
}
