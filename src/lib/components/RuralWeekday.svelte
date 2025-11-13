<script lang="ts">
	// Fiscal Data Grid — July→June + Q1..Q4 + YTD
	// Assumptions:
	// - Integers only; change parse/format if you want decimals.
	// - FY starts in July; adjust `fiscalStartMonthIndex` if needed (0=Jan).
	// - Quarter mapping derives from the fiscal start.
	// - Quarter & YTD columns are computed (read-only).
	// - "section" rows are big headers; "label" rows are one-line labels; "number" rows accept input.

	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	const STORAGE_KEY = 'fy-grid-v1';

	let saveTimer: ReturnType<typeof setTimeout> | null = null;

	function saveToStorage() {
		if (!browser) return;
		try {
			// Only store raw month inputs; computed cols can be recomputed.
			const payload = {
				version: 1,
				values // your (number|null)[][] matrix
			};
			localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
		} catch (e) {
			// storage full or blocked — ignore silently or surface an error UI
		}
	}

	function queueSave() {
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(saveToStorage, 300); // debounce 300ms
	}

	function loadFromStorage() {
		if (!browser) return false;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return false;
			const parsed = JSON.parse(raw);
			if (!parsed?.values) return false;

			// Validate dimensions in case schema changed
			if (
				Array.isArray(parsed.values) &&
				parsed.values.length === R &&
				parsed.values.every((row: unknown) => Array.isArray(row) && row.length === TOTAL_COLS)
			) {
				values = parsed.values;
				return true;
			}
		} catch {}
		return false;
	}

	function clearStorage() {
		if (!browser) return;
		localStorage.removeItem(STORAGE_KEY);
	}

	onMount(() => {
		const had = loadFromStorage();
		recalcAll(); // make sure Q1–Q4 + YTD reflect loaded data
		if (!had) queueSave(); // initialize storage with empty grid on first visit
	});

	// --- Configuration ---------------------------------------------------------
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

	// Rotate to July→June
	function rotate<T>(arr: T[], start: number) {
		return [...arr.slice(start), ...arr.slice(0, start)];
	}
	const months = rotate(baseMonths, fiscalStartMonthIndex); // ["Jul","Aug","Sep",...,"Jun"]

	const COL_MONTHS = months.length; // 12
	const COL_Q1 = COL_MONTHS + 0;
	const COL_Q2 = COL_MONTHS + 1;
	const COL_Q3 = COL_MONTHS + 2;
	const COL_Q4 = COL_MONTHS + 3;
	const COL_YTD = COL_MONTHS + 4;
	const TOTAL_COLS = COL_MONTHS + 5;

	// Quarter membership per fiscal year starting month
	// Q1 = first 3 months in `months`, Q2 = next 3, etc.
	const quarterIndices = {
		q1: [0, 1, 2],
		q2: [3, 4, 5],
		q3: [6, 7, 8],
		q4: [9, 10, 11]
	};

	// --- Schema (edit this to match your spreadsheet) --------------------------
	type RowType = 'section' | 'label' | 'number';
	type RowDef = {
		id: string;
		type: RowType;
		label: string;
		indent?: number; // visual indentation for child rows
	};

	// Example set — mirror your screenshot’s first block. Add/remove as needed.
	const schema: RowDef[] = [
		// { id: 'sec0', type: 'section', label: 'Operating Days' },
		{ id: 'operating_days', type: 'number', label: 'Operating Days' },

		{ id: 'sec1', type: 'section', label: 'Demand Response Directly Operated (DR DO)' },
		{ id: 'hours', type: 'number', label: 'Hours' },
		{ id: 'miles', type: 'number', label: 'Miles' },
		{ id: 'pt_nc', type: 'label', label: 'Passenger Trips: Non-Contract' }, // label row (non-edit)
		{ id: 'medicaid', type: 'number', label: '  Medicaid Contract', indent: 1 },
		{ id: 'nonmedicaid', type: 'number', label: '  Non-Medicaid Contract', indent: 1 },

		{ id: 'total_trips_mode', type: 'label', label: 'Total Passenger Trips for This Mode' },

		{ id: 'sec2', type: 'section', label: 'Demand Response Purchased (DR PT)' },
		{ id: 'drpt_hours', type: 'number', label: 'Hours' },
		{ id: 'drpt_miles', type: 'number', label: 'Miles' },

		{ id: 'sec3', type: 'section', label: 'Fixed Route Directly Operated (MB DO)' },
		{ id: 'mbdo_hours', type: 'number', label: 'Hours' },
		{ id: 'mbdo_miles', type: 'number', label: 'Miles' }
	];

	// --- State -----------------------------------------------------------------
	// Store raw numeric values in a 2D matrix: rows x TOTAL_COLS
	// Only "number" rows accept input in month columns; Q1..YTD are computed.
	const R = schema.length;
	let values: (number | null)[][] = Array.from({ length: R }, () =>
		Array.from({ length: TOTAL_COLS }, () => null)
	);

	// Focus tracking for keyboard nav
	let lastFocused: { r: number; c: number } | null = null;

	// --- Helpers ---------------------------------------------------------------
	const nf = new Intl.NumberFormat('en-US');

	function formatNum(n: number | null): string {
		if (n === null || Number.isNaN(n)) return '';
		return nf.format(n);
	}

	function parseNum(s: string): number | null {
		// allow commas, spaces; integers only here
		const cleaned = s.replace(/[,\s]/g, '');
		if (cleaned === '') return null;
		if (!/^-?\d+$/.test(cleaned)) return null;
		const n = parseInt(cleaned, 10);
		if (Number.isNaN(n)) return null;
		return n;
	}

	function isEditableCell(rowIndex: number, colIndex: number): boolean {
		const row = schema[rowIndex];
		// section and label rows are non-editable
		if (row.type !== 'number') return false;
		// Q1..Q4..YTD are computed, not editable
		if (colIndex >= COL_MONTHS) return false;
		return true;
	}

	function recalcRow(rowIndex: number) {
		// Compute Q1..Q4 and YTD for number rows
		if (schema[rowIndex].type !== 'number') {
			// clear computed cells for non-number rows
			values[rowIndex][COL_Q1] = null;
			values[rowIndex][COL_Q2] = null;
			values[rowIndex][COL_Q3] = null;
			values[rowIndex][COL_Q4] = null;
			values[rowIndex][COL_YTD] = null;
			return;
		}
		const sum = (idxs: number[]) => idxs.reduce((acc, m) => acc + (values[rowIndex][m] ?? 0), 0);

		values[rowIndex][COL_Q1] = sum(quarterIndices.q1);
		values[rowIndex][COL_Q2] = sum(quarterIndices.q2);
		values[rowIndex][COL_Q3] = sum(quarterIndices.q3);
		values[rowIndex][COL_Q4] = sum(quarterIndices.q4);
		values[rowIndex][COL_YTD] =
			(values[rowIndex][COL_Q1] ?? 0) +
			(values[rowIndex][COL_Q2] ?? 0) +
			(values[rowIndex][COL_Q3] ?? 0) +
			(values[rowIndex][COL_Q4] ?? 0);
	}

	function recalcAll() {
		for (let r = 0; r < R; r++) recalcRow(r);
	}

	function setCell(r: number, c: number, raw: string) {
		if (!isEditableCell(r, c)) return;
		const parsed = parseNum(raw);
		if (parsed === null && raw !== '') {
			// reject invalid input (keeps previous value)
			return;
		}
		values[r][c] = parsed;
		recalcRow(r);
	}

	// Pasting a grid into the table from the current focused cell
	async function handlePaste(e: ClipboardEvent, r: number, c: number) {
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
		// Arrow keys navigate among editable month cells; Tab/Enter also move.
		let nr = r,
			nc = c;
		const go = () => {
			// Find nearest editable cell in the intended direction
			if (isEditableCell(nr, nc)) return moveFocus(nr, nc);

			// If target isn't editable (e.g., landed on a label row),
			// keep moving in the same direction until we find one or hit edge.
			let guard = 0;
			while (!isEditableCell(nr, nc) && guard < 1000) {
				guard++;
				if (e.key === 'ArrowUp') nr = Math.max(0, nr - 1);
				else if (e.key === 'ArrowDown') nr = Math.min(R - 1, nr + 1);
				else if (e.key === 'ArrowLeft') nc = Math.max(0, nc - 1);
				else if (e.key === 'ArrowRight') nc = Math.min(COL_MONTHS - 1, nc + 1);
				else return;
				if (
					(nr === 0 && e.key === 'ArrowUp') ||
					(nr === R - 1 && e.key === 'ArrowDown') ||
					(nc === 0 && e.key === 'ArrowLeft') ||
					(nc === COL_MONTHS - 1 && e.key === 'ArrowRight')
				)
					break;
			}
			if (isEditableCell(nr, nc)) moveFocus(nr, nc);
		};

		// Prevent cursor movement on arrows to keep UX consistent
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
				// back
				if (c > 0) nc = c - 1;
				else {
					// move to last editable col of previous editable row
					nr = Math.max(0, r - 1);
					nc = COL_MONTHS - 1;
				}
			} else {
				// forward
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

	onMount(() => {
		recalcAll();
	});
</script>

<div class="overflow-auto rounded-xl bg-zinc-900 text-zinc-100">
	<table class="w-full">
		<thead class="sticky top-0 z-30 bg-white p-0 dark:bg-zinc-900">
			<tr>
				<th class="sticky left-0 z-20 min-w-[375px] bg-white p-2 pl-4 text-left dark:bg-zinc-900">
					<!-- Line Item -->
				</th>
				{#each months as m}
					<th class="p-2 text-center">{m}</th>
				{/each}
				<th class="p-2 text-center">Q1</th>
				<th class="p-2 text-center">Q2</th>
				<th class="p-2 text-center">Q3</th>
				<th class="p-2 text-center">Q4</th>
				<th class="p-2 text-center">YTD</th>
			</tr>
		</thead>

		<tbody>
			{#each schema as row, r}
				<tr
					class={row.type === 'section'
						? 'rounded-2xl border-y-2 border-transparent bg-zinc-100 font-semibold text-red-500 dark:bg-zinc-800'
						: row.type === 'label'
							? 'bg-zinc-50 dark:bg-zinc-900'
							: ''}
				>
					<!-- Label / first column -->
					<td class="sticky left-0 z-20 bg-zinc-300 p-2 pl-6 dark:bg-zinc-900 border-r-2 border-zinc-600">
                        <!-- ADD TO SPAN:  `text-center w-full` -->
						<span
							class="inline-block"
							style={'padding-left:' + (row.indent ? row.indent * 16 : 0) + 'px'}>{row.label}</span
						>
					</td>

					<!-- Month inputs -->
					{#each Array(COL_MONTHS) as _, c}
						<td class="m-0 bg-zinc-900 p-0">
							{#if isEditableCell(r, c)}
								<input
									class="mr-2 w-full min-w-28 rounded-sm border
         bg-zinc-100 p-2 text-center font-mono font-semibold text-zinc-900 tabular-nums
         focus:ring-2
         focus:ring-red-600 focus:ring-offset-0 focus:outline-none focus:ring-inset"
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
											recalcRow(r);
											queueSave?.(); // if you added localStorage autosave
										}
									}}
									on:blur={(e) => {
										const el = e.currentTarget as HTMLInputElement;
										el.value = formatNum(values[r][c]);
									}}
								/>
							{:else}
								<!-- Read-only display -->
								<div
									class="w-full min-w-[7rem] cursor-default bg-zinc-900 text-center
                         font-mono tabular-nums"
									aria-readonly="true"
								>
									{#if c < COL_MONTHS}{''}{/if}
								</div>
							{/if}
						</td>
					{/each}

					<!-- Q1..Q4..YTD (computed) -->
					{#each [COL_Q1, COL_Q2, COL_Q3, COL_Q4, COL_YTD] as col}
						<td class="p-0 bg-zinc-900 ">
							<div
								class="w-full min-w-[7rem] cursor-default bg-zinc-900 font-mono
                       font-semibold tabular-nums pr-0 text-center"
								aria-readonly="true"
							>
								{formatNum(values[r][col])}
							</div>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
