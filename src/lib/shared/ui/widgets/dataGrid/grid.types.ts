export type RowKind = 'section' | 'label' | 'number' | 'sum';

export type RowDef = {
  id: string;
  type: RowKind;
  label: string;
  indent?: number;
  sumOf?: string[];
};

export type GridConfig = {
  fiscalStartMonthIndex: number; // 0=Jan..11=Dec
  months: string[];             // rotated, length 12
  showQuarters: boolean;        // Q1..Q4..YTD columns
};

export type GridModel = {
  config: GridConfig;
  rows: RowDef[];
};

export type GridValues = (number | null)[][];
