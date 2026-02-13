<script lang="ts">
	import type { GridValues, RowDef } from './fiscalGrid.types';
	import {
		createColConfig,
		formatNum,
		getFiscalMonths,
		isEditableCell,
		parseNum,
		recalcAll
	} from './fiscalGrid.logic';

	let {
		rows = [],
		initialValues = undefined,
		readonly = false,
		onValuesChange = undefined
	}: {
		rows?: RowDef[];
		initialValues?: GridValues | undefined;
		readonly?: boolean;
		onValuesChange?: ((values: GridValues) => void) | undefined;
	} = $props();

	const months = getFiscalMonths();
	const colConfig = createColConfig(months.length);
	const { COL_MONTHS, COL_Q1, COL_Q2, COL_Q3, COL_Q4, COL_YTD, TOTAL_COLS } = colConfig;

	const nf = new Intl.NumberFormat('en-US');

	function cloneValues(values: GridValues): GridValues {
		return values.map((row) => row.slice());
	}

	function createEmptyValues(rowCount: number): GridValues {
		return Array.from({ length: rowCount }, () =>
			Array.from({ length: TOTAL_COLS }, () => null)
		);
	}

	function createInitialValues(): GridValues {
		if (
			initialValues &&
			initialValues.length === rows.length &&
			initialValues.every((row) => row.length === TOTAL_COLS)
		) {
			return cloneValues(initialValues);
		}
		return createEmptyValues(rows.length);
	}

	let values = $state<GridValues>(createInitialValues());
	const rowIndexById = $derived(new Map(rows.map((row, idx) => [row.id, idx])));

	$effect(() => {
		const nextValues = createInitialValues();
		if (rows.length) {
			recalcAll(rows, nextValues, colConfig, rowIndexById);
		}
		values = nextValues;
	});

	function canEditCell(rowIndex: number, colIndex: number): boolean {
		if (readonly) return false;
		return isEditableCell(rows, rowIndex, colIndex, colConfig);
	}

	function setCell(r: number, c: number, raw: string) {
		if (!canEditCell(r, c)) return;
		const parsed = parseNum(raw);
		if (parsed === null && raw !== '') return;
		values[r][c] = parsed;
		recalcAll(rows, values, colConfig, rowIndexById);
		onValuesChange?.(values);
	}

	function handlePaste(e: ClipboardEvent, r: number, c: number) {
		const text = e.clipboardData?.getData('text');
		if (!text) return;
		e.preventDefault();

		const rowsPaste = text.split(/\r?\n/).filter((line) => line.length > 0);
		for (let i = 0; i < rowsPaste.length; i++) {
			const cols = rowsPaste[i].split('\t');
			for (let j = 0; j < cols.length; j++) {
				const rr = r + i;
				const cc = c + j;
				if (rr >= rows.length || cc >= TOTAL_COLS) continue;
				if (!canEditCell(rr, cc)) continue;
				setCell(rr, cc, cols[j]);
			}
		}
	}

	function moveFocus(r: number, c: number) {
		const next = document.querySelector<HTMLInputElement>(`input[data-r="${r}"][data-c="${c}"]`);
		if (next) next.focus();
	}

	function handleKey(e: KeyboardEvent, r: number, c: number) {
		let nr = r;
		let nc = c;

		const go = () => {
			if (canEditCell(nr, nc)) return moveFocus(nr, nc);

			let guard = 0;
			while (!canEditCell(nr, nc) && guard < 1000) {
				guard++;
				if (e.key === 'ArrowUp') nr = Math.max(0, nr - 1);
				else if (e.key === 'ArrowDown') nr = Math.min(rows.length - 1, nr + 1);
				else if (e.key === 'ArrowLeft') nc = Math.max(0, nc - 1);
				else if (e.key === 'ArrowRight') nc = Math.min(COL_MONTHS - 1, nc + 1);
				else return;
			}
			if (canEditCell(nr, nc)) moveFocus(nr, nc);
		};

		if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
			e.preventDefault();
			if (e.key === 'ArrowUp') nr = Math.max(0, r - 1);
			if (e.key === 'ArrowDown') nr = Math.min(rows.length - 1, r + 1);
			if (e.key === 'ArrowLeft') nc = Math.max(0, c - 1);
			if (e.key === 'ArrowRight') nc = Math.min(COL_MONTHS - 1, c + 1);
			go();
			return;
		}

		if (e.key === 'Enter') {
			e.preventDefault();
			nr = Math.min(rows.length - 1, r + 1);
			go();
			return;
		}

		if (e.key === 'Tab') {
			e.preventDefault();
			if (e.shiftKey) {
				if (c > 0) nc = c - 1;
				else {
					nr = Math.max(0, r - 1);
					nc = COL_MONTHS - 1;
				}
			} else {
				if (c < COL_MONTHS - 1) nc = c + 1;
				else {
					nr = Math.min(rows.length - 1, r + 1);
					nc = 0;
				}
			}
			go();
		}
	}

