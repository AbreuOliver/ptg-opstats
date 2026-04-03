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
		return Array.from({ length: rowCount }, () => Array.from({ length: TOTAL_COLS }, () => null));
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
	let activeRow = $state<number | null>(null);
	const rowIndexById = $derived(new Map(rows.map((row, idx) => [row.id, idx])));
	type CardKind = 'operating' | 'mode' | 'transit';
	const sectionCardStarts = $derived.by<number[]>(() => {
		const starts: number[] = [];
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const isOperatingDays = row.id === 'operating_days';
			const isTransitTotals = row.id === 'transit_totals_section';
			const isTopLevelModeSection =
				row.type === 'section' &&
				row.id.endsWith('__section') &&
				!row.id.includes('passenger_trips__section');
			if (isOperatingDays || isTopLevelModeSection || isTransitTotals) starts.push(i);
		}
		return starts;
	});
	const sectionCardStartSet = $derived(new Set(sectionCardStarts));
	const sectionCardKindByStart = $derived.by<Map<number, CardKind>>(() => {
		const kinds = new Map<number, CardKind>();
		for (const start of sectionCardStarts) {
			const row = rows[start];
			if (!row) continue;
			if (row.id === 'operating_days') {
				kinds.set(start, 'operating');
				continue;
			}
			if (row.id === 'transit_totals_section') {
				kinds.set(start, 'transit');
				continue;
			}
			kinds.set(start, 'mode');
		}
		return kinds;
	});
	const sectionCardKindByRow = $derived.by<CardKind[]>(() => {
		const kinds: CardKind[] = [];
		let current: CardKind = 'mode';
		for (let i = 0; i < rows.length; i++) {
			if (sectionCardStartSet.has(i)) {
				current = sectionCardKindByStart.get(i) ?? 'mode';
			}
			kinds.push(current);
		}
		return kinds;
	});
	const sectionCardEndSet = $derived.by<Set<number>>(() => {
		const ends = new Set<number>();
		for (let i = 0; i < sectionCardStarts.length; i++) {
			const start = sectionCardStarts[i];
			const nextStart = sectionCardStarts[i + 1];
			ends.add(nextStart !== undefined ? nextStart - 1 : rows.length - 1);
		}
		return ends;
	});

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

	function handleGridFocusIn(event: FocusEvent) {
		const target = event.target as HTMLElement | null;
		const input = target?.closest('input[data-r][data-c]') as HTMLInputElement | null;
		if (!input) return;
		const row = Number(input.dataset.r);
		activeRow = Number.isNaN(row) ? null : row;
	}

	function handleGridFocusOut() {
		queueMicrotask(() => {
			const active = document.activeElement as HTMLElement | null;
			const input = active?.closest('input[data-r][data-c]') as HTMLInputElement | null;
			if (!input) {
				activeRow = null;
				return;
			}
			const row = Number(input.dataset.r);
			activeRow = Number.isNaN(row) ? null : row;
		});
	}
</script>

<!-- <div class="rounded-md border border-[#b7b7b7] bg-[#f3f3f3] p-2 shadow-[inset_0_1px_0_#ffffff]"> -->
<div
	class="max-h-[87vh] overflow-auto rounded-sm bg-white"
	onfocusin={handleGridFocusIn}
	onfocusout={handleGridFocusOut}
