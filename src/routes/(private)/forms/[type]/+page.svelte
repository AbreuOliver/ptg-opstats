<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const singleYear = $derived(data.editableYears.length === 1);
</script>

<section class="flex h-full mt-40 w-full flex-col items-center justify-center gap-6 p-8">
	<div class="space-y-2 text-center">
		<p class="text-sm text-[var(--text-muted)]">
			Select fiscal year to edit.
		</p>
		<p class="text-xs text-[var(--text-muted)] w-lg">
            During July through September,
			you can also edit the previous fiscal year to complete closeout submissions.
		</p>
	</div>

	<div
		class={`grid w-full mt-half gap-6 ${
			singleYear ? 'max-w-xl grid-cols-1 place-items-center' : 'max-w-5xl grid-cols-1 sm:grid-cols-2'
		}`}
	>
		{#each data.editableYears as year}
			<a
				href={`/forms/${data.type}/${year}/overview`}
				class={`relative flex h-40 items-center justify-center overflow-hidden rounded-xl border border-zinc-300 bg-white/70 px-6 py-12 text-2xl font-semibold text-neutral-900 backdrop-blur-md transition hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] dark:border-0 dark:bg-zinc-900 dark:text-neutral-100 dark:hover:bg-zinc-800 ${
					singleYear ? 'w-full sm:w-[28rem]' : 'w-full'
				}`}
				data-sveltekit-preload-data="hover"
			>
				<div class="flex flex-col items-center gap-1">
					<span>FY{year}</span>
					<span class="text-sm font-medium text-[var(--text-muted)]">
						{year === data.currentFiscalYear ? 'Current' : 'Prior FY'}
					</span>
				</div>
			</a>
		{/each}
	</div>
</section>
