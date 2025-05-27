export type Cell = {
	value: string;
	display: string;
	result: string;
	format: CellFormat;
};

export type CellFormat = {
	italics: boolean;
	bold: boolean;
	underline: boolean;
	fontsize: number;
	align: 'left' | 'center' | 'right';
	colour: string;
	background: string;
	border: [boolean, boolean, boolean, boolean];
	readonly: boolean;
};

export type Grid = Cell[][];