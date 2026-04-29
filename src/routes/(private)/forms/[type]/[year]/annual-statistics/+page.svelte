<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import Checkbox from '$lib/components/atoms/Checkbox.svelte';

	type EmployeeRow = {
		ftHowMany: number | null;
		ftPayHours: number | null;
		ptHowMany: number | null;
		ptPayHours: number | null;
	};

	type EmployeeRows = {
		administrative: EmployeeRow;
		maintenance: EmployeeRow;
		driver: EmployeeRow;
		otherOperational: EmployeeRow;
	};

	type AnnualTrips = {
		vocationalRehabilitation: boolean;
		vocationalWorkshop: boolean;
		headstart: boolean;
		nursingHomeAssistedLiving: boolean;
		unitedWay: boolean;
		parksAndRecreation: boolean;
		localEmployer: boolean;
		dssMedicaid: boolean;
		dssWorkFirst: boolean;
		dssOther: boolean;
		seniorServices: boolean;
		mentalHealth: boolean;
		other: boolean;
	};

	type AnnualStatisticsDraft = {
		volunteerDrivers: number | null;
		personalVehiclesUsed: number | null;
		incidentalMiles: number | null;
		incidentalHours: number | null;
		incidentalDescription: string;
		caresMiles: number | null;
		caresHours: number | null;
		caresDescription: string;
		nonAmbulatoryPassengerTrips: number | null;
		maintenanceMethod: string;
		ownedVehicles: number | null;
		leasedVehicles: number | null;
		ntdEvents: number | null;
		ntdFatalities: number | null;
		ntdInjuries: number | null;
		operationsChangeNotes: string;
		employees: EmployeeRows;
		tripsServed: AnnualTrips;
	};

	const EMPLOYEE_ROWS: Array<{ key: keyof EmployeeRows; label: string }> = [
		{ key: 'administrative', label: 'Administrative' },
		{ key: 'maintenance', label: 'Maintenance' },
		{ key: 'driver', label: 'Driver' },
		{ key: 'otherOperational', label: 'Other Operational' }
	];

	const LEFT_TRIP_CHECKS: Array<{ key: keyof AnnualTrips; label: string }> = [
		{ key: 'vocationalRehabilitation', label: 'Vocational Rehabilitation' },
		{ key: 'vocationalWorkshop', label: 'Vocational Workshop (or equivalent)' },
		{ key: 'headstart', label: 'Headstart' },
		{ key: 'nursingHomeAssistedLiving', label: 'Nursing Home/Assisted Living Facility' },
		{ key: 'unitedWay', label: 'United Way Agency(ies)' },
		{ key: 'parksAndRecreation', label: 'Parks and Recreation' },
		{ key: 'localEmployer', label: 'Local Employer(s)' }
	];

	const RIGHT_TRIP_CHECKS: Array<{ key: keyof AnnualTrips; label: string }> = [
		{ key: 'dssMedicaid', label: 'DSS Medicaid' },
		{ key: 'dssWorkFirst', label: 'DSS WorkFirst' },
		{ key: 'dssOther', label: 'DSS - Other' },
		{ key: 'seniorServices', label: 'Senior Services' },
		{ key: 'mentalHealth', label: 'Mental Health' },
		{ key: 'other', label: 'Other' }
	];

	const type = $derived(page.params.type as 'urban' | 'rural');
	const year = $derived(Number(page.params.year));
	const agencyName = $derived(page.url.searchParams.get('agency') ?? 'Transit Agency');
	const agencyId = $derived(page.url.searchParams.get('agencyId') ?? '');
	const draftKey = $derived(`annual-statistics:${type}:${year}`);
	const nf = new Intl.NumberFormat('en-US');

	const emptyEmployeeRow = (): EmployeeRow => ({
		ftHowMany: null,
		ftPayHours: null,
		ptHowMany: null,
		ptPayHours: null
	});

	const emptyDraft = (): AnnualStatisticsDraft => ({
		volunteerDrivers: null,
		personalVehiclesUsed: null,
		incidentalMiles: null,
		incidentalHours: null,
		incidentalDescription: '',
		caresMiles: null,
		caresHours: null,
		caresDescription: '',
		nonAmbulatoryPassengerTrips: null,
		maintenanceMethod: '',
		ownedVehicles: null,
		leasedVehicles: null,
		ntdEvents: null,
		ntdFatalities: null,
		ntdInjuries: null,
		operationsChangeNotes: '',
		employees: {
			administrative: emptyEmployeeRow(),
			maintenance: emptyEmployeeRow(),
			driver: emptyEmployeeRow(),
			otherOperational: emptyEmployeeRow()
		},
		tripsServed: {
			vocationalRehabilitation: false,
			vocationalWorkshop: false,
			headstart: false,
			nursingHomeAssistedLiving: false,
			unitedWay: false,
			parksAndRecreation: false,
			localEmployer: false,
			dssMedicaid: false,
			dssWorkFirst: false,
			dssOther: false,
			seniorServices: false,
			mentalHealth: false,
			other: false
		}
	});

	let draft = $state<AnnualStatisticsDraft>(emptyDraft());
	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	let hasLoadedDraft = $state(false);
	let lastLoadedKey = $state('');

	function toNumberOrNull(value: unknown): number | null {
		if (typeof value !== 'number' || !Number.isFinite(value)) return null;
		if (value < 0) return null;
		return Math.floor(value);
	}

	function normalizeEmployeeRow(value: unknown): EmployeeRow {
		const row = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
		return {
			ftHowMany: toNumberOrNull(row.ftHowMany),
			ftPayHours: toNumberOrNull(row.ftPayHours),
			ptHowMany: toNumberOrNull(row.ptHowMany),
			ptPayHours: toNumberOrNull(row.ptPayHours)
		};
	}

	function normalizeDraft(raw: unknown): AnnualStatisticsDraft {
		const base = emptyDraft();
		if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
		const rec = raw as Record<string, unknown>;
		return {
			...base,
			volunteerDrivers: toNumberOrNull(rec.volunteerDrivers),
			personalVehiclesUsed: toNumberOrNull(rec.personalVehiclesUsed),
			incidentalMiles: toNumberOrNull(rec.incidentalMiles),
			incidentalHours: toNumberOrNull(rec.incidentalHours),
			incidentalDescription:
				typeof rec.incidentalDescription === 'string' ? rec.incidentalDescription : '',
			caresMiles: toNumberOrNull(rec.caresMiles),
			caresHours: toNumberOrNull(rec.caresHours),
			caresDescription: typeof rec.caresDescription === 'string' ? rec.caresDescription : '',
			nonAmbulatoryPassengerTrips: toNumberOrNull(rec.nonAmbulatoryPassengerTrips),
			maintenanceMethod: typeof rec.maintenanceMethod === 'string' ? rec.maintenanceMethod : '',
			ownedVehicles: toNumberOrNull(rec.ownedVehicles),
			leasedVehicles: toNumberOrNull(rec.leasedVehicles),
			ntdEvents: toNumberOrNull(rec.ntdEvents),
			ntdFatalities: toNumberOrNull(rec.ntdFatalities),
			ntdInjuries: toNumberOrNull(rec.ntdInjuries),
			operationsChangeNotes:
				typeof rec.operationsChangeNotes === 'string' ? rec.operationsChangeNotes : '',
			employees: {
				administrative: normalizeEmployeeRow((rec.employees as Record<string, unknown>)?.administrative),
				maintenance: normalizeEmployeeRow((rec.employees as Record<string, unknown>)?.maintenance),
				driver: normalizeEmployeeRow((rec.employees as Record<string, unknown>)?.driver),
				otherOperational: normalizeEmployeeRow((rec.employees as Record<string, unknown>)?.otherOperational)
			},
			tripsServed: {
				vocationalRehabilitation: Boolean(
					(rec.tripsServed as Record<string, unknown>)?.vocationalRehabilitation
				),
				vocationalWorkshop: Boolean((rec.tripsServed as Record<string, unknown>)?.vocationalWorkshop),
				headstart: Boolean((rec.tripsServed as Record<string, unknown>)?.headstart),
				nursingHomeAssistedLiving: Boolean(
					(rec.tripsServed as Record<string, unknown>)?.nursingHomeAssistedLiving
				),
				unitedWay: Boolean((rec.tripsServed as Record<string, unknown>)?.unitedWay),
				parksAndRecreation: Boolean((rec.tripsServed as Record<string, unknown>)?.parksAndRecreation),
				localEmployer: Boolean((rec.tripsServed as Record<string, unknown>)?.localEmployer),
				dssMedicaid: Boolean((rec.tripsServed as Record<string, unknown>)?.dssMedicaid),
				dssWorkFirst: Boolean((rec.tripsServed as Record<string, unknown>)?.dssWorkFirst),
				dssOther: Boolean((rec.tripsServed as Record<string, unknown>)?.dssOther),
				seniorServices: Boolean((rec.tripsServed as Record<string, unknown>)?.seniorServices),
				mentalHealth: Boolean((rec.tripsServed as Record<string, unknown>)?.mentalHealth),
				other: Boolean((rec.tripsServed as Record<string, unknown>)?.other)
			}
		};
	}

	$effect(() => {
		if (!browser) {
			draft = emptyDraft();
			hasLoadedDraft = false;
			lastLoadedKey = '';
			return;
		}

		const key = draftKey;
		if (key === lastLoadedKey) return;
		lastLoadedKey = key;

		try {
			const raw = localStorage.getItem(key);
			draft = raw ? normalizeDraft(JSON.parse(raw)) : emptyDraft();
		} catch {
			draft = emptyDraft();
		}
		hasLoadedDraft = true;
	});

	$effect(() => {
		if (!browser || !hasLoadedDraft) return;
		draftKey;
		draft;
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			localStorage.setItem(draftKey, JSON.stringify(draft));
		}, 250);
	});

	function persistDraftNow() {
		if (!browser || !hasLoadedDraft) return;
		localStorage.setItem(draftKey, JSON.stringify(draft));
	}

	function schedulePersist() {
		if (!browser || !hasLoadedDraft) return;
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			persistDraftNow();
		}, 200);
	}

	function getInputFromCell(cell: Element | null): HTMLInputElement | null {
		if (!cell) return null;
		const input = cell.querySelector('input');
		return input instanceof HTMLInputElement ? input : null;
	}

	function moveAnnualTableFocus(current: HTMLInputElement, direction: 'up' | 'down' | 'left' | 'right') {
		const cell = current.closest('td,th') as HTMLTableCellElement | null;
		const row = current.closest('tr') as HTMLTableRowElement | null;
		const table = current.closest('table');
		if (!cell || !row || !table) return;

		const rows = Array.from(table.querySelectorAll('tr'));
		const rowIndex = rows.indexOf(row);
		const colIndex = cell.cellIndex;
		if (rowIndex < 0 || colIndex < 0) return;

		if (direction === 'left' || direction === 'right') {
			const cells = Array.from(row.cells);
			let c = cells.indexOf(cell) + (direction === 'left' ? -1 : 1);
			while (c >= 0 && c < cells.length) {
				const target = getInputFromCell(cells[c]);
				if (target) {
					target.focus();
					return;
				}
				c += direction === 'left' ? -1 : 1;
			}
			return;
		}

		let r = rowIndex + (direction === 'up' ? -1 : 1);
		while (r >= 0 && r < rows.length) {
			const targetRow = rows[r] as HTMLTableRowElement;
			const targetCell = targetRow.cells[colIndex] ?? null;
			const target = getInputFromCell(targetCell);
			if (target) {
				target.focus();
				return;
			}
			r += direction === 'up' ? -1 : 1;
		}
	}

	function handleAnnualTableKey(event: KeyboardEvent) {
		const target = event.target;
		if (!(target instanceof HTMLInputElement)) return;
		if (!target.closest('table')) return;
		if (target.type === 'checkbox') return;

		const key = event.key === 'Enter' ? 'ArrowDown' : event.key;
		if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;
		event.preventDefault();

		if (key === 'ArrowUp') moveAnnualTableFocus(target, 'up');
		if (key === 'ArrowDown') moveAnnualTableFocus(target, 'down');
		if (key === 'ArrowLeft') moveAnnualTableFocus(target, 'left');
		if (key === 'ArrowRight') moveAnnualTableFocus(target, 'right');
	}

	function parseInteger(raw: string): number | null {
		const cleaned = raw.trim().replace(/,/g, '');
		if (cleaned === '') return null;
		if (!/^\d+$/.test(cleaned)) return null;
		const parsed = Number(cleaned);
		return Number.isInteger(parsed) ? parsed : null;
	}

	function fmt(value: number | null): string {
		return typeof value === 'number' ? nf.format(value) : '';
	}

	function setNumberField(field: keyof Omit<AnnualStatisticsDraft, 'employees' | 'tripsServed' | 'incidentalDescription' | 'caresDescription' | 'operationsChangeNotes' | 'maintenanceMethod'>, raw: string) {
		const parsed = parseInteger(raw);
		if (raw.trim() !== '' && parsed === null) return;
		draft[field] = parsed;
	}

	function setEmployeeNumber(row: keyof EmployeeRows, field: keyof EmployeeRow, raw: string) {
		const parsed = parseInteger(raw);
		if (raw.trim() !== '' && parsed === null) return;
		draft.employees[row][field] = parsed;
	}

	function rowFte(row: EmployeeRow): number | null {
		const ftPay = row.ftPayHours ?? 0;
		const ptPay = row.ptPayHours ?? 0;
		const total = ftPay + ptPay;
		const hasAny = row.ftPayHours != null || row.ptPayHours != null;
		if (!hasAny) return null;
		return Math.round(total / 2080);
	}

	function sumEmployeeField(field: keyof EmployeeRow): number | null {
		let sum = 0;
		let hasAny = false;
		for (const { key } of EMPLOYEE_ROWS) {
			const value = draft.employees[key][field];
			if (typeof value === 'number') {
				sum += value;
				hasAny = true;
			}
		}
		return hasAny ? sum : null;
	}

	const employeeTotalFte = $derived.by(() => {
		let payHoursTotal = 0;
		let hasAny = false;
		for (const { key } of EMPLOYEE_ROWS) {
			const row = draft.employees[key];
			if (typeof row.ftPayHours === 'number') {
				payHoursTotal += row.ftPayHours;
				hasAny = true;
			}
			if (typeof row.ptPayHours === 'number') {
				payHoursTotal += row.ptPayHours;
				hasAny = true;
			}
		}
		if (!hasAny) return null;
		return Math.round(payHoursTotal / 2080);
	});

	const maintenanceTotal = $derived.by(() => {
		const owned = draft.ownedVehicles;
		const leased = draft.leasedVehicles;
		if (owned == null && leased == null) return null;
		return (owned ?? 0) + (leased ?? 0);
	});
