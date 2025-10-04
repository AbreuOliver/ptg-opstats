export type CellType = 'text' | 'int' | 'float';

export type Applicability = 'editable' | 'readonly' | 'collapsed';

export type ColumnDef<Row = any> = {
  id: string;
  label: string;
  type: CellType;
  parse?: (text: string) => any;
  format?: (v: any) => string;
  validate?: (v: any, row: Row) => string | null;
  applicability?: (row: Row, ctx: any) => Applicability; // e.g. based on answers
};

export type GridRow = { id: string; [key: string]: any };

export const parse = {
  int: (t: string) => (t.trim() === '' ? null : parseInt(t.replace(/[, ]/g, ''), 10)),
  float: (t: string) => (t.trim() === '' ? null : parseFloat(t.replace(/[, ]/g, ''))),
  text: (t: string) => t
};

const nf0 = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
export const format = {
  int: (v: any) => (v == null || isNaN(v) ? '' : nf0.format(Number(v))),
  float: (v: any) => (v == null || isNaN(v) ? '' : String(v)),
  text: (v: any) => (v ?? '').toString()
};
