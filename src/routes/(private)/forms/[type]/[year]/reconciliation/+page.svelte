<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { URBAN_MODES } from '$lib/shared/rules/modes.rules';
	import { loadCapabilities } from '$lib/features/forms/shared/stores/capabilities.store';

	type DraftStore = Record<string, (number | null)[]>;

	type ReconciliationDraft = {
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

	const MODE_COLUMNS = URBAN_MODES.map((m, index) => ({ id: m.id, label: m.label, index }));
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
	const isUrban = $derived(type === 'urban');
	const capabilities = $derived(loadCapabilities(type, year));
	function normalizeModeId(mode: string): string {
		return mode.trim().toLowerCase().replace(/-/g, '_');
	}
	const selectedUrbanModes = $derived(
		new Set((capabilities?.selectedModes ?? []).map((m) => normalizeModeId(m)))
	);
	const visibleModeColumns = $derived(
		MODE_COLUMNS.filter((col) => selectedUrbanModes.has(normalizeModeId(col.id)))
	);
	const financeKey = $derived(`finance:${type}:${year}:urban-financial`);
	const reconciliationKey = $derived(`reconciliation:${type}:${year}:urban`);
	const agencyName = $derived((page.url.searchParams.get('agency') ?? 'Agency').toUpperCase());

	const emptyDraft = (): ReconciliationDraft => ({
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

	let reconciliation = $state<ReconciliationDraft>(emptyDraft());
	let financeDraft = $state<DraftStore>({});
	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	const nf = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

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
		if (!browser || !isUrban) return;
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

	function loadReconciliationDraft() {
		if (!browser || !isUrban) return;
		try {
			const raw = localStorage.getItem(reconciliationKey);
			if (!raw) {
				reconciliation = emptyDraft();
				return;
			}
			const parsed = JSON.parse(raw) as Partial<ReconciliationDraft>;
			reconciliation = {
				...emptyDraft(),
				...parsed
			};
		} catch {
			reconciliation = emptyDraft();
		}
	}

	onMount(() => {
		loadFinanceDraft();
		loadReconciliationDraft();
	});

	$effect(() => {
		if (!browser || !isUrban) return;
		reconciliation;
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			localStorage.setItem(reconciliationKey, JSON.stringify(reconciliation));
		}, 250);
	});

	$effect(() => {
		if (!browser || !isUrban) return;
		financeKey;
		loadFinanceDraft();
	});

	function modeValue(rowId: keyof typeof FINANCE_ROW_IDS, modeIndex: number): number | null {
		const rowValues = financeDraft[FINANCE_ROW_IDS[rowId]];
		const v = rowValues?.[modeIndex];
		return typeof v === 'number' ? v : null;
	}

	function rowTotal(rowId: keyof typeof FINANCE_ROW_IDS): number | null {
		let total = 0;
		let hasAny = false;
		for (const col of visibleModeColumns) {
			const value = modeValue(rowId, col.index);
			if (typeof value === 'number') {
				total += value;
				hasAny = true;
			}
		}
		return hasAny ? total : null;
	}

	const remainderTotal = $derived.by<number | null>(() => {
		const expenses = rowTotal('expenses');
		const revenue = rowTotal('revenue');
		const assistance = rowTotal('assistance');
		if (expenses == null && revenue == null && assistance == null) return null;
		return (expenses ?? 0) - ((revenue ?? 0) + (assistance ?? 0));
	});
	const isSurplus = $derived.by(() => remainderTotal != null && remainderTotal < 0);
	const isDeficit = $derived.by(() => remainderTotal != null && remainderTotal > 0);
	const remainderLabel = $derived.by(() => {
		if (remainderTotal == null || remainderTotal === 0) return 'Balanced';
		return isSurplus ? 'Surplus' : 'Deficit';
	});
	const remainderDisplayAmount = $derived.by<number | null>(() => {
		if (remainderTotal == null) return null;
		return Math.abs(remainderTotal);
	});

	function fmtCurrency(n: number | null): string {
		if (n == null) return '';
		return nf.format(n);
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
		reconciliation[field] = parsed;
	}

	function displayMoney(n: number | null): string {
		return n == null ? '' : fmtCurrency(n);
	}
</script>

<section class="flex flex-col gap-3">
	{#if !isUrban}
		<div
			class="rounded-lg border border-zinc-300 bg-zinc-50 p-4 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
		>
			Reconciliation is only available for Urban forms.
		</div>
	{:else}
		<div
			class="mx-auto mb-10 flex w-full flex-col rounded-sm border border-[var(--border)] bg-[var(--surface-1)] shadow-[var(--shadow)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none"
		>
			<header class="flex items-end justify-between border-b border-[var(--border)] px-4 py-0">
				<!-- <h2 class="text-xl font-bold text-[var(--theme-color)]">7. Reconciliation {agencyName}</h2> -->
				<!-- <div class="text-lg font-semibold text-[var(--theme-color)]">FY{year}</div> -->
			</header>

			<div class="overflow-auto p-0">
				<table class="carbon-grid w-full table-fixed border-separate border-spacing-0 text-[13px]">
					<colgroup>
						<col style="width: 300px;" />
						{#each visibleModeColumns as _}
							<col style="width: 130px;" />
						{/each}
						<col style="width: 240px;" />
					</colgroup>
					<thead class="bg-[var(--surface-2)] text-[11px] tracking-[0.04em] text-[var(--text-muted)] uppercase">
						<tr>
							<th class="sticky left-0 z-20 border border-[var(--border)] bg-[#111111] px-3 py-3 text-left font-semibold text-white dark:bg-zinc-900">Line Item</th>
							{#each visibleModeColumns as col}
								<th class="border border-[var(--border)] px-3 py-3 text-center font-semibold">
									{col.label} Services
								</th>
							{/each}
							<th class="border border-[var(--border)] px-3 py-3 text-center font-semibold whitespace-nowrap">Total</th>
						</tr>
					</thead>
					<tbody class="text-[13px]">
						<tr>
							<th class="sticky left-0 z-10 border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-left text-[1.05rem] font-bold">Total Operating Expenses</th>
							{#each visibleModeColumns as col}
								<td class="border border-[var(--border)] px-3 py-3 text-center font-mono text-[13px]">{fmtCurrency(modeValue('expenses', col.index))}</td>
							{/each}
							<td class="border border-[var(--border)] px-3 py-3 text-center font-mono text-[13px] font-semibold whitespace-nowrap">{fmtCurrency(rowTotal('expenses'))}</td>
						</tr>
						<tr>
							<th class="sticky left-0 z-10 border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-left text-[1.05rem] font-bold">Total Operating Revenues</th>
							{#each visibleModeColumns as col}
								<td class="border border-[var(--border)] px-3 py-3 text-center font-mono text-[13px]">{fmtCurrency(modeValue('revenue', col.index))}</td>
							{/each}
							<td class="border border-[var(--border)] px-3 py-3 text-center font-mono text-[13px] font-semibold whitespace-nowrap">{fmtCurrency(rowTotal('revenue'))}</td>
						</tr>
						<tr>
							<th class="sticky left-0 z-10 border border-[var(--border)] bg-[var(--surface-2)] px-3 py-3 text-left text-[1.05rem] font-bold">Total Operating Assistance</th>
							{#each visibleModeColumns as col}
								<td class="border border-[var(--border)] px-3 py-3 text-center font-mono text-[13px]">{fmtCurrency(modeValue('assistance', col.index))}</td>
							{/each}
							<td class="border border-[var(--border)] px-3 py-3 text-center font-mono text-[13px] font-semibold whitespace-nowrap">{fmtCurrency(rowTotal('assistance'))}</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div class="border-t border-[var(--border)] p-2">
				<h3 class="text-[1.05rem] font-bold text-[var(--text)]">Remainder</h3>
				<p class="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
					If <span class="font-mono">[Total Expenses - (Total Revenues + Total Assistance)]</span> results in a Surplus, complete
					section below to identify how the surplus will be used. If result is a Deficit, complete
					section below to identify source of funds used to cover the deficit.
				</p>
				<div class="mt-2 grid gap-2 md:grid-cols-[1fr_260px]">
					<div class="text-sm font-semibold text-[var(--text)]">
						Total Expenses - (Total Revenues + Total Assistance)
					</div>
					<div
						class={`rounded-[2px] border border-[var(--border)] px-3 py-2 text-right font-mono text-sm font-semibold ${
							isSurplus
								? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
								: isDeficit
									? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
									: 'bg-[var(--surface-2)] text-[var(--text)] dark:bg-zinc-800'
						}`}
					>
						{remainderLabel}: {fmtCurrency(remainderDisplayAmount)}
					</div>
				</div>
			</div>

			<div class="border-t border-[var(--border)] p-2">
				<div class="grid gap-4 md:grid-cols-[1fr_260px]">
					<div class="space-y-1 text-md">
						<div class="font-semibold text-[var(--text)]">Surplus</div>
						<div class="text-[var(--text-muted)]">(1) Put in transit account</div>
						<div class="text-[var(--text-muted)]">(2) Used for other purpose</div>
						<div class="text-[var(--text-muted)]">(Explain below)</div>
					</div>
					<div class="space-y-2">
						<input
							type="text"
							disabled={!isSurplus}
							class="w-full rounded-[2px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-right font-mono focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:opacity-100 disabled:bg-[repeating-linear-gradient(-45deg,#fafafa_0px,#fafafa_10px,#f6f6f6_10px,#f6f6f6_20px)] dark:border-zinc-700 dark:bg-zinc-800 dark:disabled:bg-[repeating-linear-gradient(-45deg,#303030_0px,#303030_10px,#353535_10px,#353535_20px)]"
							value={displayMoney(reconciliation.surplusTransitAccount)}
							oninput={(e) =>
								setMoneyField(
									'surplusTransitAccount',
									(e.currentTarget as HTMLInputElement).value
								)}
							onblur={(e) =>
								((e.currentTarget as HTMLInputElement).value = displayMoney(
									reconciliation.surplusTransitAccount
								))}
						/>
						<input
							type="text"
							disabled={!isSurplus}
							class="w-full rounded-[2px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-right font-mono focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:opacity-100 disabled:bg-[repeating-linear-gradient(-45deg,#fafafa_0px,#fafafa_10px,#f6f6f6_10px,#f6f6f6_20px)] dark:border-zinc-700 dark:bg-zinc-800 dark:disabled:bg-[repeating-linear-gradient(-45deg,#303030_0px,#303030_10px,#353535_10px,#353535_20px)]"
							value={displayMoney(reconciliation.surplusOtherPurpose)}
							oninput={(e) =>
								setMoneyField('surplusOtherPurpose', (e.currentTarget as HTMLInputElement).value)}
							onblur={(e) =>
								((e.currentTarget as HTMLInputElement).value = displayMoney(
									reconciliation.surplusOtherPurpose
								))}
						/>
					</div>
				</div>
				<textarea
					disabled={!isSurplus}
					class="mt-3 h-24 w-full rounded-[2px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:opacity-100 disabled:bg-[repeating-linear-gradient(-45deg,#fafafa_0px,#fafafa_10px,#f6f6f6_10px,#f6f6f6_20px)] dark:border-zinc-700 dark:bg-zinc-800 dark:disabled:bg-[repeating-linear-gradient(-45deg,#303030_0px,#303030_10px,#353535_10px,#353535_20px)]"
					placeholder="Explain surplus usage..."
					bind:value={reconciliation.surplusExplain}
				></textarea>
			</div>

			<div class="border-t border-[var(--border)] p-2">
				<div class="grid gap-4 md:grid-cols-[1fr_260px]">
					<div class="space-y-1 text-md">
						<div class="font-semibold text-[var(--text)]">Deficit</div>
						<div class="text-[var(--text-muted)]">(1) Draw down transit account</div>
						<div class="text-[var(--text-muted)]">(2) Local government funds</div>
						<div class="text-[var(--text-muted)]">(3) Other</div>
						<div class="text-[var(--text-muted)]">(Explain below)</div>
					</div>
					<div class="space-y-2">
						<input
							type="text"
							disabled={!isDeficit}
							class="w-full rounded-[2px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-right font-mono focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:opacity-100 disabled:bg-[repeating-linear-gradient(-45deg,#fafafa_0px,#fafafa_10px,#f6f6f6_10px,#f6f6f6_20px)] dark:border-zinc-700 dark:bg-zinc-800 dark:disabled:bg-[repeating-linear-gradient(-45deg,#303030_0px,#303030_10px,#353535_10px,#353535_20px)]"
							value={displayMoney(reconciliation.deficitDrawDownTransitAccount)}
							oninput={(e) =>
								setMoneyField(
									'deficitDrawDownTransitAccount',
									(e.currentTarget as HTMLInputElement).value
								)}
							onblur={(e) =>
								((e.currentTarget as HTMLInputElement).value = displayMoney(
									reconciliation.deficitDrawDownTransitAccount
								))}
						/>
						<input
							type="text"
							disabled={!isDeficit}
							class="w-full rounded-[2px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-right font-mono focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:opacity-100 disabled:bg-[repeating-linear-gradient(-45deg,#fafafa_0px,#fafafa_10px,#f6f6f6_10px,#f6f6f6_20px)] dark:border-zinc-700 dark:bg-zinc-800 dark:disabled:bg-[repeating-linear-gradient(-45deg,#303030_0px,#303030_10px,#353535_10px,#353535_20px)]"
							value={displayMoney(reconciliation.deficitLocalGovernmentFunds)}
							oninput={(e) =>
								setMoneyField(
									'deficitLocalGovernmentFunds',
									(e.currentTarget as HTMLInputElement).value
								)}
							onblur={(e) =>
								((e.currentTarget as HTMLInputElement).value = displayMoney(
									reconciliation.deficitLocalGovernmentFunds
								))}
						/>
						<input
							type="text"
							disabled={!isDeficit}
							class="w-full rounded-[2px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-right font-mono focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:opacity-100 disabled:bg-[repeating-linear-gradient(-45deg,#fafafa_0px,#fafafa_10px,#f6f6f6_10px,#f6f6f6_20px)] dark:border-zinc-700 dark:bg-zinc-800 dark:disabled:bg-[repeating-linear-gradient(-45deg,#303030_0px,#303030_10px,#353535_10px,#353535_20px)]"
							value={displayMoney(reconciliation.deficitOther)}
							oninput={(e) => setMoneyField('deficitOther', (e.currentTarget as HTMLInputElement).value)}
							onblur={(e) =>
								((e.currentTarget as HTMLInputElement).value = displayMoney(reconciliation.deficitOther))}
						/>
					</div>
				</div>
				<textarea
					disabled={!isDeficit}
					class="mt-3 h-24 w-full rounded-[2px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:opacity-100 disabled:bg-[repeating-linear-gradient(-45deg,#fafafa_0px,#fafafa_10px,#f6f6f6_10px,#f6f6f6_20px)] dark:border-zinc-700 dark:bg-zinc-800 dark:disabled:bg-[repeating-linear-gradient(-45deg,#303030_0px,#303030_10px,#353535_10px,#353535_20px)]"
					placeholder="Explain deficit funding..."
					bind:value={reconciliation.deficitExplain}
				></textarea>
			</div>

			<div class="border-t border-[var(--border)] p-2">
				<div class="mb-3 text-sm font-medium text-[var(--text)]">
					I hereby certify that, to the best of my knowledge, the information in this report is accurate and complete.
				</div>
				<div class="grid gap-3 md:grid-cols-2">
					<div>
						<label class="mb-1 block text-sm font-medium text-[var(--text)]">Signature of Authorized Official</label>
						<input
							type="text"
							class="w-full rounded-[2px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-zinc-800"
							bind:value={reconciliation.authorizedOfficial}
						/>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-[var(--text)]">Date</label>
						<input
							type="text"
							class="w-full rounded-[2px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-zinc-800"
							placeholder="MM/DD/YYYY"
							bind:value={reconciliation.authorizedDate}
						/>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-[var(--text)]">Signature of Financial Manager</label>
						<input
							type="text"
							class="w-full rounded-[2px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-zinc-800"
							bind:value={reconciliation.financialManager}
						/>
					</div>
					<div>
						<label class="mb-1 block text-sm font-medium text-[var(--text)]">Date</label>
						<input
							type="text"
							class="w-full rounded-[2px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1 dark:border-zinc-700 dark:bg-zinc-800"
							placeholder="MM/DD/YYYY"
							bind:value={reconciliation.financialDate}
						/>
					</div>
				</div>
			</div>



			<div class="px-4 pb-4 text-xs text-[var(--text-muted)]">
				Computed remainder total: {remainderLabel} {fmtCurrency(remainderDisplayAmount)}.
			</div>
		</div>
	{/if}
</section>
