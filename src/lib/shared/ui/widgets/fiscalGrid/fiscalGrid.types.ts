export type RowKind = 'section' | 'label' | 'number' | 'sum';

export type RowDef = {
	id: string;
	type: RowKind;
	label: string;
	indent?: number;
	/** for sum rows: which other row ids to sum */
	sumOf?: string[];
};

export type GridValues = (number | null)[][];
