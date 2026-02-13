<script lang="ts">
	import Heatmap from '$lib/components/HeatmapChart.svelte';
	import { ruralHeatmapSeries } from '$lib/stores/ruralSubmissions.data';
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

	type County = (typeof NC_COUNTIES)[number];

	const STATUS = ['submitted', 'review', 'late', 'missing'] as const;
	type Status = (typeof STATUS)[number];

	type TransitType = 'rural' | 'urban';

	type TransitAgency = {
		/** unique per county+type+name (good for `key` in each blocks) */
		id: string;
		county: County;
		type: TransitType;
		name: string;
		/** optional urban code: ASHEVILLE (201) etc. */
		code?: number;
		/** example: quarterly status history */
		quarters: Status[];
	};

	type CountyTransit = {
		county: County;
		agencies: TransitAgency[];
	};

	// helper to create deterministic fake quarter statuses (you can replace this later)
	const cycleStatuses = (seed: number): Status[] =>
		[0, 1, 2, 3].map((q) => STATUS[(seed + q) % STATUS.length]) as Status[];

	const COUNTY_TRANSIT: Record<County, CountyTransit> = {
		Alamance: {
			county: 'Alamance',
			agencies: [
				{
					id: 'alamance-rural-acta',
					county: 'Alamance',
					type: 'rural',
					name: 'Alamance County Transportation Authority',
					quarters: cycleStatuses(0)
				},
				{
					id: 'alamance-urban-burlington',
					county: 'Alamance',
					type: 'urban',
					name: 'BURLINGTON',
					code: 249,
					quarters: cycleStatuses(1)
				}
			]
		},

		Alexander: {
			county: 'Alexander',
			agencies: [
				{
					id: 'alexander-rural',
					county: 'Alexander',
					type: 'rural',
					name: 'Alexander',
					quarters: cycleStatuses(2)
				}
			]
		},

		Alleghany: {
			county: 'Alleghany',
			agencies: [
				{
					id: 'alleghany-rural',
					county: 'Alleghany',
					type: 'rural',
					name: 'Alleghany County',
					quarters: cycleStatuses(3)
				}
			]
		},

		Anson: {
			county: 'Anson',
			agencies: [
				{
					id: 'anson-rural',
					county: 'Anson',
					type: 'rural',
					name: 'Anson County',
					quarters: cycleStatuses(4)
				}
			]
		},

		Ashe: {
			county: 'Ashe',
			agencies: [
				{
					id: 'ashe-rural',
					county: 'Ashe',
					type: 'rural',
					name: 'Ashe County Transportation Authority, Inc.',
					quarters: cycleStatuses(5)
				}
			]
		},

		Avery: {
			county: 'Avery',
			agencies: [
				{
					id: 'avery-rural',
					county: 'Avery',
					type: 'rural',
					name: 'Avery County Transportation Authority',
					quarters: cycleStatuses(6)
				}
			]
		},

		Beaufort: {
			county: 'Beaufort',
			agencies: [
				{
					id: 'beaufort-rural',
					county: 'Beaufort',
					type: 'rural',
					name: 'Beaufort County Developmental Center Inc.',
					quarters: cycleStatuses(7)
				}
			]
		},

		Bertie: {
			county: 'Bertie',
			agencies: [
				{
					id: 'bertie-rural-choanoke',
					county: 'Bertie',
					type: 'rural',
					name: 'Choanoke Public Transportation Authority',
					quarters: cycleStatuses(8)
				}
			]
		},

		Bladen: {
			county: 'Bladen',
			agencies: [
				{
					id: 'bladen-rural',
					county: 'Bladen',
					type: 'rural',
					name: 'Bladen County',
					quarters: cycleStatuses(9)
				}
			]
		},

		Brunswick: {
			county: 'Brunswick',
			agencies: [
				{
					id: 'brunswick-rural',
					county: 'Brunswick',
					type: 'rural',
					name: 'Brunswick Transit System, Inc.',
					quarters: cycleStatuses(10)
				}
			]
		},

		Buncombe: {
			county: 'Buncombe',
			agencies: [
				{
					id: 'buncombe-rural',
					county: 'Buncombe',
					type: 'rural',
					name: 'Buncombe County',
					quarters: cycleStatuses(11)
				},
				{
					id: 'buncombe-urban-asheville',
					county: 'Buncombe',
					type: 'urban',
					name: 'ASHEVILLE',
					code: 201,
					quarters: cycleStatuses(12)
				}
			]
		},

		Burke: {
			county: 'Burke',
			agencies: [
				{
					id: 'burke-rural',
					county: 'Burke',
					type: 'rural',
					name: 'Burke',
					quarters: cycleStatuses(13)
				},
				{
					id: 'burke-urban-wprta',
					county: 'Burke',
					type: 'urban',
					name: 'WPRTA',
					code: 247,
					quarters: cycleStatuses(14)
				}
			]
		},

		Cabarrus: {
			county: 'Cabarrus',
			agencies: [
				{
					id: 'cabarrus-rural',
					county: 'Cabarrus',
					type: 'rural',
					name: 'Cabarrus County',
					quarters: cycleStatuses(15)
				},
				{
					id: 'cabarrus-urban-concord-kannapolis',
					county: 'Cabarrus',
					type: 'urban',
					name: 'CONCORD/KANNAPOLIS',
					code: 209,
					quarters: cycleStatuses(16)
				}
			]
		},

		// ...continue this pattern for all remaining counties...

		Wake: {
			county: 'Wake',
			agencies: [
				{
					id: 'wake-rural',
					county: 'Wake',
					type: 'rural',
					name: 'Wake County',
					quarters: cycleStatuses(80)
				},
				{
					id: 'wake-urban-cary',
					county: 'Wake',
					type: 'urban',
					name: 'CARY',
					code: 203,
					quarters: cycleStatuses(81)
				},
				{
					id: 'wake-urban-raleigh-cat',
					county: 'Wake',
					type: 'urban',
					name: 'RALEIGH - CAT',
					code: 231,
					quarters: cycleStatuses(82)
				},
				{
					id: 'wake-urban-raleigh-ncsu',
					county: 'Wake',
					type: 'urban',
					name: 'RALEIGH - NCSU',
					code: 233,
					quarters: cycleStatuses(83)
				},
				{
					id: 'wake-urban-morrisville',
					county: 'Wake',
					type: 'urban',
					name: 'MORRISVILLE',
					code: 253,
					quarters: cycleStatuses(84)
				},
				{
					id: 'wake-urban-triangle',
					county: 'Wake',
					type: 'urban',
					name: 'TRIANGLE TRANSIT',
					code: 239,
					quarters: cycleStatuses(85)
				}
			]
		}

		// All other counties that currently have no known agency for your purposes:
		// Franklin: { county: 'Franklin', agencies: [] },
		// etc.
	} as const;

	const counties = NC_COUNTIES.map(
		(name) => COUNTY_TRANSIT[name] ?? { county: name, agencies: [] }
	);

	// OPTIONAL: SIMPLE COLOR MAP FOR LITTLE BARS/DOTS
	const color = (s: Status) =>
		s === 'submitted'
			? 'bg-green-600' // DON'T TOUCH THIS ONE
			: s === 'review'
				? 'bg-[var(--theme-color)]'
				: s === 'late'
					? 'bg-amber-500'
					: 'bg-neutral-600';
