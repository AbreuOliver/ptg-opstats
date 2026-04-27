<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { URBAN_MODES } from '$lib/shared/rules/modes.rules';

	type DraftStore = Record<string, (number | null)[]>;
	type CompletionDraft = {
		surplusTransitAccount: number | null;
		surplusOtherPurpose: number | null;
		surplusExplain: string;
		deficitDrawDownTransitAccount: number | null;
		deficitLocalGovernmentFunds: number | null;
		deficitOther: number | null;
		deficitExplain: string;
		authorizedOfficial: string;
		authorizedDate: string;
		financialManager: string;
		financialDate: string;
	};

	const MODE_COLUMNS = URBAN_MODES.map((m) => ({ id: m.id, label: m.label }));
	const MODE_COUNT = MODE_COLUMNS.length;
	const FINANCE_ROW_IDS = {
		expenses: 'total_system_expenses',
		revenue: 'total_revenue',
		assistance: 'total_operating_assistance'
	} as const;
	const REVENUE_SOURCE_ROW_IDS = [
		'passenger_fares',
		'special_transit_fares',
		'other_transport_revenue',
		'non_transport_revenue'
	] as const;
	const ASSISTANCE_SOURCE_ROW_IDS = [
		'federal_assistance',
		'state_assistance',
		'local_gov_assistance',
		'other_assistance'
	] as const;

	const type = $derived(page.params.type as 'urban' | 'rural');
	const year = $derived(Number(page.params.year));
	const agencyName = $derived((page.url.searchParams.get('agency') ?? 'Agency').toUpperCase());
	const financeKey = $derived(`finance:${type}:${year}:urban-financial`);
	const completionKey = $derived(`completion:${type}:${year}:rural`);

	const emptyDraft = (): CompletionDraft => ({
		surplusTransitAccount: null,
		surplusOtherPurpose: null,
		surplusExplain: '',
		deficitDrawDownTransitAccount: null,
		deficitLocalGovernmentFunds: null,
		deficitOther: null,
		deficitExplain: '',
		authorizedOfficial: '',
		authorizedDate: '',
		financialManager: '',
		financialDate: ''
	});

	let completion = $state<CompletionDraft>(emptyDraft());
	let financeDraft = $state<DraftStore>({});
	let saveTimer: ReturnType<typeof setTimeout> | null = null;

	const nf = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	});

	function asModeArray(value: unknown): (number | null)[] {
		if (!Array.isArray(value)) return Array.from({ length: MODE_COUNT }, () => null);
		return Array.from({ length: MODE_COUNT }, (_, i) => {
			const cell = value[i];
			return typeof cell === 'number' ? cell : null;
		});
	}

	function sumModeArrays(parsed: Record<string, unknown>, rowIds: readonly string[]): (number | null)[] {
		return Array.from({ length: MODE_COUNT }, (_, modeIndex) => {
			let sum = 0;
			let hasAny = false;
			for (const rowId of rowIds) {
				const row = asModeArray(parsed[rowId]);
				const value = row[modeIndex];
				if (typeof value === 'number') {
					sum += value;
					hasAny = true;
				}
			}
			return hasAny ? sum : null;
		});
	}

	function loadFinanceDraft() {
		if (!browser) return;
		try {
			const raw = localStorage.getItem(financeKey);
			if (!raw) {
				financeDraft = {};
				return;
			}
			const parsed = JSON.parse(raw) as Record<string, unknown>;
			financeDraft = {
				[FINANCE_ROW_IDS.expenses]: asModeArray(parsed[FINANCE_ROW_IDS.expenses]),
				[FINANCE_ROW_IDS.revenue]: sumModeArrays(parsed, REVENUE_SOURCE_ROW_IDS),
				[FINANCE_ROW_IDS.assistance]: sumModeArrays(parsed, ASSISTANCE_SOURCE_ROW_IDS)
			};
		} catch {
			financeDraft = {};
		}
	}

	function loadCompletionDraft() {
		if (!browser) return;
		try {
			const raw = localStorage.getItem(completionKey);
			if (!raw) {
				completion = emptyDraft();
				return;
			}
			const parsed = JSON.parse(raw) as Partial<CompletionDraft>;
			completion = { ...emptyDraft(), ...parsed };
		} catch {
			completion = emptyDraft();
		}
	}

	onMount(() => {
		loadFinanceDraft();
		loadCompletionDraft();
	});

	$effect(() => {
		if (!browser) return;
		completion;
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			localStorage.setItem(completionKey, JSON.stringify(completion));
		}, 250);
	});

	$effect(() => {
		if (!browser) return;
		financeKey;
		loadFinanceDraft();
	});

	function modeValue(rowId: keyof typeof FINANCE_ROW_IDS, modeIndex: number): number | null {
		const rowValues = financeDraft[FINANCE_ROW_IDS[rowId]];
		const value = rowValues?.[modeIndex];
		return typeof value === 'number' ? value : null;
	}

	function rowTotal(rowId: keyof typeof FINANCE_ROW_IDS): number | null {
		let total = 0;
		let hasAny = false;
		for (let i = 0; i < MODE_COUNT; i++) {
			const value = modeValue(rowId, i);
			if (typeof value === 'number') {
				total += value;
				hasAny = true;
			}
		}
		return hasAny ? total : null;
	}

	function fmtCurrency(n: number | null): string {
		return n == null ? '' : nf.format(n);
	}

	function parseMoney(raw: string): number | null {
		const cleaned = raw.replace(/[$,\s]/g, '');
		if (cleaned === '') return null;
		if (!/^-?\d+$/.test(cleaned)) return null;
		const parsed = Number(cleaned);
		return Number.isFinite(parsed) ? parsed : null;
	}

	function setMoneyField(
		field:
			| 'surplusTransitAccount'
			| 'surplusOtherPurpose'
			| 'deficitDrawDownTransitAccount'
			| 'deficitLocalGovernmentFunds'
			| 'deficitOther',
		raw: string
	) {
		const parsed = parseMoney(raw);
		if (parsed === null && raw.trim() !== '') return;
		completion[field] = parsed;
	}

	function displayMoney(n: number | null): string {
		return n == null ? '' : fmtCurrency(n);
	}
