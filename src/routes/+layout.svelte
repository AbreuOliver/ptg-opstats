<script lang="ts">
	import Footer from '$lib/components/molecules/Footer.svelte';
	import Header from '$lib/components/molecules/Header.svelte';
	import { page } from '$app/state';

	let { children } = $props();
</script>

<section class="relative flex min-h-screen w-screen flex-col overflow-x-hidden bg-gray-50">
	<!-- GRID BACKGROUND -->
	<div class="pointer-events-none absolute inset-0 z-0">
		<!-- OPTION #1: ORIGINAL GRID -->
		<!-- <svg
			class="absolute inset-0 h-full w-full stroke-gray-400/60 [mask-image:radial-gradient(ellipse_50%_50%_at_center,white,transparent)]"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
					<path d="M 40 0 L 0 0 0 40" fill="none" />
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#grid)" />
		</svg> -->
		<!-- OPTION #2: DENSER GRID -->
		<svg
			class="absolute inset-0 h-full w-full stroke-gray-400/60 [mask-image:radial-gradient(ellipse_50%_50%_at_center,white,transparent)]"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
		<defs>
			<pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
				<path d="M 32 0 L 0 0 0 32" fill="none" />
			</pattern>
		</defs>
			<rect width="100%" height="100%" fill="url(#grid)" />
		</svg>
	</div>
	<!-- HEADER, AS LONG AS NOT ON LANDING PAGE -->
	{#if page.url.pathname !== '/'}
		<Header />
	{/if}

	<main
		class="relative z-10 mx-auto flex w-full flex-grow items-center justify-center px-6 text-center lg:max-w-7xl lg:px-8"
	>
		{@render children()}
	</main>

	<Footer />
</section>
