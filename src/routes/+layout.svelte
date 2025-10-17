<script lang="ts">
  import { page } from '$app/state';
  import '../app.css';
  import Header from '$lib/components/AppHeader/Header.svelte';
  import NavTabs from '$lib/components/molecules/NavTabs.svelte';
  import OverlayRoot from '$lib/components/OverlayRoot.svelte';

  let { children } = $props();
  const landingPage = $derived(page.url.pathname === '/');
</script>

<section class="grid h-dvh w-full bg-neutral-50 p-4 sm:p-6 dark:bg-neutral-950 overflow-hidden">
  <main
    class="flex h-full w-full flex-col overflow-hidden rounded-xl border-[3px]
           border-neutral-300 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950"
  >
    {#if !landingPage}
      <Header />
    {/if}
    <div class="flex flex-col justify-start w-full h-full p-8 grow overflow-scroll">
      {@render children()}
    </div>
    <OverlayRoot />
	<NavTabs />
  </main>
</section>



