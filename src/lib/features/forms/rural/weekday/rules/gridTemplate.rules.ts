import type { RowDef } from '$lib/shared/ui/widgets/dataGrid/grid.types';

export const RURAL_TEMPLATE_ROWS: (Omit<RowDef,'id'|'sumOf'> & { idSuffix: string; sumOfSuffixes?: string[] })[] = [
  { idSuffix: 'hours', type: 'number', label: 'Hours' },
  { idSuffix: 'miles', type: 'number', label: 'Miles' },
  { idSuffix: 'pt_nc', type: 'number', label: 'Passenger Trips: Non-Contract' },
  { idSuffix: 'medicaid', type: 'number', label: '  Medicaid Contract', indent: 1 },
  { idSuffix: 'nonmedicaid', type: 'number', label: '  Non-Medicaid Contract', indent: 1 },
  { idSuffix: 'total_trips', type: 'sum', label: 'Total Passenger Trips for This Mode', sumOfSuffixes: ['pt_nc','medicaid','nonmedicaid'] }
];
