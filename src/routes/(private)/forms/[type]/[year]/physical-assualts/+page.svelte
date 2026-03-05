<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	type RowDef = { id: string; label: string };
	type SectionDef = { title: string; rows: RowDef[] };

	const COLUMNS = [
		'In Transit Vehicle',
		'In Revenue Facility',
		'In Non-Revenue Facility',
		'In Other Location'
	] as const;

	const SECTIONS: SectionDef[] = [
		{
			title: 'Total Event Counts',
			rows: [
				{ id: 'major_safety_security_events', label: 'Major Safety and Security Events' },
				{ id: 'non_major_events', label: 'Non-Major Events (non-injury)' }
			]
		},
		{
			title: 'Injuries Counts',
			rows: [
				{ id: 'operator_injuries', label: 'Operator Injuries' },
				{ id: 'other_transit_worker_injuries', label: 'Other Transit Worker Injuries' },
				{ id: 'other_injuries', label: 'Other Injuries' }
			]
		},
		{
			title: 'Fatalities Counts',
			rows: [
				{ id: 'operator_fatalities', label: 'Operator Fatalities' },
				{ id: 'other_transit_worker_fatalities', label: 'Other-Transit Worker Fatalities' },
				{ id: 'other_fatalities', label: 'Other Fatalities' }
			]
		}
	];
	const FLAT_ROWS = SECTIONS.flatMap((s) => s.rows);
	const rowIndexById = new Map(FLAT_ROWS.map((row, index) => [row.id, index]));

	type GridStore = Record<string, (number | null)[]>;
	const SLUG = 'physical-assualts';

	const createInitialValues = (): GridStore =>
		Object.fromEntries(
			SECTIONS.flatMap((section) =>
				section.rows.map((row) => [row.id, Array.from({ length: COLUMNS.length }, () => null)])
			)
		);

	let values = $state<GridStore>(createInitialValues());
	let activeRow = $state<number | null>(null);
	let saveTimer: ReturnType<typeof setTimeout> | null = null;

	const draftKey = $derived(`assualts:${page.params.type}:${Number(page.params.year)}:${SLUG}`);

	function normalizeDraft(parsed: unknown): GridStore {
		const empty = createInitialValues();
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return empty;

		const record = parsed as Record<string, unknown>;
		for (const section of SECTIONS) {
			for (const row of section.rows) {
				const maybeRow = record[row.id];
				if (!Array.isArray(maybeRow)) continue;

				const normalized = Array.from({ length: COLUMNS.length }, (_, i) => {
					const cell = maybeRow[i];
					return typeof cell === 'number' || cell === null ? cell : null;
				});
				empty[row.id] = normalized;
			}
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

	$effect(() => {
		if (!browser) return;
		values;
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			localStorage.setItem(draftKey, JSON.stringify(values));
		}, 250);
	});

	function onInput(rowId: string, colIndex: number, event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		if (input.value.trim() === '') {
			values[rowId][colIndex] = null;
			return;
		}

		const parsed = Number(input.value);
		if (Number.isInteger(parsed) && parsed >= 0) {
			values[rowId][colIndex] = parsed;
		}
	}

	function moveFocus(r: number, c: number) {
		const next = document.querySelector<HTMLInputElement>(`input[data-r="${r}"][data-c="${c}"]`);
		if (next) next.focus();
	}

	function handleKey(event: KeyboardEvent, r: number, c: number) {
		let nr = r;
		let nc = c;
		if (event.key === 'ArrowUp') nr = Math.max(0, r - 1);
		else if (event.key === 'ArrowDown') nr = Math.min(FLAT_ROWS.length - 1, r + 1);
		else if (event.key === 'ArrowLeft') nc = Math.max(0, c - 1);
		else if (event.key === 'ArrowRight') nc = Math.min(COLUMNS.length - 1, c + 1);
		else return;

		event.preventDefault();
		moveFocus(nr, nc);
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
		Physical Assualts
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
						class="sticky left-0 z-20 min-w-[320px] border-r border-[#7d7d7d] bg-[#111111] p-2 text-left text-sm font-semibold dark:border-zinc-700 dark:bg-zinc-900"
					>
						Category
					</th>
					{#each COLUMNS as col}
						<th
							class="min-w-[170px] border-r border-[#7d7d7d] p-2 pr-3 text-right text-sm font-semibold last:border-r-0 dark:border-zinc-700"
						>
							{col}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each SECTIONS as section}
					<tr class="border-y border-[#8b8b8b] bg-[#f0f0f0] dark:border-zinc-700 dark:bg-zinc-800">
						<td
							colspan={1 + COLUMNS.length}
							class="p-2.5 text-sm font-bold text-zinc-900 dark:text-zinc-100"
						>
							{section.title}
						</td>
					</tr>

					{#each section.rows as row}
						<tr
							class="group border-b border-[#d6d6d6] transition-colors hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)] dark:border-zinc-700 dark:hover:bg-zinc-800/40"
						>
							<td
								class="sticky left-0 z-20 border-r border-[#d6d6d6] p-2 text-sm font-medium dark:border-zinc-700 {activeRow ===
								rowIndexById.get(row.id)
									? 'bg-[color-mix(in_srgb,var(--theme-color)_15%,white)] dark:bg-[color-mix(in_srgb,var(--theme-color)_30%,black)]'
									: 'bg-[#f3f3f3] group-hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)] dark:bg-zinc-900 dark:group-hover:bg-zinc-800/40'}"
							>
								{row.label}
							</td>

							{#each COLUMNS as _, colIndex}
								<td
									class="border-r border-[#d6d6d6] p-0 group-hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)] last:border-r-0 dark:border-zinc-700 dark:group-hover:bg-zinc-800/40"
								>
									<input
										type="number"
										min="0"
										step="1"
										inputmode="numeric"
										data-r={rowIndexById.get(row.id)}
										data-c={colIndex}
										class="no-number-spinner w-full min-w-28 border-0 bg-white px-2 py-1.5 pr-3 text-right font-mono text-sm text-[var(--text)] ring-0 transition outline-none group-hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)] focus:rounded-md focus:bg-[color-mix(in_srgb,var(--theme-color)_10%,white)] focus:shadow-[inset_0_0_0_2px_var(--theme-color)] dark:bg-zinc-900 dark:text-zinc-100 dark:group-hover:bg-zinc-800/40 dark:focus:bg-zinc-800"
										value={values[row.id][colIndex] ?? ''}
										onkeydown={(e) => handleKey(e, rowIndexById.get(row.id) ?? 0, colIndex)}
										oninput={(e) => onInput(row.id, colIndex, e)}
									/>
								</td>
							{/each}
						</tr>
					{/each}
				{/each}
			</tbody>
		</table>
	</div>
</section>