</script>

<section class="flex flex-col gap-3">
	{#if type !== 'rural'}
		<div
			class="rounded-lg border border-zinc-300 bg-zinc-50 p-4 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
		>
			Completion is only available for Rural forms.
		</div>
	{:else}
		<div class="mx-auto mb-10 flex w-full flex-col rounded-sm border border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--shadow)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
			<header class="flex items-end justify-between border-b border-[var(--border)] px-4 py-3">
				<h2 class="text-2xl font-bold text-[var(--theme-color)]">Reconciliation</h2>
				<div class="text-lg font-semibold text-[var(--theme-color)]">FY{year}!!!</div>
			</header>

			<div class="overflow-auto p-0">
				<table class="carbon-grid w-full border-separate border-spacing-0 text-sm">
					<thead class="bg-[var(--surface-2)] text-[11px] tracking-[0.04em] text-[var(--text-muted)] uppercase">
						<tr>
							<th class="sticky left-0 z-20 min-w-[320px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-left font-semibold">Line Item</th>
							{#each MODE_COLUMNS as col}
								<th class="min-w-[130px] border border-[var(--border)] px-3 py-3 text-center font-semibold">{col.label} Services</th>
							{/each}
							<th class="min-w-[130px] border border-[var(--border)] px-3 py-3 text-center font-semibold">Total</th>
						</tr>
					</thead>
					<tbody class="text-sm">
						<tr class="group border-b border-[var(--border)]">
							<th class="sticky left-0 z-10 border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-left text-base font-medium">Total Operating Expenses</th>
							{#each MODE_COLUMNS as _, i}
								<td class="border border-[var(--border)] p-0">
									<div class="min-w-[7rem] px-3 py-3 text-center font-mono text-sm font-semibold text-[var(--text)]">
										{fmtCurrency(modeValue('expenses', i))}
									</div>
								</td>
							{/each}
							<td class="border border-[var(--border)] p-0">
								<div class="min-w-[7rem] px-3 py-3 text-center font-mono text-sm font-semibold text-[var(--text)]">
									{fmtCurrency(rowTotal('expenses'))}
								</div>
							</td>
						</tr>
						<tr class="group border-b border-[var(--border)]">
							<th class="sticky left-0 z-10 border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-left text-base font-medium">Total Operating Revenues</th>
							{#each MODE_COLUMNS as _, i}
								<td class="border border-[var(--border)] p-0">
									<div class="min-w-[7rem] px-3 py-3 text-center font-mono text-sm font-semibold text-[var(--text)]">
										{fmtCurrency(modeValue('revenue', i))}
									</div>
								</td>
							{/each}
							<td class="border border-[var(--border)] p-0">
								<div class="min-w-[7rem] px-3 py-3 text-center font-mono text-sm font-semibold text-[var(--text)]">
									{fmtCurrency(rowTotal('revenue'))}
								</div>
							</td>
						</tr>
						<tr class="group border-b border-[var(--border)]">
							<th class="sticky left-0 z-10 border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-left text-base font-medium">Total Operating Assistance</th>
							{#each MODE_COLUMNS as _, i}
								<td class="border border-[var(--border)] p-0">
									<div class="min-w-[7rem] px-3 py-3 text-center font-mono text-sm font-semibold text-[var(--text)]">
										{fmtCurrency(modeValue('assistance', i))}
									</div>
								</td>
							{/each}
							<td class="border border-[var(--border)] p-0">
								<div class="min-w-[7rem] px-3 py-3 text-center font-mono text-sm font-semibold text-[var(--text)]">
									{fmtCurrency(rowTotal('assistance'))}
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div class="border-t border-[var(--border)] p-2">
				<h3 class="text-lg font-semibold text-[var(--text)] uppercase">Remainder</h3>

			</div>

			<div class="border-t border-[var(--border)] p-2">
				<div class="grid gap-4 md:grid-cols-[1fr_260px]">
					<div class="space-y-1 text-md text-[var(--secondary-accent)]">
						<div class="font-semibold text-[var(--text)]">Surplus</div>
						<div>(1) Put in transit account</div>
						<div>(2) Used for other purpose</div>
						<div>(Explain below)</div>
					</div>
					<div class="space-y-2">
						<input
							type="text"
							class="w-full rounded-[2px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-right font-mono text-sm focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-zinc-800"
							value={displayMoney(completion.surplusTransitAccount)}
							oninput={(e) =>
								setMoneyField('surplusTransitAccount', (e.currentTarget as HTMLInputElement).value)}
							onblur={(e) =>
								((e.currentTarget as HTMLInputElement).value = displayMoney(completion.surplusTransitAccount))}
						/>
						<input
							type="text"
							class="w-full rounded-[2px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-right font-mono text-sm focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-zinc-800"
							value={displayMoney(completion.surplusOtherPurpose)}
							oninput={(e) => setMoneyField('surplusOtherPurpose', (e.currentTarget as HTMLInputElement).value)}
							onblur={(e) =>
								((e.currentTarget as HTMLInputElement).value = displayMoney(completion.surplusOtherPurpose))}
						/>
					</div>
				</div>
				<textarea
					class="mt-3 h-24 w-full rounded-[2px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-zinc-800"
					placeholder="Explain surplus usage..."
					bind:value={completion.surplusExplain}
				></textarea>
			</div>

			<div class="border-t border-[var(--border)] p-2">
				<div class="grid gap-4 md:grid-cols-[1fr_260px]">
					<div class="space-y-1 text-md text-[var(--secondary-accent)]">
						<div class="font-semibold text-[var(--text)]">Deficit</div>
						<div>(1) Draw down transit account</div>
						<div>(2) Local government funds</div>
						<div>(3) Other</div>
						<div>(Explain below)</div>
					</div>
					<div class="space-y-2">
						<input
							type="text"
							class="w-full rounded-[2px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-right font-mono text-sm focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-zinc-800"
							value={displayMoney(completion.deficitDrawDownTransitAccount)}
							oninput={(e) =>
								setMoneyField('deficitDrawDownTransitAccount', (e.currentTarget as HTMLInputElement).value)}
							onblur={(e) =>
								((e.currentTarget as HTMLInputElement).value = displayMoney(completion.deficitDrawDownTransitAccount))}
						/>
						<input
							type="text"
							class="w-full rounded-[2px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-right font-mono text-sm focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-zinc-800"
							value={displayMoney(completion.deficitLocalGovernmentFunds)}
							oninput={(e) =>
								setMoneyField('deficitLocalGovernmentFunds', (e.currentTarget as HTMLInputElement).value)}
							onblur={(e) =>
								((e.currentTarget as HTMLInputElement).value = displayMoney(completion.deficitLocalGovernmentFunds))}
						/>
						<input
							type="text"
							class="w-full rounded-[2px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-right font-mono text-sm focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-zinc-800"
							value={displayMoney(completion.deficitOther)}
							oninput={(e) => setMoneyField('deficitOther', (e.currentTarget as HTMLInputElement).value)}
							onblur={(e) =>
								((e.currentTarget as HTMLInputElement).value = displayMoney(completion.deficitOther))}
						/>
					</div>
				</div>
				<textarea
					class="mt-3 h-24 w-full rounded-[2px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-zinc-800"
					placeholder="Explain deficit funding..."
					bind:value={completion.deficitExplain}
				></textarea>
			</div>

			<div class="border-t border-[var(--border)] p-2">
				<div class="mb-3 text-sm font-medium text-[var(--text)]">
					I hereby certify that, to the best of my knowledge, the information in this report is accurate and complete.
				</div>
				<div class="grid gap-3 md:grid-cols-2">
					<div>
						<label class="mb-1 block text-sm font-medium text-[var(--text)]" for="authorized-official">Signature of Authorized Official</label>
						<input
							id="authorized-official"
							type="text"
							class="w-full rounded-[2px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-zinc-800"
							bind:value={completion.authorizedOfficial}
						/>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-[var(--text)]" for="authorized-date">Date</label>
						<input
							id="authorized-date"
							type="text"
							placeholder="MM/DD/YYYY"
							class="w-full rounded-[2px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-zinc-800"
							bind:value={completion.authorizedDate}
						/>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-[var(--text)]" for="financial-manager">Signature of Financial Manager</label>
						<input
							id="financial-manager"
							type="text"
							class="w-full rounded-[2px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-zinc-800"
							bind:value={completion.financialManager}
						/>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-[var(--text)]" for="financial-date">Date</label>
						<input
							id="financial-date"
							type="text"
							placeholder="MM/DD/YYYY"
							class="w-full rounded-[2px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-zinc-800"
							bind:value={completion.financialDate}
						/>
					</div>
				</div>
			</div>

			<div class="border-t border-[var(--border)] p-2 text-sm text-[var(--text)]">
				<strong>Submission:</strong> Upload the Excel file and signed PDFs (4th quarter only) to NCDOT's Partner Connect
			</div>
		</div>
	{/if}
</section>
