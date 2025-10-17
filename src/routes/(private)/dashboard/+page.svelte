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

	const NC_COUNTIES = [
		'Alamance',
		'Alexander',
		'Alleghany',
		'Anson',
		'Ashe',
		'Avery',
		'Beaufort',
		'Bertie',
		'Bladen',
		'Brunswick',
		'Buncombe',
		'Burke',
		'Cabarrus',
		'Caldwell',
		'Camden',
		'Carteret',
		'Caswell',
		'Catawba',
		'Chatham',
		'Cherokee',
		'Chowan',
		'Clay',
		'Cleveland',
		'Columbus',
		'Craven',
		'Cumberland',
		'Currituck',
		'Dare',
		'Davidson',
		'Davie',
		'Duplin',
		'Durham',
		'Edgecombe',
		'Forsyth',
		'Franklin',
		'Gaston',
		'Gates',
		'Graham',
		'Granville',
		'Greene',
		'Guilford',
		'Halifax',
		'Harnett',
		'Haywood',
		'Henderson',
		'Hertford',
		'Hoke',
		'Hyde',
		'Iredell',
		'Jackson',
		'Johnston',
		'Jones',
		'Lee',
		'Lenoir',
		'Lincoln',
		'Macon',
		'Madison',
		'Martin',
		'McDowell',
		'Mecklenburg',
		'Mitchell',
		'Montgomery',
		'Moore',
		'Nash',
		'New Hanover',
		'Northampton',
		'Onslow',
		'Orange',
		'Pamlico',
		'Pasquotank',
		'Pender',
		'Perquimans',
		'Person',
		'Pitt',
		'Polk',
		'Randolph',
		'Richmond',
		'Robeson',
		'Rockingham',
		'Rowan',
		'Rutherford',
		'Sampson',
		'Scotland',
		'Stanly',
		'Stokes',
		'Surry',
		'Swain',
		'Transylvania',
		'Tyrrell',
		'Union',
		'Vance',
		'Wake',
		'Warren',
		'Washington',
		'Watauga',
		'Wayne',
		'Wilkes',
		'Wilson',
		'Yadkin',
		'Yancey'
	] as const;

	// STATUS CODES YOU CAN STYLE (submitted/review/late/missing)
	const STATUS = ['submitted', 'review', 'late', 'missing'] as const;
	type Status = (typeof STATUS)[number];

	// BUILD QUARTER STATUSES PER COUNTY (DETERMINISTIC: CYCLES THROUGH STATUS)
	const counties = NC_COUNTIES.map((name, i) => ({
		id: name.toLowerCase().replace(/\s+/g, '-'),
		name,
		quarters: [0, 1, 2, 3].map((q) => STATUS[(i + q) % STATUS.length]) as Status[]
	}));

	// OPTIONAL: SIMPLE COLOR MAP FOR LITTLE BARS/DOTS
	const color = (s: Status) =>
		s === 'submitted'
			? 'bg-green-600' // DON'T TOUCH THIS ONE
			: s === 'review'
				? 'bg-sky-500'
				: s === 'late'
					? 'bg-amber-500'
					: 'bg-neutral-600';
</script>

<section class="w-full">
	<div class="grid w-full gap-4 md:grid-cols-5 md:grid-rows-[repeat(4,minmax(0,1fr))]">
		<div class="rounded-xl bg-zinc-900 p-6 md:col-span-4 md:row-span-3">
			<h2 class="mb-4 text-2xl font-medium text-neutral-800 dark:text-neutral-200">Submissions by Agency</h2>
		</div>
		{#each counties.slice(0, 100) as c}
			<div class="rounded-xl bg-zinc-900 p-5 text-xs text-neutral-300 aspect-video">
				<div class="truncate text-xl">{c.name}</div>
				<div class="mt-2 grid grid-cols-5 gap-1" aria-label="Quarter statuses">
					<!-- {#each c.quarters as s}
					<div class="h-2.5 rounded {color(s)}" title={s}></div>
				{/each} -->
				</div>
			</div>
		{/each}
	</div>
</section>

<!-- <section class="w-full p-6">
  <div
    class="grid h-[min(90dvh,64rem)] w-full gap-3
           md:grid-cols-5
           md:grid-rows-[repeat(5,minmax(0,1fr))]"
  >
   <div class="rounded-xl bg-zinc-900 p-6 md:col-span-4 md:row-span-2">
			<h2 class="mb-4 text-2xl font-medium">Submissions by Agency</h2>
		</div>

    {#each counties.slice(0, 100) as c}
      <div class="rounded-xl bg-zinc-900 p-6 text-xs text-neutral-300 md:row-span-1 md:aspect-auto">
        <div class="truncate text-xl">{c.name}</div>
      </div>
    {/each}
  </div>
</section> -->