</script>

<section class="w-full">
  <div class="grid w-full gap-4 md:grid-cols-6 md:grid-rows-[repeat(4,minmax(0,1fr))]">
    <div
      class="rounded-xl bg-white/70 border border-zinc-300 dark:border-0 dark:border-none
             backdrop-blur-md dark:bg-zinc-900 p-6 md:col-span-6 md:row-span-3"
    >
      <h2 class="mb-4 text-2xl font-medium text-neutral-800 dark:text-neutral-200">
        Submissions by Agency
      </h2>
	  <div class="flex w-full">
      <div class="max-w-1/2 grow-1">
	   <!-- <Heatmap 
	   	title="Rural"
		series={ruralHeatmapSeries}
	   />
	   </div>
	     <div class="max-w-1/2 grow-1">
	   <Heatmap 
	   	title="Urban"
		series={urba}
	   /> -->
	   </div>
	   </div>
    </div>

    {#each counties as c}
      <div
        class="rounded-xl bg-white/70 border border-zinc-300 dark:border-0 dark:border-none
               backdrop-blur-md dark:bg-zinc-900 p-5 text-xs text-neutral-300 col-span-2"
      >
        <div class="truncate text-xl text-zinc-800 dark:text-zinc-200">
          {c.county}
        </div>

        {#if c.agencies.length === 0}
          <p class="mt-2 text-[0.7rem] text-neutral-500">
            No transit agency listed.
          </p>
        {:else}
          <ul class="mt-2 space-y-1">
            {#each c.agencies as agency}
              <li class="flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <div class="truncate text-[0.75rem]">
                    {agency.name}
                    {#if agency.code}
                      <span class="text-[0.65rem] text-neutral-500">
                        ({agency.code})
                      </span>
                    {/if}
                  </div>
                  <div class="text-[0.65rem] uppercase tracking-wide text-neutral-500">
                    {agency.type}
                  </div>
                </div>
                <div class="flex gap-0.5">
                  {#each agency.quarters as s}
                    <span
                      class="h-2.5 w-2.5 rounded-full {color(s)}"
                      title={s}
                    ></span>
                  {/each}
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/each}
  </div>
</section>
