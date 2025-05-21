<script lang="ts">
	import { text } from '@sveltejs/kit';
	import { Grid } from 'wx-svelte-grid';
	import { Material } from 'wx-svelte-grid';
	// import { getData } from "./common/data";

	type GridRow = {
		description: string;
		july: number;
		august: number;
		september: number;
		october: number;
		november: number;
		december: number;
		january: number;
		february: number;
		march: number;
		april: number;
		may: number;
		june: number;
		quarterOne: number;
		quarterTwp: number;
		quarterThree: number;
		quarterFour: number;
		yearToDate: number;
	};

	const data = [
		{
			description: 'Operating Days',
			july: 20,
			august: 23,
			september: 21,
			october: 21,
			november: 19,
			december: 21,
			january: 23,
			february: 20,
			march: 21,
			april: 22,
			may: 22,
			june: 21
		}
	];

	const columns = [
		{ id: 'description', width: 250 },
		{
			id: 'july',
			header: [
				// { text: 'FORMS', colspan: 18 },
				// { text: 'Add values here', colspan: 12 },
				{ text: 'Jul' }
			],
			editor: 'text',
			template: (value: any) => {
				if (typeof value !== 'number') return value;
				return value.toLocaleString();
			},
			width: 100
		},
		{
			id: 'august',
			header: ['Aug'],
			editor: 'text',
			template: (value: any) => {
				if (typeof value !== 'number') return value;
				return value.toLocaleString();
			},
			width: 100
		},
		{
			id: 'september',
			header: ['Sep'],
			editor: 'text',
			template: (value: any) => {
				if (typeof value !== 'number') return value;
				return value.toLocaleString();
			},
			width: 100
		},
		{
			id: 'october',
			header: ['Oct'],
			editor: 'text',
			template: (value: any) => {
				if (typeof value !== 'number') return value;
				return value.toLocaleString();
			},
			width: 100
		},
		{
			id: 'november',
			header: ['Nov'],
			editor: 'text',
			template: (value: any) => {
				if (typeof value !== 'number') return value;
				return value.toLocaleString();
			},
			width: 100
		},
		{
			id: 'december',
			header: ['Dec'],
			editor: 'text',
			template: (value: any) => {
				if (typeof value !== 'number') return value;
				return value.toLocaleString();
			},
			width: 100
		},
		{
			id: 'january',
			header: ['Jan'],
			editor: 'text',
			template: (value: any) => {
				if (typeof value !== 'number') return value;
				return value.toLocaleString();
			},
			width: 100
		},
		{
			id: 'february',
			header: ['Feb'],
			editor: 'text',
			template: (value: any) => {
				if (typeof value !== 'number') return value;
				return value.toLocaleString();
			},
			width: 100
		},
		{
			id: 'march',
			header: ['Mar'],
			editor: 'text',
			template: (value: any) => {
				if (typeof value !== 'number') return value;
				return value.toLocaleString();
			},
			width: 100
		},
		{
			id: 'april',
			header: ['Apr'],
			editor: 'text',
			template: (value: any) => {
				if (typeof value !== 'number') return value;
				return value.toLocaleString();
			},
			width: 100
		},
		{
			id: 'may',
			header: ['May'],
			editor: 'text',
			template: (value: any) => {
				if (typeof value !== 'number') return value;
				return value.toLocaleString();
			},
			width: 100
		},
		{
			id: 'june',
			header: ['Jun'],
			editor: 'text',
			template: (value: any) => {
				if (typeof value !== 'number') return value;
				return value.toLocaleString();
			},
			width: 100
		},
		{
			id: 'quarterOne',
			header: [
				// {text: ''},
				// { text: 'Automatic calculations', colspan: 5 },
				{ text: 'Q1' }
			],
			width: 100
		},
		{
			id: 'quarterTwp',
			header: ['Q2'],
			width: 100
		},
		{
			id: 'quarterThree',
			header: ['Q3'],
			width: 100
		},
		{
			id: 'quarterFour',
			header: ['Q4'],
			width: 100
		},
		{
			id: 'yearToDate',
			header: ['YTD'],
			width: 100
		}
		// {
		// 	id: 'companyName',
		// 	header: ['', { text: 'Company', rowspan: 2 }]
		// }
	];

	// function init(api){
	//     api.on("editor", (ev) => {
	//         console.log("A new value:", ev.value);
	//     });
	// }
	function init(api: {
		on: (event: string, cb: (ev: { row: GridRow; value: string; column: string }) => void) => void;
		update: () => void;
	}) {
		api.on('editor', (ev) => {
			const { row, column, value } = ev;

			// Remove commas and non-numeric characters
			const cleaned = value.replace(/[^\d.-]/g, '');
			const numericValue = parseFloat(cleaned) || 0;

			// Set the cleaned value to the right column
			(row as any)[column] = numericValue;

			// Recalculate totals
			row.quarterOne = row.january + row.february + row.march;
			row.quarterTwp = row.april + row.may + row.june;
			row.quarterThree = row.july + row.august + row.september;
			row.quarterFour = row.october + row.november + row.december;
			row.yearToDate = row.quarterOne + row.quarterTwp + row.quarterThree + row.quarterFour;

			api.update();
		});
	}
</script>

<section class="pt-6 pl-6">
	<h2 class="text-2xl font-semibold">Forms</h2>

	<div style="padding-top: 16px;">
		<Material>
			<Grid {data} {columns} {init} footer 
				sizes={{ 
					rowHeight: 16*3, headerHeight: 16*3.5, 
				}} 
			/>
		</Material>
	</div>
</section>

<style>
	:global(.wx-material-theme) {
		--wx-table-select-background: rgba(0, 0, 0, 0.06);
		--wx-table-select-focus-background: rgba(213, 230, 255, 0.6);
		--wx-table-select-color: var(--wx-color-font);
		--wx-table-border: 1px solid #dfdfdf;
		--wx-table-select-border: none;
		--wx-table-header-border: var(--wx-table-border);
		--wx-table-header-cell-border: var(--wx-table-border);
		--wx-table-footer-cell-border: var(--wx-table-border);
		--wx-table-cell-border: var(--wx-table-border);
		--wx-header-font-weight: 600;
		--wx-table-header-background: #fff;
		--wx-table-fixed-column-right-border: 2px solid #dfdfdf;
		--wx-table-editor-dropdown-border: none;
		--wx-table-editor-dropdown-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.3);
		--wx-table-box-radius: 25px;
	}
	:global(.wx-material-theme .menu) {
		box-shadow: 0px 2px 5px 0px rgba(0, 0, 0, 0.3);
		outline: none;
	}

	:global(.wx-table-box) {
		border-radius: 15px;
		overflow: hidden;
		border: 1px solid #dfdfdf;
	}
</style>
