<script lang="ts">
	// Fiscal Data Grid — July→June + Q1..Q4 + YTD
	// - Integers only (change parse/format if you want decimals)
	// - FY starts in July
	// - Quarter & YTD columns are computed (read-only)
	// - "section" rows are big headers; "label" rows are one-line labels;
	//   "number" rows accept input; "sum" rows are computed from other rows.

	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	const STORAGE_KEY = 'fy-grid-v2';

	let saveTimer: ReturnType<typeof setTimeout> | null = null;

	// --- MONTHS / COLUMNS ------------------------------------------------------

	const fiscalStartMonthIndex = 6; // 0-based: 6 = July
	const baseMonths = [
		'Jan',
		'Feb',
		'Mar',
		'Apr',
		'May',
		'Jun',
		'Jul',
		'Aug',
		'Sep',
		'Oct',
		'Nov',
		'Dec'
	];

	function rotate<T>(arr: T[], start: number) {
		return [...arr.slice(start), ...arr.slice(0, start)];
	}

	const months = rotate(baseMonths, fiscalStartMonthIndex); // ["Jul","Aug",...,"Jun"]

	const COL_MONTHS = months.length; // 12
	const COL_Q1 = COL_MONTHS + 0;
	const COL_Q2 = COL_MONTHS + 1;
	const COL_Q3 = COL_MONTHS + 2;
	const COL_Q4 = COL_MONTHS + 3;
	const COL_YTD = COL_MONTHS + 4;
	const TOTAL_COLS = COL_MONTHS + 5;

	const quarterIndices = {
		q1: [0, 1, 2],
		q2: [3, 4, 5],
		q3: [6, 7, 8],
		q4: [9, 10, 11]
	};

	// --- ROW / MODE DEFINITIONS -----------------------------------------------

	type RowKind = 'section' | 'label' | 'number' | 'sum';

	type RowDef = {
		id: string;
		type: RowKind;
		label: string;
		indent?: number;
		/** for sum rows: which other row ids to sum */
		sumOf?: string[];
	};

	type ModeId = 'dr_do' | 'dr_pt' | 'mb_do' | 'mb_pt';

	type ModeDef = {
		id: ModeId;
		label: string;
	};

	// Base template of rows for each operating mode
	const MODE_ROW_TEMPLATE: Omit<RowDef, 'id' | 'sumOf'> &
		{
			idSuffix: string;
			sumOfSuffixes?: string[];
		}[] = [
		{ idSuffix: 'hours', type: 'number', label: 'Hours' },
		{ idSuffix: 'miles', type: 'number', label: 'Miles' },
		{
			idSuffix: 'pt_nc',
			type: 'number',
			label: 'Passenger Trips: Non-Contract'
		},
		{
			idSuffix: 'medicaid',
			type: 'number',
			label: '  Medicaid Contract',
			indent: 1
		},
		{
			idSuffix: 'nonmedicaid',
			type: 'number',
			label: '  Non-Medicaid Contract',
			indent: 1
		},
		{
			idSuffix: 'total_trips',
			type: 'sum',
			label: 'Total Passenger Trips for This Mode',
			sumOfSuffixes: ['pt_nc', 'medicaid', 'nonmedicaid']
		}
	];

	// You can change this per agency: pick any combination of modes
	const selectedModes: ModeDef[] = [
		{ id: 'dr_do', label: 'Demand Response Directly Operated (DR DO)' },
		{ id: 'dr_pt', label: 'Demand Response Purchased (DR PT)' },
		{ id: 'mb_do', label: 'Fixed Route Directly Operated (MB DO)' }
		// ,{ id: 'mb_pt', label: 'Fixed Route Purchased (MB PT)' }
	];

	// Build the full schema for this sheet
	const schema: RowDef[] = (() => {
		const rows: RowDef[] = [];

		// Top-level row
		rows.push({
			id: 'operating_days',
			type: 'number',
			label: 'Operating Days'
		});

		for (const mode of selectedModes) {
			// Section header for the mode
			rows.push({
				id: `${mode.id}__section`,
				type: 'section',
				label: mode.label
			});

			// Mode-specific rows
			for (const base of MODE_ROW_TEMPLATE) {
				const id = `${mode.id}__${base.idSuffix}`;
				const sumOf =
					base.type === 'sum' && base.sumOfSuffixes
						? base.sumOfSuffixes.map((s) => `${mode.id}__${s}`)
						: undefined;

				rows.push({
					id,
					type: base.type,
					label: base.label,
					indent: base.indent,
					sumOf
				});
			}
		}

		return rows;
	})();

	const R = schema.length;

	// Map row id → index to help with sum-row calculations
	const rowIndexById = new Map<string, number>();
	schema.forEach((row, idx) => rowIndexById.set(row.id, idx));

	// --- STATE -----------------------------------------------------------------

	let values: (number | null)[][] = Array.from({ length: R }, () =>
		Array.from({ length: TOTAL_COLS }, () => null)
	);

	let lastFocused: { r: number; c: number } | null = null;

	// --- NUMBER HELPERS --------------------------------------------------------

	const nf = new Intl.NumberFormat('en-US');

	function formatNum(n: number | null): string {
		if (n === null || Number.isNaN(n)) return '';
		return nf.format(n);
	}

	function parseNum(s: string): number | null {
		const cleaned = s.replace(/[,\s]/g, '');
		if (cleaned === '') return null;
		if (!/^-?\d+$/.test(cleaned)) return null;
		const n = parseInt(cleaned, 10);
		if (Number.isNaN(n)) return null;
		return n;
	}

	// --- STORAGE ---------------------------------------------------------------

	function saveToStorage() {
		if (!browser) return;
		try {
			const payload = {
				version: 2,
				values
			};
			localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
		} catch {
			// ignore
		}
	}

	function queueSave() {
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(saveToStorage, 300);
	}

	function loadFromStorage() {
		if (!browser) return false;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return false;
			const parsed = JSON.parse(raw);
			if (!parsed?.values) return false;

			if (
				Array.isArray(parsed.values) &&
				parsed.values.length === R &&
				parsed.values.every((row: unknown) => Array.isArray(row) && row.length === TOTAL_COLS)
			) {
				values = parsed.values;
				return true;
			}
		} catch {
			return false;
		}
		return false;
	}

	function clearStorage() {
		if (!browser) return;
		localStorage.removeItem(STORAGE_KEY);
	}

	// --- GRID LOGIC ------------------------------------------------------------

	function isEditableCell(rowIndex: number, colIndex: number): boolean {
		const row = schema[rowIndex];
		// Only "number" rows' month columns are editable
		if (row.type !== 'number') return false;
		if (colIndex >= COL_MONTHS) return false;
		return true;
	}

	function recalcRow(rowIndex: number) {
		const row = schema[rowIndex];

		// 1. For sum rows, compute month cells from their source rows
		if (row.type === 'sum' && row.sumOf && row.sumOf.length > 0) {
			for (let m = 0; m < COL_MONTHS; m++) {
				const sum = row.sumOf.reduce((acc, id) => {
					const srcIdx = rowIndexById.get(id);
					if (srcIdx == null) return acc;
					const v = values[srcIdx][m];
					return acc + (typeof v === 'number' ? v : 0);
				}, 0);
				values[rowIndex][m] = sum;
			}
		}

		// 2. Compute Q1..Q4..YTD for number and sum rows
		if (row.type === 'number' || row.type === 'sum') {
			const sumMonths = (idxs: number[]) =>
				idxs.reduce((acc, m) => acc + (values[rowIndex][m] ?? 0), 0);

			values[rowIndex][COL_Q1] = sumMonths(quarterIndices.q1);
			values[rowIndex][COL_Q2] = sumMonths(quarterIndices.q2);
			values[rowIndex][COL_Q3] = sumMonths(quarterIndices.q3);
			values[rowIndex][COL_Q4] = sumMonths(quarterIndices.q4);
			values[rowIndex][COL_YTD] =
				(values[rowIndex][COL_Q1] ?? 0) +
				(values[rowIndex][COL_Q2] ?? 0) +
				(values[rowIndex][COL_Q3] ?? 0) +
				(values[rowIndex][COL_Q4] ?? 0);
			return;
		}

		// 3. Non-numeric rows: clear computed cells
		values[rowIndex][COL_Q1] = null;
		values[rowIndex][COL_Q2] = null;
		values[rowIndex][COL_Q3] = null;
		values[rowIndex][COL_Q4] = null;
		values[rowIndex][COL_YTD] = null;
	}

	function recalcAll() {
		for (let r = 0; r < R; r++) recalcRow(r);
	}

	function setCell(r: number, c: number, raw: string) {
		if (!isEditableCell(r, c)) return;
		const parsed = parseNum(raw);
		if (parsed === null && raw !== '') return;
		values[r][c] = parsed;
		recalcAll(); // <- recompute all rows, including sum rows
		queueSave?.();
	}

	// Pasting a grid into the table from the current focused cell
	function handlePaste(e: ClipboardEvent, r: number, c: number) {
		const text = e.clipboardData?.getData('text');
		if (!text) return;
		e.preventDefault();

		const rows = text.split(/\r?\n/).filter((line) => line.length > 0);
		for (let i = 0; i < rows.length; i++) {
			const cols = rows[i].split('\t');
			for (let j = 0; j < cols.length; j++) {
				const rr = r + i;
				const cc = c + j;
				if (rr >= R || cc >= TOTAL_COLS) continue;
				if (!isEditableCell(rr, cc)) continue;
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
			if (isEditableCell(nr, nc)) return moveFocus(nr, nc);

			let guard = 0;
			while (!isEditableCell(nr, nc) && guard < 1000) {
				guard++;
				if (e.key === 'ArrowUp') nr = Math.max(0, nr - 1);
				else if (e.key === 'ArrowDown') nr = Math.min(R - 1, nr + 1);
				else if (e.key === 'ArrowLeft') nc = Math.max(0, nc - 1);
				else if (e.key === 'ArrowRight') nc = Math.min(COL_MONTHS - 1, nc + 1);
				else return;
			}
			if (isEditableCell(nr, nc)) moveFocus(nr, nc);
		};

		if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
			e.preventDefault();
			if (e.key === 'ArrowUp') nr = Math.max(0, r - 1);
			if (e.key === 'ArrowDown') nr = Math.min(R - 1, r + 1);
			if (e.key === 'ArrowLeft') nc = Math.max(0, c - 1);
			if (e.key === 'ArrowRight') nc = Math.min(COL_MONTHS - 1, c + 1);
			go();
			return;
		}

		if (e.key === 'Enter') {
			e.preventDefault();
			nr = Math.min(R - 1, r + 1);
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
					nr = Math.min(R - 1, r + 1);
					nc = 0;
				}
			}
			go();
		}
	}

	function onFocus(r: number, c: number) {
		lastFocused = { r, c };
	}

	// --- MOUNT -----------------------------------------------------------------

	onMount(() => {
		const had = loadFromStorage();
		recalcAll();
		if (!had) queueSave();
	});
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
			{#each schema as row, r}
				<tr
					class="
						border-b border-zinc-300 transition-colors
						hover:bg-zinc-100/40 dark:border-zinc-700
						dark:hover:bg-zinc-800/40
						{row.type === 'section'
						? 'bg-zinc-100 font-semibold text-red-500 dark:bg-zinc-800'
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
							{#if isEditableCell(r, c)}
								<input
									class="w-full min-w-28 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-center font-mono text-sm transition outline-none focus:border-green-600 focus:ring-2 focus:ring-green-600 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-green-500 dark:focus:ring-green-500"
									data-r={r}
									data-c={c}
									inputmode="numeric"
									autocomplete="off"
									autocapitalize="off"
									spellcheck="false"
									value={formatNum(values[r][c])}
									on:focus={() => onFocus(r, c)}
									on:keydown={(e) => handleKey(e, r, c)}
									on:paste={(e) => handlePaste(e, r, c)}
									on:input={(e) => {
										const el = e.currentTarget as HTMLInputElement;
										const parsed = parseNum(el.value);
										if (parsed !== null || el.value === '') {
											values[r][c] = parsed;
											recalcAll(); // <- recompute everything, so sum rows pick up the change
											queueSave?.();
										}
									}}
									on:blur={(e) => {
										const el = e.currentTarget as HTMLInputElement;
										el.value = formatNum(values[r][c]);
									}}
								/>
							{:else}
								<!-- Non-editable month cells:
								     show values for sum rows, blank for label/section rows -->
								<div
									class="w-full min-w-[7rem] bg-white px-2 py-2 text-center font-mono text-zinc-500 dark:bg-zinc-950"
								>
									{row.type === 'sum' ? formatNum(values[r][c]) : ''}
								</div>
							{/if}
						</td>
					{/each}

					{#each [COL_Q1, COL_Q2, COL_Q3, COL_Q4, COL_YTD] as col}
						<td class="border-r border-zinc-300 bg-white p-0 dark:border-zinc-700 dark:bg-zinc-950">
							<div class="w-full min-w-[7rem] px-2 py-2 text-center font-mono font-semibold">
								{formatNum(values[r][col])}
							</div>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
