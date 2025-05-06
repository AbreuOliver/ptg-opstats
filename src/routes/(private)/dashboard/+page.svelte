<script lang="ts">
	import '../../../app.css';

	const metrics = [
		{ label: 'Total Agencies Reporting', value: '87', change: '', icon: '🏢' },
		{ label: 'Total Reports Submitted ', value: '62', change: '', icon: '📝' },
		{ label: 'Overdue Reports', value: '8', change: '', icon: '⏰' },
		{ label: 'Pending Reviews', value: '15', change: '', icon: '🔍' }
	];

	let submissions = [
		{
			agency: 'Wake County Transit',
			email: 'director@waketransit.gov',
			status: 'Submitted',
			year: '2024',
			date: '2025-04-28',
			compliance: 'On Time'
		},
		{
			agency: 'Durham City Transit',
			email: 'admin@durhamtransit.gov',
			status: 'Reviewed',
			date: '2025-04-25',
			year: '2024',
			compliance: 'Late'
		},
		{
			agency: 'Asheville Metro Transit',
			email: 'contact@ashevillemt.org',
			status: 'Submitted',
			date: '2025-04-27',
			year: '2024',
			compliance: 'On Time'
		},
		{
			agency: 'Charlotte Area Transit System',
			email: 'data@cats.org',
			status: 'Flagged',
			date: '2025-04-29',
			year: '2024',
			compliance: 'Needs Review'
		}
	];

	let sortColumn: keyof (typeof submissions)[0] | null = null;
	let sortAsc = true;

	function sortBy(column: keyof (typeof submissions)[0]) {
		if (sortColumn === column) {
			sortAsc = !sortAsc;
		} else {
			sortColumn = column;
			sortAsc = true;
		}

		submissions = submissions.slice().sort((a, b) => {
			const valA = a[column];
			const valB = b[column];

			if (typeof valA === 'string' && typeof valB === 'string') {
				return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
			}
			if (typeof valA === 'number' && typeof valB === 'number') {
				return sortAsc ? valA - valB : valB - valA;
			}
			return 0;
		});
	}
</script>

<section class="space-y-8 p-4 md:p-8">
	<!-- Metrics Grid -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
		{#each metrics as m}
			<div
				class="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 dark:border-gray-800 dark:bg-white/[0.03]"
			>
				<div
					class="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-lg grayscale filter dark:bg-gray-800"
				>
					{m.icon}
				</div>
				<div class="mt-5 flex items-end justify-between">
					<div>
						<span class="text-sm text-gray-500 dark:text-gray-400">{m.label}</span>
						<h4 class="text-title-sm mt-2 font-bold text-gray-800 dark:text-white/90">{m.value}</h4>
					</div>
					<span
						class="bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500 flex items-center gap-1 rounded-full py-0.5 pl-2 pr-2.5 text-sm font-medium"
					>
						{m.change}
					</span>
				</div>
			</div>
		{/each}
	</div>

	<!-- Submissions Table -->
	<div class="rounded-lg border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
		<h2 class="mb-4 text-2xl font-semibold">Submissions by Agency</h2>
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm text-gray-500 dark:text-gray-400">
				<thead
					class="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400"
				>
					<tr>
						<!-- <th scope="col" class="px-6 py-3">Agency</th>
                        <th scope="col" class="w-32 px-2 py-3 text-center"></th>
						<th scope="col" class="px-6 py-3">Report</th>
						<th scope="col" class="px-6 py-3">Status</th>
                        <th scope="col" class="px-6 py-3">Year</th>
						<th scope="col" class="px-6 py-3">Date</th>
						<th scope="col" class="px-6 py-3">Compliance</th> -->
						<th class="cursor-pointer select-none px-6 py-3" on:click={() => sortBy('agency')}>
							Agency {sortColumn === 'agency' ? (sortAsc ? '↑' : '↓') : ''}
						</th>
						<th scope="col" class="w-32 px-2 py-3 text-center"></th>
                        <th scope="col" class="w-0 px-2 py-3 text-center"></th>
						<th on:click={() => sortBy('status')} class="cursor-pointer select-none px-6 py-3">
							Status {sortColumn === 'status' ? (sortAsc ? '↑' : '↓') : ''}
						</th>

						<th on:click={() => sortBy('year')} class="w-28 cursor-pointer select-none px-6 py-3">
							Fiscal Year {sortColumn === 'year' ? (sortAsc ? '↑' : '↓') : ''}
						</th>

						<th on:click={() => sortBy('date')} class="cursor-pointer select-none px-6 py-3">
							Date {sortColumn === 'date' ? (sortAsc ? '↑' : '↓') : ''}
						</th>
                        <th on:click={() => sortBy('compliance')} class="cursor-pointer select-none px-6 py-3">
							Compliance {sortColumn === 'compliance' ? (sortAsc ? '↑' : '↓') : ''}
						</th>
					</tr>
				</thead>

				<tbody>
					{#each submissions as s}
						<tr
							class="group border-b hover:cursor-pointer hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-600"
						>
							<td class="px-6 py-4">
								<div class="font-medium text-gray-900 dark:text-white">{s.agency}</div>
								<div class="text-sm text-gray-500">{s.email}</div>
							</td>

							<!-- Button Column -->
							<td class="px-2 py-4 text-center align-middle">
								<a
									href="/forms"
									class="hidden items-center gap-1 rounded-md bg-black px-2 py-1 text-xs text-white transition hover:bg-gray-800 group-hover:inline-flex"
									
								>
									<span class="hidden group-hover:inline">View Report</span>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										class="size-4"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M7 17L17 7M7 7h10v10"
										/>
									</svg>
								</a>
							</td>

							<td class="px-6 py-4">{s.report}</td>
							<td class="px-6 py-4">{s.status}</td>
							<td class="px-6 py-4">{s.year}</td>
							<td class="px-6 py-4">{s.date}</td>
							<td class="px-6 py-4">{s.compliance}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</section>