</script>

<div class="overflow-auto rounded-lg border border-zinc-700 dark:border-zinc-800">
	<table class="w-full border-collapse">
		<thead
			class="sticky top-0 z-30 border-b border-zinc-300 bg-zinc-50 text-xs tracking-wide text-zinc-600 uppercase dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
		>
			<tr>
				<th
					class="sticky left-0 z-20 min-w-[375px] border-r border-zinc-300 bg-zinc-50 p-3 text-left font-medium dark:border-zinc-700 dark:bg-zinc-900"
				>
					<!-- Line Item -->
				</th>

				{#each months as m}
					<th class="border-r border-zinc-300 p-3 text-center dark:border-zinc-700">
						{m}
					</th>
				{/each}

				{#each ['Q1', 'Q2', 'Q3', 'Q4', 'YTD'] as q}
					<th class="border-r border-zinc-300 p-3 text-center dark:border-zinc-700">
						{q}
					</th>
				{/each}
			</tr>
		</thead>

		<tbody class="text-sm">
			{#each rows as row, r}
				<tr
					class="
						border-b border-zinc-300 transition-colors
						hover:bg-zinc-100/40 dark:border-zinc-700
						dark:hover:bg-zinc-800/40
						{row.type === 'section'
						? 'bg-zinc-100 font-semibold text-[var(--theme-color)] dark:bg-zinc-800'
						: row.type === 'label'
							? 'bg-zinc-50 dark:bg-zinc-900'
							: 'bg-white dark:bg-zinc-950'}
					"
				>
					<td
						class="sticky left-0 z-20 border-r border-zinc-300 bg-zinc-100 p-3 pl-6 dark:border-zinc-700 dark:bg-zinc-900"
					>
						<span
							class="inline-block"
							style={'padding-left:' + (row.indent ? row.indent * 16 : 0) + 'px'}
						>
							{row.label}
						</span>
					</td>

					{#each Array(COL_MONTHS) as _, c}
						<td class="border-r border-zinc-300 bg-white p-0 dark:border-zinc-700 dark:bg-zinc-950">
							{#if canEditCell(r, c)}
								<input
									class="w-full min-w-28 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-center font-mono text-sm transition outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-green-500 dark:focus:ring-green-500"
									data-r={r}
									data-c={c}
									inputmode="numeric"
									autocomplete="off"
									autocapitalize="off"
									spellcheck="false"
									value={formatNum(values[r][c], nf)}
									onkeydown={(e) => handleKey(e, r, c)}
									onpaste={(e) => handlePaste(e, r, c)}
									oninput={(e) => {
										const el = e.currentTarget as HTMLInputElement;
										const parsed = parseNum(el.value);
									if (parsed !== null || el.value === '') {
										values[r][c] = parsed;
										recalcAll(rows, values, colConfig, rowIndexById);
										onValuesChange?.(values);
									}
								}}
									onblur={(e) => {
										const el = e.currentTarget as HTMLInputElement;
										el.value = formatNum(values[r][c], nf);
									}}
								/>
							{:else}
								<div
									class="w-full min-w-[7rem] bg-white px-2 py-2 text-center font-mono text-zinc-500 dark:bg-zinc-950"
								>
									{row.type === 'sum' || (row.type === 'number' && readonly)
										? formatNum(values[r][c], nf)
										: ''}
								</div>
							{/if}
						</td>
					{/each}

					{#each [COL_Q1, COL_Q2, COL_Q3, COL_Q4, COL_YTD] as col}
						<td class="border-r border-zinc-300 bg-white p-0 dark:border-zinc-700 dark:bg-zinc-950">
							<div class="w-full min-w-[7rem] px-2 py-2 text-center font-mono font-semibold">
								{formatNum(values[r][col], nf)}
							</div>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
