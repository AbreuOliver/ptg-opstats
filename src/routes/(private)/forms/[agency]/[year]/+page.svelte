<script lang="ts">
	import type { PageData } from './$types';
	import { toAgencyPathSegment } from '$lib/features/forms/persistence/agency';

	let { data }: { data: PageData } = $props();
	const agency = $derived.by(() => data.agency ?? '');
	const agencySegment = $derived.by(() => toAgencyPathSegment(agency));
</script>

<section class="flex h-full w-full flex-col items-center justify-center gap-6 p-8">
	<!-- <div class="space-y-2 text-center">
		<p class="text-sm text-[var(--text-muted)]">Transit system selected:</p>
		<h1 class="text-xl font-semibold text-[var(--text)]">{agency}</h1>
		<p class="text-sm text-[var(--text-muted)]">Fiscal year: FY{data.year}</p>
		<p class="text-sm text-[var(--text-muted)]">Select service type.</p>
	</div> -->

	<div class="grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2">
    <div class="flex-col">
        <a
            href={data.allowsUrban ? `/forms/${agencySegment}/${data.year}/urban` : undefined}
            class="relative flex h-40 items-center justify-center overflow-hidden rounded-xl border border-zinc-300 px-6 py-12 text-2xl font-semibold backdrop-blur-md transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] dark:bg-zinc-900 dark:text-neutral-100 {data.allowsUrban
                ? 'border-zinc-300 bg-white/70 text-neutral-900 hover:border-[var(--theme-color)] hover:bg-[var(--theme-color)] hover:text-white dark:border-zinc-700 dark:hover:border-[var(--theme-color)] dark:hover:bg-[var(--theme-color)] dark:hover:text-black'
                : 'cursor-not-allowed border-zinc-300 bg-zinc-100 text-zinc-400 dark:border-0 dark:bg-zinc-800 dark:text-zinc-500'}"
            data-sveltekit-preload-data="hover"
            aria-disabled={!data.allowsUrban}
            tabindex={data.allowsUrban ? undefined : -1}
        >
            Urban
        </a>
        <p>
            {#if !data.allowsUrban}
                <span class="mt-2 block text-center text-sm font-normal text-zinc-500"
                    >Not available for this system</span
                >
            {/if}
        </p>
    </div>
    <div class="flex-col">
        <a
            href={data.allowsRural ? `/forms/${agencySegment}/${data.year}/rural` : undefined}
            class="relative flex h-40 items-center justify-center overflow-hidden rounded-xl border border-zinc-300 px-6 py-12 text-2xl font-semibold backdrop-blur-md transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] dark:bg-zinc-900 dark:text-neutral-100 {data.allowsRural
                ? 'border-zinc-300 bg-white/70 text-neutral-900 hover:border-[var(--theme-color)] hover:bg-[var(--theme-color)] hover:text-white dark:border-zinc-700 dark:hover:border-[var(--theme-color)] dark:hover:bg-[var(--theme-color)] dark:hover:text-black'
                : 'cursor-not-allowed border-zinc-300 bg-zinc-100 text-zinc-400 dark:border-0 dark:bg-zinc-800 dark:text-zinc-500'}"
            data-sveltekit-preload-data="hover"
            aria-disabled={!data.allowsRural}
            tabindex={data.allowsRural ? undefined : -1}
        >
            Rural
        </a>
        <p>
            {#if !data.allowsRural}
                <span class="mt-2 block text-center text-sm font-normal text-zinc-500"
                    >Not available for this system</span
                >
            {/if}
        </p>
    </div>
</div>
</section>
