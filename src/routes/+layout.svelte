<script lang="ts">
  import { page } from '$app/state';
  import '../app.css';
  import Header from '$lib/components/AppHeader/Header.svelte';
  import NavTabs from '$lib/components/molecules/NavTabs.svelte';
  import OverlayRoot from '$lib/components/OverlayRoot.svelte';
	import AdminTabs from '$lib/components/molecules/AdminTabs.svelte';

  let { children } = $props();
  const landingPage = $derived(page.url.pathname === '/');
  const adminPage = $derived(page.url.pathname.includes('admin'));
</script>

<section class="app-page grid h-dvh w-full p-4 sm:p-6 overflow-hidden">
  <main
    class="app-surface flex h-full w-full flex-col overflow-hidden rounded-xl border-[3px]
           dark:border-neutral-800 dark:bg-neutral-950"
  >
    {#if !landingPage}
      <Header />
    {/if}
    {#if adminPage}
      <AdminTabs />
    {/if}
    <div class="flex flex-col justify-start w-full h-full p-8 grow overflow-scroll text-[var(--text)] dark:text-neutral-100">
      {@render children()}
    </div>
    <OverlayRoot />
	<NavTabs />
  </main>
</section>


