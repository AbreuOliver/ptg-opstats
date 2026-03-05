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

	function onInput(rowId: string, colIndex: number, event: Event) {
		if (!isEditableCellById(rowId, colIndex)) return;
		const input = event.currentTarget as HTMLInputElement;
		if (input.value.trim() === '') {
			values[rowId][colIndex] = null;
			persistDraft();
			return;
		}

		const parsed = Number(input.value);
		if (Number.isInteger(parsed) && parsed >= 0) {
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
		if (event.key === 'ArrowUp') nr = Math.max(0, r - 1);
		else if (event.key === 'ArrowDown') nr = Math.min(ROWS.length - 1, r + 1);
		else if (event.key === 'ArrowLeft') nc = Math.max(0, c - 1);
		else if (event.key === 'ArrowRight') nc = Math.min(COLUMNS.length - 1, c + 1);
		else return;

		event.preventDefault();

		let guard = 0;
		while (!canEditCell(nr, nc) && guard < 1000) {
			guard++;
			if (event.key === 'ArrowUp') nr = Math.max(0, nr - 1);
			else if (event.key === 'ArrowDown') nr = Math.min(ROWS.length - 1, nr + 1);
			else if (event.key === 'ArrowLeft') nc = Math.max(0, nc - 1);
			else if (event.key === 'ArrowRight') nc = Math.min(COLUMNS.length - 1, nc + 1);
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
	<h1
		class="px-4 text-[2.125rem] font-bold tracking-wide text-[var(--theme-color)] capitalize dark:text-[var(--theme-color)]"
	>
		Other Safety and Security Data
	</h1>

	<div
		class="overflow-auto rounded-sm border border-[#c6c6c6] bg-white"
		onfocusin={handleGridFocusIn}
		onfocusout={handleGridFocusOut}
	>
		<table class="w-full border-collapse">
			<thead
				class="sticky top-0 z-30 border-b border-[#b7b7b7] bg-[#1f1f1f] text-xs tracking-wide text-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
			>
				<tr>
					<th
						class="sticky left-0 z-20 min-w-[600px] border-r border-[#7d7d7d] bg-[#111111] p-2 text-left text-sm font-semibold dark:border-zinc-700 dark:bg-zinc-900"
					>
						Event Type
					</th>
					{#each COLUMNS as col}
						<th
							class="min-w-[200px] border-r border-[#7d7d7d] p-2 pr-3 text-right text-sm font-semibold last:border-r-0 dark:border-zinc-700"
						>
							{col}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each ROWS as row, r}
					<tr
						class="group border-b border-[#d6d6d6] transition-colors hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)] dark:border-zinc-700 dark:hover:bg-zinc-800/40"
					>
						<td
							class="sticky left-0 z-20 border-r border-[#d6d6d6] p-2 text-sm font-medium dark:border-zinc-700 {activeRow ===
							r
								? 'bg-[color-mix(in_srgb,var(--theme-color)_15%,white)] dark:bg-[color-mix(in_srgb,var(--theme-color)_30%,black)]'
								: 'bg-[#f3f3f3] group-hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)] dark:bg-zinc-900 dark:group-hover:bg-zinc-800/40'}"
						>
							{row.label}
						</td>

						{#each COLUMNS as _, colIndex}
							<td
								class="border-r border-[#d6d6d6] p-0 group-hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)] last:border-r-0 dark:border-zinc-700 dark:group-hover:bg-zinc-800/40"
							>
								{#if row.editableCols[colIndex]}
									<input
										type="number"
										min="0"
										step="1"
										inputmode="numeric"
										data-r={r}
										data-c={colIndex}
										class="no-number-spinner w-full min-w-28 border-0 bg-white px-2 py-1.5 pr-3 text-right font-mono text-sm text-[var(--text)] ring-0 transition outline-none group-hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)] focus:rounded-md focus:bg-[color-mix(in_srgb,var(--theme-color)_10%,white)] focus:shadow-[inset_0_0_0_2px_var(--theme-color)] dark:bg-zinc-900 dark:text-zinc-100 dark:group-hover:bg-zinc-800/40 dark:focus:bg-zinc-800"
										value={values[row.id][colIndex] ?? ''}
										onkeydown={(e) => handleKey(e, r, colIndex)}
										oninput={(e) => onInput(row.id, colIndex, e)}
									/>
								{:else}
									<div
										class="w-full min-w-[7rem] cursor-not-allowed bg-white px-2 py-1.5 pr-3 text-right font-mono text-sm font-semibold text-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
									>
										{values[row.id][colIndex] ?? ''}
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
