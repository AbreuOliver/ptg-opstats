<!-- <script lang="ts">
	import Footer from '$lib/components/molecules/Footer.svelte';
	import Header from '$lib/components/molecules/Header.svelte';
	import { page } from '$app/state';
	import '../app.css';

	// let { children } = $props();
</script>

<section class="relative flex w-full max-w-screen h-screen max-h-screen flex-col overflow-hidden bg-neutral-50 dark:bg-neutral-950 rounded-xl font-sans p-6"> -->
<!-- GRID BACKGROUND -->
<!-- <div class="pointer-events-none absolute inset-0 z-0"> -->
<!-- OPTION #1: ORIGINAL GRID -->
<!-- <svg
			class="absolute inset-0 h-full w-full stroke-neutral-400/60 [mask-image:radial-gradient(ellipse_50%_50%_at_center,white,transparent)]"
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
<!-- <svg
			class="absolute inset-0 h-full w-full stroke-neutral-400/60 [mask-image:radial-gradient(ellipse_50%_50%_at_center,white,transparent)]"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
		<defs>
			<pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
				<path d="M 32 0 L 0 0 0 32" fill="none" />
			</pattern>
		</defs>
			<rect width="100%" height="100%" fill="url(#grid)" />
		</svg> -->
<!-- </div> -->
<!-- HEADER, AS LONG AS NOT ON LANDING PAGE -->
<!-- {#if page.url.pathname !== '/'}
		<Header />
	{/if} -->

<!-- <main
		class="relative z-10 mx-auto my-auto flex w-screen h-screen flex-grow items-center justify-center text-center border-3 border-neutral-300 dark:border-neutral-900 rounded-2xl"
	>
		{@render children()}
	</main> -->

<!-- <Footer /> -->
<!-- </section> -->


<!-- ======================= 
 VERSION 2
 -->
<!-- src/routes/+layout.svelte -->
<!-- <script lang="ts">
	import { page } from '$app/state';
	import '../app.css';
	import Header from '$lib/components/molecules/Header.svelte';

	let { children } = $props();

	const landingPage = $derived(page.url.pathname === '/');
	const isHome = $derived(new Set(['/', '/auth']).has(page.url.pathname));

</script>

<section class="grid min-h-svh w-screen bg-neutral-50 p-4 sm:p-6 dark:bg-neutral-950 overflow-hidden">
	<main
		class="flex min-h-0 w-full flex-col items-center overflow-auto rounded-xl border-3 border-neutral-300 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950"
	>
		{#if !landingPage}
			<Header />
		{/if}
		{@render children()}
	</main>
</section> -->


<!-- ======================= 
 VERSION 3
 -->
 <!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { page } from '$app/state';
  import '../app.css';
  import Header from '$lib/components/molecules/Header.svelte';
	import NavTabs from '$lib/components/molecules/NavTabs.svelte';

  let { children } = $props();
  const landingPage = $derived(page.url.pathname === '/');
</script>

<!-- FIX 1: USE A FIXED HEIGHT, NOT *MIN* HEIGHT -->
<section class="grid h-dvh w-full bg-neutral-50 p-4 sm:p-6 dark:bg-neutral-950 overflow-hidden">
  <!-- FRAME: DOESN'T SCROLL; CONTENT INSIDE WILL -->
  <main
    class="flex h-full w-full flex-col overflow-hidden rounded-xl border-[3px]
           border-neutral-300 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950"
  >
    {#if !landingPage}
      <!-- OPTIONAL: PIN HEADER INSIDE FRAME -->
      <Header />
    {/if}

    <!-- FIX 2: THIS IS THE ONLY SCROLL CONTAINER -->
    <div class="flex flex-col justify-start w-full h-full overflow-auto">
      {@render children()}
    </div>
	<NavTabs />
  </main>
</section>


<!-- ======================= 
 VERSION 4
 -->
<!-- src/routes/+layout.svelte -->
<!-- <script lang="ts">
	import { page } from '$app/state';
	import '../app.css';
	import Header from '$lib/components/molecules/Header.svelte';

	let { children } = $props();
	const landingPage = $derived(page.url.pathname === '/');
</script>


<section class="grid h-dvh w-full overflow-hidden bg-neutral-50 p-4 sm:p-6 dark:bg-neutral-950">

	<main
		class="flex h-full w-full flex-col items-center justify-center
           overflow-auto rounded-xl border-[3px] border-neutral-300 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950"
	>
		{#if !landingPage}
			<Header />
		{/if}

		<div class="min-h-0 flex-1 overflow-auto">
			{@render children()}
		</div>
	</main>
</section> -->
