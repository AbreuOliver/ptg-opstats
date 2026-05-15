<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

  const availablePaths: string[] = ['urban', 'rural'];
	const isSuperAdmin = $derived(Boolean(page.data?.rbac?.isSuperAdmin));
	const allowedTransitSystems = $derived.by<string[]>(() => {
		const raw = page.data?.rbac?.allowedTransitSystems;
		return Array.isArray(raw) ? raw : [];
	});
	let selectedAgency = $state(page.url.searchParams.get('agency') ?? '');

	function agencyQuery(): string {
		if (!isSuperAdmin || !selectedAgency.trim()) return '';
		return `?agency=${encodeURIComponent(selectedAgency.trim())}`;
	}

	async function setAgency(value: string) {
		selectedAgency = value;
		const query = value.trim() ? `?agency=${encodeURIComponent(value.trim())}` : '';
		await goto(`/forms${query}`, { replaceState: true, keepFocus: true, noScroll: true });
	}
</script>

<div class="grid h-full w-full place-content-center grid-cols-1 gap-6 p-8 sm:grid-cols-2">
	{#if isSuperAdmin}
		<div class="sm:col-span-2 mx-auto w-full max-w-xl">
			<label class="mb-2 block text-sm font-semibold text-[var(--text-muted)]">Transit system</label>
			<select
				class="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)]"
				value={selectedAgency}
				onchange={(e) => setAgency((e.currentTarget as HTMLSelectElement).value)}
			>
				<option value="">Select transit system...</option>
				{#each allowedTransitSystems as system}
					<option value={system}>{system}</option>
				{/each}
			</select>
		</div>
	{/if}

  {#each availablePaths as path}
    <a
      href={`/forms/${path}${agencyQuery()}`}
      class="relative flex items-center justify-center overflow-hidden rounded-xl
             bg-white/70 border border-zinc-300 dark:border-0 dark:border-none backdrop-blur-md dark:bg-zinc-900
             px-6 py-12 text-2xl font-semibold text-neutral-900 dark:text-neutral-100
             transition hover:bg-white/80 dark:hover:bg-zinc-800
             focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500
             h-40 capitalize"
      data-sveltekit-preload-data="hover"
    >{path}</a>
  {/each}
</div>
