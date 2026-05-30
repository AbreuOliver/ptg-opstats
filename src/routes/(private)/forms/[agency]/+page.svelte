<script lang="ts">
	import type { PageData } from './$types';
	import { toAgencyPathSegment } from '$lib/features/forms/persistence/agency';

	let { data }: { data: PageData } = $props();
	const agency = $derived.by(() => data.agency ?? '');
	const agencySegment = $derived.by(() => toAgencyPathSegment(agency));
	const singleYear = $derived(data.editableYears.length === 1);
	const historicalYears = $derived(
		data.editableYears.filter((year) => year !== data.currentFiscalYear)
	);
</script>

<section class="flex h-full w-full flex-col items-center justify-center gap-6 p-8">
	<!-- <div class="space-y-2 text-center">
		<p class="text-sm text-[var(--text-muted)]">Transit system selected:</p>
		<h1 class="text-xl font-semibold text-[var(--text)]">{agency}</h1>
		<p class="text-sm text-[var(--text-muted)]">Select fiscal year.</p>
		<p class="w-lg text-xs text-[var(--text-muted)]">
			Historical years are view-only. Only the current fiscal year is editable.
		</p>
		<p class="w-lg text-xs text-[var(--text-muted)]">
			Available historical years:
			{#if historicalYears.length > 0}
				FY{historicalYears.join(', FY')}
			{:else}
				None found for this agency.
			{/if}
		</p>
	</div> -->
	<div class="mt-[20rem]"></div>
	<div
		class={`mt-[40rem] grid w-full gap-6 ${
			singleYear
				? 'max-w-xl grid-cols-1 place-items-center'
				: 'max-w-5xl grid-cols-1 sm:grid-cols-2'
		}`}
	>
		{#each data.editableYears as year}
			<a
				href={`/forms/${agencySegment}/${year}`}
				class={`relative flex h-40 items-center justify-center overflow-hidden rounded-xl border border-zinc-300 bg-white/70 px-6 py-12 text-2xl font-semibold text-neutral-900 backdrop-blur-md transition hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] dark:border-0 dark:bg-zinc-900 dark:text-neutral-100 dark:hover:bg-zinc-800 ${
					singleYear ? 'w-full sm:w-[28rem]' : 'w-full'
				}`}
				data-sveltekit-preload-data="hover"
			>
				<div class="flex flex-col items-center gap-1">
					<span>FY{year}</span>
					<span class="text-sm font-medium text-[var(--text-muted)]">
						{year === data.currentFiscalYear ? 'Current (Editable)' : 'Historical (Read-only)'}
					</span>
				</div>
			</a>
		{/each}
	</div>
</section>
