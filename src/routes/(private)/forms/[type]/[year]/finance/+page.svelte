<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { URBAN_MODES } from '$lib/shared/rules/modes.rules';

	type RowType = 'section' | 'input' | 'sum';
	type ModeValues = (number | null)[];

	type FinanceRow = {
		id: string;
		label: string;
		type: RowType;
		sumOf?: string[];
	};

	const MODE_COLUMNS = URBAN_MODES.map((m) => ({ id: m.id, label: m.label }));
	const MODE_COLS = MODE_COLUMNS.length;

	const ROWS: FinanceRow[] = [
		{ id: 'section_expenses', label: 'I. Operating Expenses', type: 'section' },
		{ id: 'total_system_expenses', label: 'A. Total System Expenses', type: 'input' },

		{ id: 'section_revenues', label: 'II. Operating Revenues', type: 'section' },
		{ id: 'passenger_fares', label: 'A. Passenger Fares (Farebox)', type: 'input' },
		{ id: 'special_transit_fares', label: 'B. Special Transit Fares', type: 'input' },
		{ id: 'other_transport_revenue', label: 'C. Other Transportation Revenues', type: 'input' },
		{ id: 'non_transport_revenue', label: 'D. Non-Transportation Revenues', type: 'input' },
		{
			id: 'total_revenue',
			label: 'E. Total Revenue',
			type: 'sum',
			sumOf: [
				'passenger_fares',
				'special_transit_fares',
				'other_transport_revenue',
				'non_transport_revenue'
			]
		},

		{ id: 'section_assistance', label: 'III. Operating Assistance', type: 'section' },
		{ id: 'federal_assistance', label: 'A. Federal Assistance', type: 'input' },
		{ id: 'state_assistance', label: 'B. State Assistance', type: 'input' },
		{ id: 'local_gov_assistance', label: 'C. Local Government Assistance', type: 'input' },
		{ id: 'other_assistance', label: 'D. Other Assistance', type: 'input' },
		{
			id: 'total_operating_assistance',
			label: 'E. Total Operating Assistance',
			type: 'sum',
			sumOf: ['federal_assistance', 'state_assistance', 'local_gov_assistance', 'other_assistance']
		}
	];

	type DraftStore = Record<string, ModeValues>;

	function createEmptyDraft(): DraftStore {
		const entries: [string, ModeValues][] = ROWS.filter((r) => r.type === 'input').map((r) => [
			r.id,
			Array.from({ length: MODE_COLS }, () => null)
		]);
		return Object.fromEntries(entries);
	}

	let draft = $state<DraftStore>(createEmptyDraft());
	let activeRow = $state<number | null>(null);
	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	const nf = new Intl.NumberFormat('en-US');
	const sectionStarts = ROWS.map((row, index) => (row.type === 'section' ? index : -1)).filter(
		(index) => index >= 0
	);
	const sectionStartSet = new Set(sectionStarts);
	const sectionEndSet = new Set(
		sectionStarts.map((start, i) =>
			i + 1 < sectionStarts.length ? sectionStarts[i + 1] - 1 : ROWS.length - 1
		)
	);

	const type = $derived(page.params.type as 'urban' | 'rural');
	const year = $derived(Number(page.params.year));
	const isUrban = $derived(type === 'urban');
	const draftKey = $derived(`finance:${type}:${year}:urban-financial`);

	function normalizeDraft(parsed: unknown): DraftStore {
		const empty = createEmptyDraft();
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return empty;

		const record = parsed as Record<string, unknown>;
		for (const row of ROWS) {
			if (row.type !== 'input') continue;
			const maybeRow = record[row.id];
			if (!Array.isArray(maybeRow)) continue;
			empty[row.id] = Array.from({ length: MODE_COLS }, (_, i) => {
				const cell = maybeRow[i];
				return typeof cell === 'number' || cell === null ? cell : null;
			});
		}
		return empty;
	}

	onMount(() => {
		if (!browser || !isUrban) return;
		try {
			const raw = localStorage.getItem(draftKey);
			if (!raw) return;
			draft = normalizeDraft(JSON.parse(raw));
		} catch {
			draft = createEmptyDraft();
		}
	});

	$effect(() => {
		if (!browser || !isUrban) return;
		draft;
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			localStorage.setItem(draftKey, JSON.stringify(draft));
		}, 250);
	});

	function parseCell(raw: string): number | null {
		const trimmed = raw.trim().replace(/,/g, '');
		if (trimmed === '') return null;
		if (!/^\d+$/.test(trimmed)) return null;
		const n = Number(trimmed);
		return Number.isInteger(n) && n >= 0 ? n : null;
	}

	function setInputCell(rowId: string, colIndex: number, raw: string) {
		const parsed = parseCell(raw);
		if (parsed === null && raw.trim() !== '') return;
		draft[rowId][colIndex] = parsed;
	}

	function getModeValue(row: FinanceRow, colIndex: number): number | null {
		if (row.type === 'section') return null;

		if (row.type === 'input') {
			return draft[row.id]?.[colIndex] ?? null;
		}

		let sum = 0;
		let hasAny = false;
		for (const sourceId of row.sumOf ?? []) {
			const value = draft[sourceId]?.[colIndex];
			if (typeof value === 'number') {
				sum += value;
				hasAny = true;
			}
		}
		return hasAny ? sum : null;
	}

	function getRowTotal(row: FinanceRow): number | null {
		if (row.type === 'section') return null;
		let sum = 0;
		let hasAny = false;
		for (let c = 0; c < MODE_COLS; c++) {
			const value = getModeValue(row, c);
			if (typeof value === 'number') {
				sum += value;
				hasAny = true;
			}
		}
		return hasAny ? sum : null;
	}

	function fmt(n: number | null): string {
		return n == null ? '' : nf.format(n);
	}

	function canEditRow(rowIndex: number): boolean {
		return ROWS[rowIndex]?.type === 'input';
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
		else if (event.key === 'ArrowRight') nc = Math.min(MODE_COLS - 1, c + 1);
		else return;

		event.preventDefault();

		let guard = 0;
		while (!canEditRow(nr) && guard < 1000) {
			guard++;
			if (event.key === 'ArrowUp') nr = Math.max(0, nr - 1);
			else if (event.key === 'ArrowDown') nr = Math.min(ROWS.length - 1, nr + 1);
			else return;
		}

		if (canEditRow(nr)) moveFocus(nr, nc);
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
	<!--
	<h1
		class="px-4 text-[2.125rem] font-bold tracking-wide text-[var(--theme-color)] capitalize dark:text-[var(--accent-color)]"
	>
		Financial
	</h1>
	-->

	{#if !isUrban}
		<div
			class="rounded-lg border border-zinc-300 bg-zinc-50 p-4 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
		>
			Urban Financial grid is only available for Urban forms.
		</div>
	{:else}
		<div
			class="overflow-auto rounded-sm bg-white"
			onfocusin={handleGridFocusIn}
			onfocusout={handleGridFocusOut}
		>
			<table class="w-full border-separate border-spacing-0">
				<thead
					class="sticky top-0 z-30 border-b border-[#b7b7b7] bg-[#1f1f1f] text-xs tracking-wide text-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
				>
					<tr>
						<th
							class="sticky left-0 z-20 min-w-[370px] border-r border-[#7d7d7d] bg-[#111111] p-2 text-left font-semibold dark:border-zinc-700 dark:bg-zinc-900"
						>
							Line Item
						</th>

						{#each MODE_COLUMNS as col}
							<th
								class="min-w-[130px] border-r border-[#7d7d7d] p-2 text-center font-semibold uppercase dark:border-zinc-700"
							>
								{col.label}
							</th>
						{/each}

						<th
							class="min-w-[130px] border-r border-[#7d7d7d] p-2 text-center font-semibold uppercase dark:border-zinc-700"
						>
							Total
						</th>
					</tr>
				</thead>

				<tbody class="text-sm">
					{#each ROWS as row, r}
						{@const isSectionStart = sectionStartSet.has(r)}
						{@const isSectionEnd = sectionEndSet.has(r)}
						{#if isSectionStart && r !== sectionStarts[0]}
							<tr aria-hidden="true">
								<td colspan={MODE_COLS + 2} class="h-2 border-0 bg-transparent p-0"></td>
							</tr>
						{/if}
						{#if row.type === 'section'}
							<tr
								class="cursor-default border-y border-[#8b8b8b] bg-[#f0f0f0] dark:border-zinc-700 dark:bg-zinc-800"
							>
								<td
									colspan={MODE_COLS + 2}
									class="overflow-hidden rounded-t-lg border border-[#8b8b8b] bg-[#f0f0f0] p-2.5 text-[1.05rem] font-bold text-zinc-900 uppercase dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
								>
									{row.label}
								</td>
							</tr>
						{:else}
							<tr
								class="group border-b border-[#d6d6d6] transition-colors hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)] dark:border-zinc-700 dark:hover:bg-zinc-800/40 {isSectionStart
									? 'border-t-2 border-[#8b8b8b] dark:border-zinc-700'
									: ''} {isSectionEnd ? 'border-b-2 border-[#8b8b8b] dark:border-zinc-700' : ''}"
							>
								<td
									class="sticky left-0 z-20 overflow-hidden border border-[#d6d6d6] border-l-[#8b8b8b] p-2 font-medium dark:border-zinc-700 dark:border-l-zinc-700 {activeRow ===
									r
										? 'bg-[color-mix(in_srgb,var(--theme-color)_15%,white)] dark:bg-[color-mix(in_srgb,var(--theme-color)_30%,black)]'
										: 'bg-[#f3f3f3] group-hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)] dark:bg-zinc-900 dark:group-hover:bg-zinc-800/40'} {isSectionStart
										? 'rounded-tl-lg'
										: ''} {isSectionEnd ? 'rounded-bl-lg' : ''}"
								>
									{row.label}
								</td>

								{#each MODE_COLUMNS as _, c}
									<td
										class="border-r border-b border-[#d6d6d6] p-0 group-hover:bg-[color-mix(in_srgb,var(--surface-2)_80%,white_20%)] dark:border-zinc-700 dark:group-hover:bg-zinc-800/40"
									>
										{#if row.type === 'input'}
											<input
												type="text"
												inputmode="numeric"
												data-r={r}
												data-c={c}
												autocomplete="off"
												autocapitalize="off"
												spellcheck="false"
												class="m-1 w-[calc(100%-0.5rem)] min-w-[calc(7rem-0.5rem)] rounded-md border-0 bg-[color-mix(in_srgb,var(--theme-color)_18%,var(--surface-1))] px-2 py-1.5 text-center font-mono text-sm text-zinc-900 ring-0 transition outline-none group-hover:bg-[color-mix(in_srgb,var(--theme-color)_22%,var(--surface-1))] focus:bg-[color-mix(in_srgb,var(--theme-color)_26%,var(--surface-1))] focus:shadow-[inset_0_0_0_2px_var(--theme-color)] dark:bg-[color-mix(in_srgb,var(--theme-color)_28%,black)] dark:text-zinc-100 dark:group-hover:bg-[color-mix(in_srgb,var(--theme-color)_34%,black)] dark:focus:bg-[color-mix(in_srgb,var(--theme-color)_40%,black)]"
												value={fmt(getModeValue(row, c))}
												oninput={(e) => {
													const el = e.currentTarget as HTMLInputElement;
													setInputCell(row.id, c, el.value);
												}}
												onblur={(e) => {
													const el = e.currentTarget as HTMLInputElement;
													el.value = fmt(getModeValue(row, c));
												}}
												onkeydown={(e) => handleKey(e, r, c)}
											/>
										{:else}
											<div
												class="m-1 w-[calc(100%-0.5rem)] min-w-[calc(7rem-0.5rem)] cursor-not-allowed rounded-md bg-[color-mix(in_srgb,var(--accent-color)_14%,var(--surface-1))] px-2 py-2 text-center font-mono font-semibold text-zinc-800 dark:bg-[color-mix(in_srgb,var(--accent-color)_20%,black)] dark:text-zinc-100"
											>
												{fmt(getModeValue(row, c))}
											</div>
										{/if}
									</td>
								{/each}

								<td
									class="overflow-hidden border-r border-b border-[#d6d6d6] bg-white p-0 dark:border-zinc-700 dark:bg-zinc-950 {isSectionStart
										? 'rounded-tr-lg border-r-[#8b8b8b] dark:border-r-zinc-700'
										: ''} {isSectionEnd
										? 'rounded-br-lg border-r-[#8b8b8b] dark:border-r-zinc-700'
										: ''}"
								>
									<div
										class="m-1 w-[calc(100%-0.5rem)] min-w-[calc(7rem-0.5rem)] cursor-not-allowed rounded-md bg-[color-mix(in_srgb,var(--accent-color)_14%,var(--surface-1))] px-2 py-2 text-center font-mono font-semibold text-zinc-800 dark:bg-[color-mix(in_srgb,var(--accent-color)_20%,black)] dark:text-zinc-100"
									>
										{fmt(getRowTotal(row))}
									</div>
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>
