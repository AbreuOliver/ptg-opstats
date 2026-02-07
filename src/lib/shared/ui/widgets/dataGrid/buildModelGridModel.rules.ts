import type { GridModel, RowDef } from './grid.types';
import type { ModeDef } from '$lib/shared/types/modes.types';

type TemplateRow = Omit<RowDef, 'id' | 'sumOf'> & {
  idSuffix: string;
  sumOfSuffixes?: string[];
};

function rotate<T>(arr: T[], start: number) {
  return [...arr.slice(start), ...arr.slice(0, start)];
}

export function buildModeGridModel<TMode extends string>(opts: {
  fiscalStartMonthIndex: number;
  showQuarters: boolean;
  modes: ModeDef<TMode>[];
  includeOperatingDays?: boolean;
  template: TemplateRow[];
}): GridModel {
  const baseMonths = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const months = rotate(baseMonths, opts.fiscalStartMonthIndex);

  const rows: RowDef[] = [];

  if (opts.includeOperatingDays) {
    rows.push({ id: 'operating_days', type: 'number', label: 'Operating Days' });
  }

  for (const mode of opts.modes) {
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

  return {
    config: { fiscalStartMonthIndex: opts.fiscalStartMonthIndex, months, showQuarters: opts.showQuarters },
    rows
  };
}
