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

	type GridStore = Record<string, (number | null)[]>;
	const SLUG = 'physical-assualts';

	const createInitialValues = (): GridStore =>
		Object.fromEntries(
			SECTIONS.flatMap((section) =>
				section.rows.map((row) => [row.id, Array.from({ length: COLUMNS.length }, () => null)])
			)
		);

	let values = $state<GridStore>(createInitialValues());
	let saveTimer: ReturnType<typeof setTimeout> | null = null;

	const draftKey = $derived(
		`assualts:${page.params.type}:${Number(page.params.year)}:${SLUG}`
	);

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
</script>

<section class="flex flex-col">
	<h1 class="mb-4 pl-4 text-3xl font-semibold text-zinc-800 dark:text-white">Physical Assualts</h1>

	<div class="overflow-auto rounded-lg border border-zinc-300 dark:border-zinc-800">
		<table class="w-full border-collapse">
			<thead class="bg-zinc-50 dark:bg-zinc-900">
				<tr>
					<th
						class="sticky left-0 z-10 min-w-[320px] border-r border-zinc-300 bg-zinc-50 p-3 text-left text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
					>
						Category
					</th>
					{#each COLUMNS as col}
						<th
							class="min-w-[170px] border-r border-zinc-300 p-3 text-center text-sm font-semibold text-zinc-700 last:border-r-0 dark:border-zinc-700 dark:text-zinc-200"
						>
							{col}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each SECTIONS as section}
					<tr class="border-y border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
						<td
							colspan={1 + COLUMNS.length}
							class="p-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100"
						>
							{section.title}
						</td>
					</tr>

					{#each section.rows as row}
						<tr class="border-b border-zinc-300 dark:border-zinc-700">
							<td
								class="sticky left-0 z-10 border-r border-zinc-300 bg-white p-3 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
							>
								{row.label}
							</td>

							{#each COLUMNS as _, colIndex}
								<td class="border-r border-zinc-300 p-2 last:border-r-0 dark:border-zinc-700">
									<input
										type="number"
										min="0"
										step="1"
										inputmode="numeric"
										class="w-full rounded-md border border-zinc-300 bg-[var(--surface-2)] px-2 py-1.5 text-center text-sm text-[var(--text)] outline-none focus:border-transparent focus:ring-2 focus:ring-[var(--theme-color)] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
										value={values[row.id][colIndex] ?? ''}
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
