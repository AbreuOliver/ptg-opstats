<script lang="ts">
	import type { Snippet } from 'svelte';
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
           text-sm font-semibold text-zinc-800 focus:outline-none
           focus-visible:ring-2 focus-visible:ring-red-600 dark:text-zinc-200"
	>
		<div class="flex w-full items-center gap-3">
			<Text
				variant="subheading"
				text={title}
				className="shrink-0 font-semibold px-4 py-2 text-zinc-800 dark:text-zinc-100 w-[fit-content] grow-1 whitespace-nowrap"
			/>
			<hr class="w-full h-1 bg-zinc-400 dark:bg-zinc-800 border-2 border-zinc-400 dark:border-zinc-800 rounded-full" />
		</div>
		<span class="ml-auto flex items-center gap-2 px-4">
			{@render summaryRight?.()}
			<svg
				class="h-5 w-5 transition-transform group-open:rotate-180"
				viewBox="0 0 24 24"
				fill="currentColor"
			>
				<path
					fill="currentColor"
					d="M18 9c.852 0 1.297.986.783 1.623l-.076.084l-6 6a1 1 0 0 1-1.32.083l-.094-.083l-6-6l-.083-.094l-.054-.077l-.054-.096l-.017-.036l-.027-.067l-.032-.108l-.01-.053l-.01-.06l-.004-.057v-.118l.005-.058l.009-.06l.01-.052l.032-.108l.027-.067l.07-.132l.065-.09l.073-.081l.094-.083l.077-.054l.096-.054l.036-.017l.067-.027l.108-.032l.053-.01l.06-.01l.057-.004z"
				/></svg
			>
		</span>
	</summary>
	{#if open}
		<div in:slide={{ duration: 300 }} out:slide={{ duration: 300 }} class="px-4 pt-2">
			{@render children?.()}
		</div>
	{/if}
</details>
