<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	type RowDef = {
		id: string;
		label: string;
		editableCols: [boolean, boolean, boolean];
		defaults: [number | null, number | null, number | null];
	};

	const COLUMNS = ['Major Events', 'Fatalities', 'Injuries'] as const;

	const ROWS: RowDef[] = [
		{
			id: 'collisions_pedestrians',
			label: 'Collisions with Pedestrian(s)',
			editableCols: [true, true, true],
			defaults: [null, null, null]
		},
		{
			id: 'collisions_vehicles',
			label: 'Collisions with Vehicle(s)',
			editableCols: [true, true, true],
			defaults: [null, null, null]
		},
		{
			id: 'collisions_other',
			label: 'Collisions with Other (e.g. animal, manhole, shopping cart, etc.)',
			editableCols: [true, true, true],
			defaults: [null, null, null]
		},
		{
			id: 'other_major_events',
			label: 'Other Major Events',
			editableCols: [true, true, true],
			defaults: [null, null, null]
		},
		{
			id: 'total_reportable_non_major',
			label: 'Total Reportable injuries from non-major events',
			editableCols: [false, false, true],
			defaults: [null, null, null]
		}
	];

	type GridStore = Record<string, (number | null)[]>;

	function createInitialValues(): GridStore {
		const entries: [string, (number | null)[]][] = ROWS.map((row) => [row.id, [...row.defaults]]);
		return Object.fromEntries(entries);
	}

	function isEditableCellById(rowId: string, colIndex: number): boolean {
		const row = ROWS.find((r) => r.id === rowId);
		return row?.editableCols[colIndex] ?? false;
	}

	let values = $state<GridStore>(createInitialValues());
	let activeRow = $state<number | null>(null);
	const nf = new Intl.NumberFormat('en-US');

	const draftKey = $derived(
		`other-safety-security:${page.params.type}:${Number(page.params.year)}:v2`
	);

	function normalizeDraft(parsed: unknown): GridStore {
		const empty = createInitialValues();
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return empty;

		const record = parsed as Record<string, unknown>;
		for (const row of ROWS) {
			const maybeRow = record[row.id];
			if (!Array.isArray(maybeRow)) continue;
			empty[row.id] = Array.from({ length: COLUMNS.length }, (_, i) => {
				const cell = maybeRow[i];
				if (!row.editableCols[i]) return empty[row.id][i];
				return typeof cell === 'number' || cell === null ? cell : null;
			});
		}

		return empty;
	}

	onMount(() => {
		if (!browser) return;
		try {
			const raw = localStorage.getItem(draftKey);
			if (!raw) return;
			values = normalizeDraft(JSON.parse(raw));
		} catch {
			values = createInitialValues();
		}
	});

	function persistDraft() {
		if (!browser) return;
		const payload: GridStore = {};
		for (const row of ROWS) {
			payload[row.id] = row.editableCols.map((editable, i) =>
				editable ? values[row.id][i] : row.defaults[i]
			);
		}
		localStorage.setItem(draftKey, JSON.stringify(payload));
	}

	function parseCell(raw: string): number | null {
		const cleaned = raw.trim().replace(/,/g, '');
		if (cleaned === '') return null;
		if (!/^\d+$/.test(cleaned)) return null;
		const parsed = Number(cleaned);
		return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
	}

	function fmt(value: number | null): string {
		return typeof value === 'number' ? nf.format(value) : '';
	}

	function onInput(rowId: string, colIndex: number, event: Event) {
		if (!isEditableCellById(rowId, colIndex)) return;
		const input = event.currentTarget as HTMLInputElement;
		if (input.value.trim() === '') {
			values[rowId][colIndex] = null;
			persistDraft();
			return;
		}

		const parsed = parseCell(input.value);
		if (parsed !== null) {
			values[rowId][colIndex] = parsed;
			persistDraft();
		}
	}

	function canEditCell(r: number, c: number): boolean {
		return ROWS[r]?.editableCols[c] ?? false;
	}

	function moveFocus(r: number, c: number) {
		const next = document.querySelector<HTMLInputElement>(`input[data-r="${r}"][data-c="${c}"]`);
		if (next) next.focus();
	}

	function handleKey(event: KeyboardEvent, r: number, c: number) {
		let nr = r;
		let nc = c;
		const navKey = event.key === 'Enter' ? 'ArrowDown' : event.key;
		if (navKey === 'ArrowUp') nr = Math.max(0, r - 1);
		else if (navKey === 'ArrowDown') nr = Math.min(ROWS.length - 1, r + 1);
		else if (navKey === 'ArrowLeft') nc = Math.max(0, c - 1);
		else if (navKey === 'ArrowRight') nc = Math.min(COLUMNS.length - 1, c + 1);
		else return;

		event.preventDefault();

		let guard = 0;
		while (!canEditCell(nr, nc) && guard < 1000) {
			guard++;
			if (navKey === 'ArrowUp') nr = Math.max(0, nr - 1);
			else if (navKey === 'ArrowDown') nr = Math.min(ROWS.length - 1, nr + 1);
			else if (navKey === 'ArrowLeft') nc = Math.max(0, nc - 1);
			else if (navKey === 'ArrowRight') nc = Math.min(COLUMNS.length - 1, nc + 1);
			else break;
		}

		if (canEditCell(nr, nc)) moveFocus(nr, nc);
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

<section class="flex flex-col gap-3">
	<!-- <h1
		class="px-4 text-[2.125rem] font-bold tracking-wide text-[var(--theme-color)] capitalize dark:text-[var(--theme-color)]"
	>
		Other Safety and Security Data
	</h1> -->

	<div
		class="overflow-auto rounded-sm bg-white"
		onfocusin={handleGridFocusIn}
		onfocusout={handleGridFocusOut}
	>
		<table class="carbon-grid w-full border-separate border-spacing-0">
			<thead
				class="sticky top-0 z-30 border-b border-[#b7b7b7] bg-[#1f1f1f] text-[11px] tracking-[0.04em] text-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
			>
				<tr>
					<th
						class="sticky left-0 z-20 min-w-[420px] border-r border-[#7d7d7d] bg-[#111111] px-3 py-3 text-left font-semibold dark:border-zinc-700 dark:bg-zinc-900"
					>
						Event Type
					</th>
					{#each COLUMNS as col}
						<th
							class="min-w-[170px] border-r border-[#7d7d7d] px-3 py-3 text-center font-semibold last:border-r-0 dark:border-zinc-700"
						>
							{col}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each ROWS as row, r}
					{@const isFirstRow = r === 0}
					{@const isLastRow = r === ROWS.length - 1}
					<tr
						class="group border-b border-[#d6d6d6] transition-colors hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)] dark:border-zinc-700 dark:hover:bg-zinc-800/40 {isFirstRow
							? 'border-t-2 border-[#8b8b8b] dark:border-zinc-700'
							: ''} {isLastRow ? 'border-b-2 border-[#8b8b8b] dark:border-zinc-700' : ''}"
					>
						<td
							class="sticky left-0 z-20 overflow-hidden border border-[#d6d6d6] border-l-[#8b8b8b] p-2 pl-6 text-base font-medium dark:border-zinc-700 dark:border-l-zinc-700 {activeRow ===
							r
								? 'bg-[color-mix(in_srgb,var(--theme-color)_15%,white)] dark:bg-[color-mix(in_srgb,var(--theme-color)_30%,black)]'
								: 'bg-[#f3f3f3] group-hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)] dark:bg-zinc-900 dark:group-hover:bg-zinc-800/40'} {isFirstRow
								? 'rounded-tl-lg'
								: ''} {isLastRow ? 'rounded-bl-lg' : ''}"
						>
							{row.label}
						</td>

						{#each COLUMNS as _, colIndex}
							<td
								class="overflow-hidden border-r border-b border-[#d6d6d6] p-0 group-hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)] dark:border-zinc-700 dark:group-hover:bg-zinc-800/40 {colIndex ===
								COLUMNS.length - 1
									? 'border-r-[#8b8b8b] dark:border-r-zinc-700'
									: ''} {colIndex === COLUMNS.length - 1 && isFirstRow
									? 'rounded-tr-lg'
									: ''} {colIndex === COLUMNS.length - 1 && isLastRow ? 'rounded-br-lg' : ''}"
							>
								{#if row.editableCols[colIndex]}
									<input
										type="text"
										inputmode="numeric"
										data-r={r}
										data-c={colIndex}
										class="no-number-spinner m-1 w-[calc(100%-0.5rem)] min-w-[calc(7rem-0.5rem)] rounded-md border-0 bg-[color-mix(in_srgb,var(--theme-color)_18%,var(--surface-1))] px-2 py-1.5 text-center font-mono text-sm text-[var(--text)] ring-0 transition outline-none group-hover:bg-[color-mix(in_srgb,var(--theme-color)_22%,var(--surface-1))] focus:bg-[color-mix(in_srgb,var(--theme-color)_26%,var(--surface-1))] focus:shadow-[inset_0_0_0_2px_var(--theme-color)] dark:bg-[color-mix(in_srgb,var(--theme-color)_28%,black)] dark:text-zinc-100 dark:group-hover:bg-[color-mix(in_srgb,var(--theme-color)_34%,black)] dark:focus:bg-[color-mix(in_srgb,var(--theme-color)_40%,black)]"
										value={fmt(values[row.id][colIndex])}
										onkeydown={(e) => handleKey(e, r, colIndex)}
										oninput={(e) => onInput(row.id, colIndex, e)}
										onblur={(e) => {
											const el = e.currentTarget as HTMLInputElement;
											el.value = fmt(values[row.id][colIndex]);
										}}
									/>
								{:else}
									<div
										class="m-1 w-[calc(100%-0.5rem)] min-w-[calc(7rem-0.5rem)] cursor-not-allowed rounded-md bg-[color-mix(in_srgb,var(--theme-color)_10%,var(--surface-1))] px-2 py-1.5 text-center font-mono text-sm font-semibold text-zinc-800 dark:bg-[color-mix(in_srgb,var(--theme-color)_18%,black)] dark:text-zinc-100"
									>
										{fmt(values[row.id][colIndex])}
									</div>
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