</script>

<section
	class="flex flex-col gap-3"
	oninput={schedulePersist}
	onchange={schedulePersist}
	onkeydown={handleAnnualTableKey}
>
	{#if type !== 'rural'}
		<div
			class="rounded-lg border border-zinc-300 bg-zinc-50 p-4 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
		>
			Annual Statistics is only available for Rural forms.
		</div>
	{:else}
		<div class="mx-auto mb-10 flex w-full max-w-[1300px] flex-col gap-2 rounded-sm border border-[var(--border)] bg-[var(--surface-1)] p-2 shadow-[var(--shadow)]">
			<div class="annual-section-title">Volunteer Resources</div>
			<table class="carbon-grid w-full border-separate border-spacing-0">
				<tbody>
					<tr>
						<th class="w-[320px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-base font-medium">Total volunteer drivers</th>
						<td class="border border-[var(--border)] p-0">
							<input
								type="text"
								inputmode="numeric"
								class="w-full min-w-[9rem] bg-white px-3 py-2 text-center font-mono text-sm"
								value={fmt(draft.volunteerDrivers)}
								oninput={(e) =>
									setNumberField('volunteerDrivers', (e.currentTarget as HTMLInputElement).value)}
								onblur={(e) =>
									((e.currentTarget as HTMLInputElement).value = fmt(draft.volunteerDrivers))}
							/>
						</td>
						<th class="w-[320px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-base font-medium">Personal Vehicles Used</th>
						<td class="border border-[var(--border)] p-0">
							<input
								type="text"
								inputmode="numeric"
								class="w-full min-w-[9rem] bg-white px-3 py-2 text-center font-mono text-sm"
								value={fmt(draft.personalVehiclesUsed)}
								oninput={(e) =>
									setNumberField('personalVehiclesUsed', (e.currentTarget as HTMLInputElement).value)}
								onblur={(e) =>
									((e.currentTarget as HTMLInputElement).value = fmt(draft.personalVehiclesUsed))}
							/>
						</td>
					</tr>
				</tbody>
			</table>

			<div class="annual-section-title">Incidental Services (training, maintenance, fuel, other non-passenger services)</div>
			<table class="carbon-grid w-full border-separate border-spacing-0">
				<tbody>
					<tr>
						<th class="w-[320px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-base font-medium">Miles</th>
						<td class="border border-[var(--border)] p-0">
							<input
								type="text"
								inputmode="numeric"
								class="w-full min-w-[9rem] bg-white px-3 py-2 text-center font-mono text-sm"
								value={fmt(draft.incidentalMiles)}
								oninput={(e) =>
									setNumberField('incidentalMiles', (e.currentTarget as HTMLInputElement).value)}
								onblur={(e) => ((e.currentTarget as HTMLInputElement).value = fmt(draft.incidentalMiles))}
							/>
						</td>
						<th class="w-[320px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-base font-medium">Hours</th>
						<td class="border border-[var(--border)] p-0">
							<input
								type="text"
								inputmode="numeric"
								class="w-full min-w-[9rem] bg-white px-3 py-2 text-center font-mono text-sm"
								value={fmt(draft.incidentalHours)}
								oninput={(e) =>
									setNumberField('incidentalHours', (e.currentTarget as HTMLInputElement).value)}
								onblur={(e) => ((e.currentTarget as HTMLInputElement).value = fmt(draft.incidentalHours))}
							/>
						</td>
					</tr>
				</tbody>
			</table>
			<div class="annual-field-wrap">
				<label for="incidental-description" class="annual-label">Incidental Services Description:</label>
				<textarea
					id="incidental-description"
					class="annual-textarea"
					placeholder="Enter incidental services details"
					bind:value={draft.incidentalDescription}
				></textarea>
			</div>

			<div class="annual-section-title">CARES Act Incidental Services (training, maintenance, fuel, other non-passenger services)</div>
			<table class="carbon-grid w-full border-separate border-spacing-0">
				<tbody>
					<tr>
						<th class="w-[320px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-base font-medium">Miles</th>
						<td class="border border-[var(--border)] p-0">
							<input
								type="text"
								inputmode="numeric"
								class="w-full min-w-[9rem] bg-white px-3 py-2 text-center font-mono text-sm"
								value={fmt(draft.caresMiles)}
								oninput={(e) => setNumberField('caresMiles', (e.currentTarget as HTMLInputElement).value)}
								onblur={(e) => ((e.currentTarget as HTMLInputElement).value = fmt(draft.caresMiles))}
							/>
						</td>
						<th class="w-[320px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-base font-medium">Hours</th>
						<td class="border border-[var(--border)] p-0">
							<input
								type="text"
								inputmode="numeric"
								class="w-full min-w-[9rem] bg-white px-3 py-2 text-center font-mono text-sm"
								value={fmt(draft.caresHours)}
								oninput={(e) => setNumberField('caresHours', (e.currentTarget as HTMLInputElement).value)}
								onblur={(e) => ((e.currentTarget as HTMLInputElement).value = fmt(draft.caresHours))}
							/>
						</td>
					</tr>
				</tbody>
			</table>
			<div class="annual-field-wrap">
				<label for="cares-description" class="annual-label">CARES Act Incidental Services Description:</label>
				<textarea
					id="cares-description"
					class="annual-textarea"
					placeholder="Enter CARES Act incidental services details"
					bind:value={draft.caresDescription}
				></textarea>
			</div>

			<div class="annual-section-title">Employee Information</div>
			<div class="overflow-auto">
				<table class="carbon-grid w-full border-separate border-spacing-0">
					<thead>
						<tr>
							<th rowspan="2" class="min-w-[280px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-sm font-semibold">Role</th>
							<th colspan="2" class="border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-center text-sm font-semibold">Full Time Employee</th>
							<th colspan="2" class="border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-center text-sm font-semibold">Part Time Employee</th>
							<th rowspan="2" class="min-w-[120px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-center text-sm font-semibold">FTE</th>
						</tr>
						<tr>
							<th class="min-w-[140px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-center text-sm font-semibold">How Many</th>
							<th class="min-w-[180px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-center text-sm font-semibold">Total Pay Hours</th>
							<th class="min-w-[140px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-center text-sm font-semibold">How Many</th>
							<th class="min-w-[180px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-center text-sm font-semibold">Total Pay Hours</th>
						</tr>
					</thead>
					<tbody>
						{#each EMPLOYEE_ROWS as row}
							<tr>
								<th class="border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-base font-medium">{row.label}</th>
								<td class="border border-[var(--border)] p-0">
									<input
										type="text"
										inputmode="numeric"
										class="w-full min-w-[8rem] bg-white px-3 py-2 text-center font-mono text-sm"
										value={fmt(draft.employees[row.key].ftHowMany)}
										oninput={(e) =>
											setEmployeeNumber(row.key, 'ftHowMany', (e.currentTarget as HTMLInputElement).value)}
										onblur={(e) =>
											((e.currentTarget as HTMLInputElement).value = fmt(draft.employees[row.key].ftHowMany))}
									/>
								</td>
								<td class="border border-[var(--border)] p-0">
									<input
										type="text"
										inputmode="numeric"
										class="w-full min-w-[8rem] bg-white px-3 py-2 text-center font-mono text-sm"
										value={fmt(draft.employees[row.key].ftPayHours)}
										oninput={(e) =>
											setEmployeeNumber(row.key, 'ftPayHours', (e.currentTarget as HTMLInputElement).value)}
										onblur={(e) =>
											((e.currentTarget as HTMLInputElement).value = fmt(draft.employees[row.key].ftPayHours))}
									/>
								</td>
								<td class="border border-[var(--border)] p-0">
									<input
										type="text"
										inputmode="numeric"
										class="w-full min-w-[8rem] bg-white px-3 py-2 text-center font-mono text-sm"
										value={fmt(draft.employees[row.key].ptHowMany)}
										oninput={(e) =>
											setEmployeeNumber(row.key, 'ptHowMany', (e.currentTarget as HTMLInputElement).value)}
										onblur={(e) =>
											((e.currentTarget as HTMLInputElement).value = fmt(draft.employees[row.key].ptHowMany))}
									/>
								</td>
								<td class="border border-[var(--border)] p-0">
									<input
										type="text"
										inputmode="numeric"
										class="w-full min-w-[8rem] bg-white px-3 py-2 text-center font-mono text-sm"
										value={fmt(draft.employees[row.key].ptPayHours)}
										oninput={(e) =>
											setEmployeeNumber(row.key, 'ptPayHours', (e.currentTarget as HTMLInputElement).value)}
										onblur={(e) =>
											((e.currentTarget as HTMLInputElement).value = fmt(draft.employees[row.key].ptPayHours))}
									/>
								</td>
								<td class="border border-[var(--border)] bg-white p-0">
									<div class="cursor-not-allowed bg-transparent px-3 py-2 text-center font-mono text-sm font-semibold">
										{fmt(rowFte(draft.employees[row.key]))}
									</div>
								</td>
							</tr>
						{/each}
						<tr>
							<th class="border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-base font-semibold">Total</th>
							<td class="border border-[var(--border)] bg-white p-0"><div class="cursor-not-allowed bg-transparent px-3 py-2 text-center font-mono text-sm font-semibold">{fmt(sumEmployeeField('ftHowMany'))}</div></td>
							<td class="border border-[var(--border)] bg-white p-0"><div class="cursor-not-allowed bg-transparent px-3 py-2 text-center font-mono text-sm font-semibold">{fmt(sumEmployeeField('ftPayHours'))}</div></td>
							<td class="border border-[var(--border)] bg-white p-0"><div class="cursor-not-allowed bg-transparent px-3 py-2 text-center font-mono text-sm font-semibold">{fmt(sumEmployeeField('ptHowMany'))}</div></td>
							<td class="border border-[var(--border)] bg-white p-0"><div class="cursor-not-allowed bg-transparent px-3 py-2 text-center font-mono text-sm font-semibold">{fmt(sumEmployeeField('ptPayHours'))}</div></td>
							<td class="border border-[var(--border)] bg-white p-0"><div class="cursor-not-allowed bg-transparent px-3 py-2 text-center font-mono text-sm font-semibold">{fmt(employeeTotalFte)}</div></td>
						</tr>
					</tbody>
				</table>
			</div>

			<div class="annual-section-title">Non-Ambulatory</div>
			<table class="carbon-grid w-full border-separate border-spacing-0">
				<tbody>
					<tr>
						<th class="w-[420px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-base font-medium">Non-ambulatory passenger trips</th>
						<td class="border border-[var(--border)] p-0">
							<input
								type="text"
								inputmode="numeric"
								class="w-full min-w-[9rem] bg-white px-3 py-2 text-center font-mono text-sm"
								value={fmt(draft.nonAmbulatoryPassengerTrips)}
								oninput={(e) =>
									setNumberField('nonAmbulatoryPassengerTrips', (e.currentTarget as HTMLInputElement).value)}
								onblur={(e) =>
									((e.currentTarget as HTMLInputElement).value = fmt(draft.nonAmbulatoryPassengerTrips))}
							/>
						</td>
					</tr>
				</tbody>
			</table>

			<div class="annual-section-title">Maintenance Information</div>
			<div class="grid gap-2 md:grid-cols-[1fr_1fr]">
				<div class="annual-field-wrap">
					<label for="maintenance-method" class="annual-label">Select your vehicle maintenance method</label>
					<select id="maintenance-method" class="annual-input" bind:value={draft.maintenanceMethod}>
						<option value="">Select...</option>
						<option value="contracted">Contracted</option>
						<option value="agency-owned">Agency Owned Shop</option>
						<option value="mixed">Mixed</option>
					</select>
				</div>
			</div>
			<table class="carbon-grid w-full border-separate border-spacing-0">
				<tbody>
					<tr>
						<td class="border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-left text-sm font-semibold text-[var(--text-muted)]"></td>
						<td class="border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-center text-sm font-semibold text-[var(--text-muted)]"># Owned</td>
						<td class="border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-center text-sm font-semibold text-[var(--text-muted)]"># Leased</td>
						<td class="border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-center text-sm font-semibold text-[var(--text-muted)]">Total</td>
					</tr>
					<tr>
						<th class="w-[320px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-base font-medium">Maintenance facilities granted</th>
						<td class="border border-[var(--border)] p-0">
							<input
								type="text"
								inputmode="numeric"
								class="w-full min-w-[9rem] bg-white px-3 py-2 text-center font-mono text-sm"
								value={fmt(draft.ownedVehicles)}
								oninput={(e) => setNumberField('ownedVehicles', (e.currentTarget as HTMLInputElement).value)}
								onblur={(e) => ((e.currentTarget as HTMLInputElement).value = fmt(draft.ownedVehicles))}
							/>
						</td>
						<td class="border border-[var(--border)] p-0">
							<input
								type="text"
								inputmode="numeric"
								class="w-full min-w-[9rem] bg-white px-3 py-2 text-center font-mono text-sm"
								value={fmt(draft.leasedVehicles)}
								oninput={(e) => setNumberField('leasedVehicles', (e.currentTarget as HTMLInputElement).value)}
								onblur={(e) => ((e.currentTarget as HTMLInputElement).value = fmt(draft.leasedVehicles))}
							/>
						</td>
						<td class="border border-[var(--border)] bg-white p-0">
							<div class="cursor-not-allowed bg-transparent px-3 py-2 text-center font-mono text-sm font-semibold">{fmt(maintenanceTotal)}</div>
						</td>
					</tr>
				</tbody>
			</table>

			<div class="annual-section-title">Safety Statistics (NTD only)</div>
			<table class="carbon-grid w-full border-separate border-spacing-0">
				<tbody>
					<tr>
						<td class="border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-left text-sm font-semibold text-[var(--text-muted)]"></td>
						<td class="border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-center text-sm font-semibold text-[var(--text-muted)]">NTD Events</td>
						<td class="border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-center text-sm font-semibold text-[var(--text-muted)]">NTD Fatalities</td>
						<td class="border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-center text-sm font-semibold text-[var(--text-muted)]">NTD Injuries</td>
					</tr>
					<tr>
						<th class="w-[320px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-base font-medium">NTD Reportable (see instructions)</th>
						<td class="border border-[var(--border)] p-0">
							<input
								type="text"
								inputmode="numeric"
								class="w-full min-w-[9rem] bg-white px-3 py-2 text-center font-mono text-sm"
								value={fmt(draft.ntdEvents)}
								oninput={(e) => setNumberField('ntdEvents', (e.currentTarget as HTMLInputElement).value)}
								onblur={(e) => ((e.currentTarget as HTMLInputElement).value = fmt(draft.ntdEvents))}
							/>
						</td>
						<td class="border border-[var(--border)] p-0">
							<input
								type="text"
								inputmode="numeric"
								class="w-full min-w-[9rem] bg-white px-3 py-2 text-center font-mono text-sm"
								value={fmt(draft.ntdFatalities)}
								oninput={(e) => setNumberField('ntdFatalities', (e.currentTarget as HTMLInputElement).value)}
								onblur={(e) => ((e.currentTarget as HTMLInputElement).value = fmt(draft.ntdFatalities))}
							/>
						</td>
						<td class="border border-[var(--border)] p-0">
							<input
								type="text"
								inputmode="numeric"
								class="w-full min-w-[9rem] bg-white px-3 py-2 text-center font-mono text-sm"
								value={fmt(draft.ntdInjuries)}
								oninput={(e) => setNumberField('ntdInjuries', (e.currentTarget as HTMLInputElement).value)}
								onblur={(e) => ((e.currentTarget as HTMLInputElement).value = fmt(draft.ntdInjuries))}
							/>
						</td>
					</tr>
				</tbody>
			</table>

			<div class="annual-section-title">Human Service Agency / Community Organization Trips Served</div>
			<div class="grid gap-3 lg:grid-cols-2">
				<div class="overflow-auto">
					<table class="carbon-grid w-full border-separate border-spacing-0">
						<thead>
							<tr>
								<th class="border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-sm font-semibold">Agency</th>
								<th class="w-[120px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-center text-sm font-semibold">Annual Trips</th>
							</tr>
						</thead>
						<tbody>
							{#each LEFT_TRIP_CHECKS as item}
								<tr>
									<th class="border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-base font-medium">{item.label}</th>
									<td class="border border-[var(--border)] p-0">
										<div class="flex items-center justify-center py-2">
											<Checkbox
												size="lg"
												label=""
												labelClass="hidden"
												bind:checked={draft.tripsServed[item.key]}
											/>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
				<div class="overflow-auto">
					<table class="carbon-grid w-full border-separate border-spacing-0">
						<thead>
							<tr>
								<th class="border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-sm font-semibold">Agency</th>
								<th class="w-[120px] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-center text-sm font-semibold">Annual Trips</th>
							</tr>
						</thead>
						<tbody>
							{#each RIGHT_TRIP_CHECKS as item}
								<tr>
									<th class="border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-left text-base font-medium">{item.label}</th>
									<td class="border border-[var(--border)] p-0">
										<div class="flex items-center justify-center py-2">
											<Checkbox
												size="lg"
												label=""
												labelClass="hidden"
												bind:checked={draft.tripsServed[item.key]}
											/>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<div class="annual-field-wrap">
				<label for="ops-change" class="annual-label">
					How has your administration and/or operations changed since last year (be detailed)?
				</label>
				<textarea
					id="ops-change"
					class="annual-textarea min-h-[5rem]"
					placeholder="Describe operational changes"
					bind:value={draft.operationsChangeNotes}
				></textarea>
			</div>
		</div>
	{/if}
</section>

<style>
	.annual-section-title {
		background: #161616;
		color: #f4f4f4;
		padding: 0.5rem 0.75rem;
		font-size: 1.2rem;
		font-weight: 700;
		line-height: 1.2;
	}

	.annual-field-wrap {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.annual-label {
		font-size: 1rem;
		font-weight: 500;
		color: var(--theme-color);
	}

	.annual-input {
		min-height: 2.5rem;
		padding: 0.5rem 0.75rem;
		font-size: 0.95rem;
	}

	.annual-textarea {
		width: 100%;
		min-height: 4rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: 2px;
		background: #fff;
		font-size: 0.95rem;
		resize: vertical;
	}
</style>
