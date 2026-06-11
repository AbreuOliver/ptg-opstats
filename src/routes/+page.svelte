<script module>
	import StyledButton from '$lib/components/StyledButton.svelte';
	import IconTableSpark from '@tabler/icons-svelte/icons/table-spark';
</script>

<section
	class="relative mx-auto my-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-xl border-2 border-neutral-600/20 bg-white/70 shadow-xl backdrop-blur-md dark:bg-[#17191A]"
>
	<div
		class="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/80 via-white/60 to-[color-mix(in_srgb,var(--theme-color)_12%,white)]"
	></div>

	<div
		class="relative z-10 flex w-full cursor-default flex-col items-center justify-center px-8 py-14 text-center lg:px-12"
	>
		<span
			class="text-sm font-bold tracking-[0.22em] text-[var(--theme-color)] uppercase dark:text-[var(--theme-color)]"
			>Streamlined Reporting</span
		>

		<div class="mt-9 flex w-full items-center justify-center gap-5">
			<IconTableSpark class="h-16 w-16 shrink-0 text-neutral-900 dark:text-neutral-100" />
			<h1
				class="text-6xl font-bold tracking-tight whitespace-nowrap text-neutral-950 dark:text-neutral-50"
			>
				NC OpStats
			</h1>
		</div>

		<p
			class="mt-8 text-xl leading-8 font-medium tracking-tight text-neutral-700 dark:text-neutral-200"
		>
			Submit operational transportation data with ease.
		</p>

		<p class="mt-5 max-w-xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
			A centralized reporting workspace for North Carolina transit agencies to manage forms, review
			data, and stay aligned across reporting cycles.
		</p>

		<StyledButton
			href="/auth"
			text="Get Started"
			variant="primary"
			extraClass="mt-10 h-14 w-full max-w-lg border border-neutral-950 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2"
		/>
	</div>
</section>
