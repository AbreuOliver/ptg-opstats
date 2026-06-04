<script lang="ts">
	type Tab = {
		label: string;
		href: string;
		active?: boolean;
	};

	let { tabs = [] }: { tabs?: Tab[] } = $props();
</script>

{#if tabs.length}
	<nav
		class="flex h-14 min-w-0 shrink-0 items-stretch gap-0 overflow-x-auto border-t border-b border-[var(--border)] bg-[var(--surface-2)] dark:border-zinc-700 dark:bg-[var(--surface-1)]"
		data-sveltekit-preload-code="hover"
		data-sveltekit-preload-data="hover"
	>
		{#each tabs as tab}
			<a
				href={tab.href}
				aria-current={tab.active ? 'page' : undefined}
				class="relative -mb-px flex h-full min-w-max items-center justify-center border-r border-[var(--border)] px-5 text-[13px] font-normal whitespace-nowrap transition-colors focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--theme-color)] dark:border-zinc-700 {tab.active
					? 'bg-[var(--surface-1)] font-semibold text-[#161616] before:absolute before:bottom-0 before:left-0 before:h-[2px] before:w-full before:bg-[var(--theme-color)] after:absolute after:top-0 after:left-0 after:h-px after:w-full after:bg-[var(--surface-1)] dark:bg-[var(--surface-1)] dark:text-[#f4f4f4] dark:after:bg-[var(--surface-1)]'
					: 'bg-[var(--surface-2)] text-[#525252] hover:bg-[#dcdcdc] hover:text-[#161616] dark:bg-[#393939] dark:text-[#c6c6c6] dark:hover:bg-[#525252] dark:hover:text-[#f4f4f4]'}"
			>
				{tab.label}
			</a>
		{/each}
	</nav>
{/if}