>
	<table class="w-full border-separate border-spacing-0">
		<thead
			class="border-b border-[#b7b7b7] bg-[#1f1f1f] text-xs tracking-wide text-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
		>
			<tr>
				<th
					class="sticky top-0 left-0 z-40 min-w-[375px] border-r border-[#7d7d7d] bg-[#111111] p-2 text-left font-semibold dark:border-zinc-700 dark:bg-zinc-900"
				>
					<!-- Line Item -->
				</th>

				{#each months as m}
					<th
						class="sticky top-0 z-30 border-r border-[#7d7d7d] bg-[#1f1f1f] p-2 text-center font-semibold dark:border-zinc-700 dark:bg-zinc-900"
					>
						{m}
					</th>
				{/each}

				{#each ['Q1', 'Q2', 'Q3', 'Q4', 'YTD'] as q}
					<th
						class="sticky top-0 z-30 border-r border-[#7d7d7d] bg-[#1f1f1f] p-2 text-center font-semibold dark:border-zinc-700 dark:bg-zinc-900"
					>
						{q}
					</th>
				{/each}
			</tr>
		</thead>

		<tbody class="text-sm">
			{#each rows as row, r}
				{@const isCardStart = sectionCardStartSet.has(r)}
				{@const isCardEnd = sectionCardEndSet.has(r)}
				{@const isTransitTotalsStart = row.id === 'transit_totals_section'}
				{@const isModeSectionHeader =
					row.type === 'section' &&
					((row.id.endsWith('__section') && !row.id.includes('passenger_trips__section')) ||
						row.id === 'transit_totals_section')}

				{@const isLargeHeaderRow = isModeSectionHeader || row.id === 'operating_days'}

				{@const cardKind = sectionCardKindByRow[r]}
				{@const roundTop = isCardStart && cardKind !== 'operating'}
				{@const roundBottom = isCardEnd && cardKind !== 'transit'}
				{#if isCardStart && r !== sectionCardStarts[0]}
					<tr aria-hidden="true">
						<td
							colspan={TOTAL_COLS + 1}
							class="{isTransitTotalsStart ? 'h-4' : 'h-2'} border-0 bg-transparent p-0"
						></td>
					</tr>
				{/if}
				{#if row.type === 'section'}
					<tr
						class="cursor-default border-y border-[#8b8b8b] bg-[#f0f0f0] dark:border-zinc-700 dark:bg-zinc-800"
					>
						<td
							class="sticky left-0 z-20 min-w-[375px] overflow-hidden border border-[#d6d6d6] border-l-[#8b8b8b] bg-[#f0f0f0] p-2.5 pl-6 font-bold text-zinc-900 dark:border-zinc-700 dark:border-l-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 {isLargeHeaderRow
								? 'text-[1.05rem]'
								: 'text-sm'} {roundTop ? 'rounded-tl-lg' : ''} {roundBottom ? 'rounded-bl-lg' : ''}"
						>
							<span
								class="inline-block"
								style={'padding-left:' + (row.indent ? row.indent * 16 : 0) + 'px'}
							>
								{row.label}
							</span>
						</td>
						<td
							colspan={TOTAL_COLS}
							class="overflow-hidden border-r border-[#8b8b8b] bg-[#f0f0f0] dark:border-zinc-700 dark:bg-zinc-800 {roundTop
								? 'rounded-tr-lg'
								: ''} {roundBottom ? 'rounded-br-lg' : ''}"
						></td>
					</tr>
				{:else}
					<tr
						class="
							group border-b border-[#d6d6d6] transition-colors
							hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)] dark:border-zinc-700
							dark:hover:bg-zinc-800/40
								{row.type === 'label' ? 'bg-[#fafafa] dark:bg-zinc-900' : 'bg-white dark:bg-zinc-950'} {isCardStart
							? 'border-t-2 border-[#8b8b8b] dark:border-zinc-700'
							: ''}
								{isCardEnd ? 'border-b-2 border-[#8b8b8b] dark:border-zinc-700' : ''}
						"
					>
						<td
							class="sticky left-0 z-20 cursor-default overflow-hidden border border-[#d6d6d6] border-l-[#8b8b8b] p-2 pl-6 dark:border-zinc-700 dark:border-l-zinc-700 {isLargeHeaderRow
								? 'text-[1.05rem] font-semibold'
								: 'text-base font-medium'} {activeRow === r
								? 'bg-[color-mix(in_srgb,var(--theme-color)_15%,white)] dark:bg-[color-mix(in_srgb,var(--theme-color)_30%,black)]'
								: 'bg-[#f3f3f3] group-hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)] dark:bg-zinc-900 dark:group-hover:bg-zinc-800/40'} {roundTop
								? 'rounded-tl-lg'
								: ''} {roundBottom ? 'rounded-bl-lg' : ''}"
						>
							<span
								class="inline-block"
								style={'padding-left:' + (row.indent ? row.indent * 16 : 0) + 'px'}
							>
								{row.label}
							</span>
						</td>

						{#each Array(COL_MONTHS) as _, c}
							<td
								class="border-r border-b border-[#d6d6d6] bg-white p-0 group-hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)] dark:border-zinc-700 dark:bg-zinc-950 dark:group-hover:bg-zinc-800/40 {canEditCell(
									r,
									c
								)
									? 'cursor-text'
									: 'cursor-not-allowed'}"
							>
								{#if canEditCell(r, c)}
									<input
										class="m-1 w-[calc(100%-0.5rem)] min-w-[calc(7rem-0.5rem)] cursor-text rounded-md border-0 bg-[color-mix(in_srgb,var(--theme-color)_18%,var(--surface-1))] px-2 py-1.5 text-center font-mono text-sm ring-0 transition outline-none group-hover:bg-[color-mix(in_srgb,var(--theme-color)_22%,var(--surface-1))] focus:bg-[color-mix(in_srgb,var(--theme-color)_26%,var(--surface-1))] focus:shadow-[inset_0_0_0_2px_var(--theme-color)] dark:bg-[color-mix(in_srgb,var(--theme-color)_28%,black)] dark:group-hover:bg-[color-mix(in_srgb,var(--theme-color)_34%,black)] dark:focus:bg-[color-mix(in_srgb,var(--theme-color)_40%,black)]"
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
										class="m-1 w-[calc(100%-0.5rem)] min-w-[calc(7rem-0.5rem)] cursor-not-allowed rounded-md bg-[color-mix(in_srgb,var(--accent-color)_14%,var(--surface-1))] px-2 py-2 text-center font-mono font-bold text-zinc-600 group-hover:bg-[color-mix(in_srgb,var(--accent-color)_20%,var(--surface-1))] dark:bg-[color-mix(in_srgb,var(--accent-color)_20%,black)] dark:group-hover:bg-[color-mix(in_srgb,var(--accent-color)_26%,black)]"
									>
										{row.type === 'sum' || (row.type === 'number' && readonly)
											? formatNum(values[r][c], nf)
											: ''}
									</div>
								{/if}
							</td>
						{/each}

						{#each [COL_Q1, COL_Q2, COL_Q3, COL_Q4, COL_YTD] as col, qi}
							<td
								class="cursor-not-allowed overflow-hidden border-r border-b border-[#d6d6d6] bg-[#fcfcfc] p-0 group-hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)] dark:border-zinc-700 dark:bg-zinc-950 dark:group-hover:bg-zinc-800/40 {qi ===
								4
									? 'border-r-[#8b8b8b] dark:border-r-zinc-700'
									: ''} {qi === 4 && roundTop ? 'rounded-tr-lg' : ''} {qi === 4 && roundBottom
									? 'rounded-br-lg'
									: ''}"
							>
								<div
									class="m-1 w-[calc(100%-0.5rem)] min-w-[calc(7rem-0.5rem)] rounded-md bg-[color-mix(in_srgb,var(--accent-color)_14%,var(--surface-1))] px-2 py-2 text-center font-mono font-semibold text-zinc-800 dark:bg-[color-mix(in_srgb,var(--accent-color)_20%,black)] dark:text-zinc-100"
								>
									{formatNum(values[r][col], nf)}
								</div>
							</td>
						{/each}
					</tr>
				{/if}
			{/each}
		</tbody>
	</table>
</div>
<!-- </div> -->
