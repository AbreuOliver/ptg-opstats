<script lang="ts">
	import type { Snippet } from 'svelte';
	import IconChevronDown from '@tabler/icons-svelte/icons/chevron-down';
	import Text from '../atoms/Text.svelte';
	import { slide } from 'svelte/transition';

	let {
		title,
		open = $bindable(true),
		className = '',
		children,
		summaryRight
	}: {
		title: string;
		open?: boolean;
		className?: string;
		children?: Snippet;
		summaryRight?: Snippet;
	} = $props();
</script>

<details class={`group ${className}`} bind:open>
	<summary
		class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-4
           text-sm font-semibold text-[var(--text)] focus:outline-none
           focus-visible:ring-2 focus-visible:ring-[var(--theme-color)] dark:text-zinc-200"
	>
		<div class="flex w-full items-center gap-3">
			<Text
				variant="subheading"
				text={title}
				className="shrink-0 font-semibold px-4 py-2 text-[var(--text)] dark:text-zinc-100 w-[fit-content] grow-1 whitespace-nowrap"
			/>
			<hr class="w-full h-1 bg-[var(--border)] dark:bg-zinc-800 border border-[var(--border)] dark:border-zinc-800 rounded-full" />
		</div>
		<span class="ml-auto flex items-center gap-2 px-4">
			{@render summaryRight?.()}
			<IconChevronDown class="h-5 w-5 transition-transform group-open:rotate-180" />
		</span>
	</summary>
	{#if open}
		<div in:slide={{ duration: 300 }} out:slide={{ duration: 300 }} class="px-4 pt-2">
			{@render children?.()}
		</div>
	{/if}
</details>
