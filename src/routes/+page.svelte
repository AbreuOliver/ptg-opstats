<script context="module">
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
		<div class="mx-auto mt-8 flex w-full max-w-2xl flex-col justify-center px-6 py-12 lg:px-8 text-center">
			<!-- CAPTION -->
			<span class="text-base font-semibold tracking-wider text-red-600 dark:text-red-700">Streamlined Reporting</span>

			<VSpacer size="sm" />
			<div class="flex w-full items-center justify-center gap-4">
				<Logo height="2xl" />
				<img
					src="https://ik.imagekit.io/bip1v395ybp/NC%20OpStats_FfbcCBWR5.svg?updatedAt=1759500919033"
					alt="OpStats Web Form"
					class="mt-2 h-12"
				/>
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
				class="inline-flex h-14 w-full items-center justify-center rounded-md border-zinc-700 bg-zinc-800 px-6 text-lg text-neutral-100 hover:border-2 hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 capitalize"
				data-sveltekit-preload-data="hover"
			>
				Get started
			</a>

			<!-- <StyledButton href="/auth" text="Login to Get Started" variant="primary" /> -->
		</div>
	</div>
</section>
