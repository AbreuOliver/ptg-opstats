<script lang="ts">
	import IconLock from '@tabler/icons-svelte/icons/lock';
	import IconPencil from '@tabler/icons-svelte/icons/pencil';
	import type { PageData } from './$types';
	import { toAgencyPathSegment } from '$lib/features/forms/persistence/agency';

	let { data }: { data: PageData } = $props();
	const agency = $derived.by(() => data.agency ?? '');
	const agencySegment = $derived.by(() => toAgencyPathSegment(agency));
	const singleYear = $derived(data.editableYears.length === 1);
	const historicalYears = $derived(
		data.editableYears.filter((year) => year !== data.currentFiscalYear)
	);
	const historicalEditableYears = $derived(new Set(data.historicalEditableYears ?? []));
</script>

<section class="flex w-full flex-col items-center gap-6 p-8 pb-28">
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
	<div
		class={`grid w-full gap-6 ${
			singleYear
				? 'max-w-xl grid-cols-1 place-items-center'
				: 'max-w-5xl grid-cols-1 sm:grid-cols-2'
		}`}
	>
		{#each data.editableYears as year}
			{@const editable = year === data.currentFiscalYear || historicalEditableYears.has(year)}
			<a
				href={`/forms/${agencySegment}/${year}`}
				class={`group relative flex h-40 items-center justify-center overflow-hidden rounded-xl border border-zinc-300 bg-white/70 px-6 py-9 text-center text-neutral-900 backdrop-blur-md transition hover:border-[var(--theme-color)] hover:bg-[var(--theme-color)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-neutral-100 dark:hover:border-[var(--theme-color)] dark:hover:bg-[var(--theme-color)] dark:hover:text-black ${
					singleYear ? 'w-full sm:w-[28rem]' : 'w-full'
				}`}
				data-sveltekit-preload-data="hover"
			>
				<div class="flex flex-col items-center gap-3">
					<span class="text-2xl font-bold leading-none tracking-tight">FY{year}</span>
					<span
						class="text-base font-medium text-[var(--text-muted)] transition group-hover:text-white dark:group-hover:text-black"
					>
						{year === data.currentFiscalYear ? 'Current' : 'Historical'}
					</span>
					<span
						class={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-normal transition ${
							editable
								? 'bg-[color-mix(in_srgb,#0040e7_12%,white)] text-[#0040e7] group-hover:bg-white/20 group-hover:text-white dark:bg-[color-mix(in_srgb,#8ea2ff_20%,black)] dark:text-[#cbd4ff] dark:group-hover:bg-black/15 dark:group-hover:text-black'
								: 'bg-neutral-200 text-neutral-800 group-hover:bg-white/20 group-hover:text-white dark:bg-neutral-700 dark:text-neutral-100 dark:group-hover:bg-black/15 dark:group-hover:text-black'
						}`}
					>
						{#if editable}
							<IconPencil class="h-5 w-5" />
							Editable
						{:else}
							<IconLock class="h-5 w-5" />
							Read-only
						{/if}
					</span>
				</div>
			</a>
		{/each}
	</div>
</section>
