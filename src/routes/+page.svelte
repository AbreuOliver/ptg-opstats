<script module>
	import Logo from '$lib/components/atoms/Logo.svelte';
	import VSpacer from '$lib/components/atoms/VSpacer.svelte';
</script>

<section
	class="relative max-w-1/2 mx-auto my-auto flex flex-col overflow-hidden rounded-xl bg-white/70 shadow-xl backdrop-blur-md dark:bg-[#17191A]"
>
	<div
		class="relative z-10 flex w-full max-w-7xl flex-grow flex-col items-center justify-center px-6 text-center lg:px-8"
	>
		<!-- HERO SECTION CENTERED -->
		<div class="mx-auto mt-8 flex w-full max-w-3xl flex-col justify-center px-6 py-12 lg:px-8 text-center">
			<!-- CAPTION -->
			<span class="text-base font-semibold tracking-wider text-[var(--theme-color)] dark:text-[var(--theme-color)]">Streamlined Reporting</span>

			<VSpacer size="sm" />
			<div class="flex w-full items-center justify-center gap-4 ">
				<svg class="h-[4rem] w-auto" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
				<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 22.5a4.75 4.75 0 0 1 3.5-3.5a4.75 4.75 0 0 1-3.5-3.5a4.75 4.75 0 0 1-3.5 3.5a4.75 4.75 0 0 1 3.5 3.5M12 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 10h18M10 3v18"/>
				</svg>
				<h1 class="whitespace-nowrap font-[800] text-[4.5rem]">NC OpStats</h1>
			</div>

			<VSpacer size="sm" />

			<!-- SUBHEADING -->
			<h2
				class="mb-4 text-xl leading-9 font-medium tracking-tight text-neutral-700 dark:text-neutral-200 px-6"
			>
				Submit operational transportation data with ease
			</h2>

			<VSpacer size="lg" />

			<a
				href="/auth"
				class="inline-flex h-14 w-full items-center justify-center rounded-md border-zinc-700 bg-zinc-800 px-6 text-lg text-neutral-100 hover:border-2 hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] capitalize"
				data-sveltekit-preload-data="hover"
			>
				Get started
			</a>

			<!-- <StyledButton href="/auth" text="Login to Get Started" variant="primary" /> -->
		</div>
	</div>
</section>
