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

	function normalizeParsedValue(rowIndex: number, parsed: number | null): number | null {
		if (parsed === null) return null;
		if (rows[rowIndex]?.id === 'operating_days') {
			const whole = Math.trunc(parsed);
			return Math.max(0, Math.min(31, whole));
		}
		return parsed;
	}

	function setCell(r: number, c: number, raw: string) {
		if (!canEditCell(r, c)) return;
		const parsed = normalizeParsedValue(r, parseNum(raw));
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
			class="border-b border-[#525252] bg-[#161616] text-[11px] tracking-[0.04em] text-[#f4f4f4] uppercase"
		>
			<tr>
				<th
					class="fiscal-head-grid sticky top-0 left-0 z-40 min-w-[375px] bg-[#161616] px-3 py-3 text-left font-semibold"
				>
					<!-- Line Item -->
				</th>

				{#each months as m}
					<th
						class="fiscal-head-grid sticky top-0 z-30 bg-[#161616] px-3 py-3 text-center font-semibold"
					>
						{m}
					</th>
				{/each}

				{#each ['Q1', 'Q2', 'Q3', 'Q4', 'YTD'] as q}
					<th
						class="fiscal-head-grid sticky top-0 z-30 bg-[#161616] px-3 py-3 text-center font-semibold"
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
						class="cursor-default bg-[var(--surface-2)] dark:bg-zinc-800"
					>
						<td
							class="sticky left-0 z-20 min-w-[375px] overflow-hidden border border-[#d6d6d6] bg-[var(--surface-2)] p-2.5 pl-6 font-bold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 {isLargeHeaderRow
								? 'text-[1.05rem]'
								: 'text-sm'}"
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
							class="fiscal-cell-grid overflow-hidden border-l border-l-[#d6d6d6] bg-[var(--surface-2)] dark:border-l-zinc-700 dark:bg-zinc-800"
						></td>
					</tr>
				{:else}
					<tr
						class="
							group border-b border-[#d6d6d6] transition-colors
							hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)] dark:border-zinc-700
							dark:hover:bg-zinc-800/40
								{row.type === 'label' ? 'bg-[#fafafa] dark:bg-zinc-900' : 'bg-white dark:bg-zinc-950'} {isCardStart
							? 'border-t border-[#d6d6d6] dark:border-zinc-700'
							: ''}
								{isCardEnd ? 'border-b border-[#d6d6d6] dark:border-zinc-700' : ''}
						"
					>
						<td
							class="sticky left-0 z-20 cursor-default overflow-hidden border border-[#d6d6d6] p-2 pl-6 dark:border-zinc-700 {isLargeHeaderRow
								? 'text-[1.05rem] font-semibold'
								: 'text-base font-medium'} {activeRow === r
								? 'bg-[color-mix(in_srgb,var(--theme-color)_15%,white)] dark:bg-[color-mix(in_srgb,var(--theme-color)_30%,black)]'
								: 'bg-[#f3f3f3] group-hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)] dark:bg-zinc-900 dark:group-hover:bg-zinc-800/40'}"
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
								class="fiscal-cell-grid p-0 {canEditCell(
									r,
									c
								)
									? 'cursor-text bg-white'
									: 'fiscal-readonly-stripe cursor-not-allowed'}"
							>
								{#if canEditCell(r, c)}
									<input
										class="w-full min-w-[7rem] cursor-text border-0 bg-white px-3 py-2 text-center font-mono text-[13px] text-[var(--text)] ring-0 outline-none focus:shadow-[inset_0_0_0_2px_var(--theme-color)] dark:bg-zinc-950 dark:text-zinc-100"
										class:no-number-spinner={rows[r]?.id === 'operating_days'}
										type={rows[r]?.id === 'operating_days' ? 'number' : 'text'}
										min={rows[r]?.id === 'operating_days' ? 0 : undefined}
										max={rows[r]?.id === 'operating_days' ? 31 : undefined}
										step={rows[r]?.id === 'operating_days' ? 1 : undefined}
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
											const parsed = normalizeParsedValue(r, parseNum(el.value));
											if (parsed !== null || el.value === '') {
												values[r][c] = parsed;
												recalcAll(rows, values, colConfig, rowIndexById);
												onValuesChange?.(values);
												if (rows[r]?.id === 'operating_days') {
													el.value = parsed === null ? '' : String(parsed);
												}
											}
										}}
										onblur={(e) => {
											const el = e.currentTarget as HTMLInputElement;
											el.value = formatNum(values[r][c], nf);
										}}
									/>
								{:else}
									<div
										class="w-full min-w-[7rem] cursor-not-allowed bg-transparent px-3 py-2 text-center font-mono text-[13px] font-semibold text-zinc-600 dark:text-zinc-300"
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
								class="fiscal-readonly-stripe fiscal-cell-grid cursor-not-allowed overflow-hidden p-0 {qi ===
								4
									? 'border-r-[#dcdcdc] dark:border-r-zinc-700'
									: ''}"
							>
								<div
									class="w-full min-w-[7rem] bg-transparent px-3 py-2 text-center font-mono text-[13px] font-semibold text-zinc-700 dark:text-zinc-200"
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

<style>
	.fiscal-head-grid {
		border-right: 1px solid #393939;
		border-bottom: 1px solid #525252;
	}

	.fiscal-cell-grid {
		border-right: 1px solid #e7e7e7;
		border-bottom: 1px solid #d0d0d0;
	}

	.fiscal-readonly-stripe {
		background-color: #fafafa;
		background-image: repeating-linear-gradient(
			-45deg,
			#fafafa 0px,
			#fafafa 10px,
			#f6f6f6 10px,
			#f6f6f6 20px
		);
	}

	:global(.dark) .fiscal-readonly-stripe {
		background-color: #303030;
		background-image: repeating-linear-gradient(
			-45deg,
			#303030 0px,
			#303030 10px,
			#353535 10px,
			#353535 20px
		);
	}

	:global(.dark) .fiscal-head-grid {
		border-right-color: #525252;
		border-bottom-color: #6f6f6f;
	}

	:global(.dark) .fiscal-cell-grid {
		border-right-color: #4b4b4b;
		border-bottom-color: #5a5a5a;
	}
</style>
