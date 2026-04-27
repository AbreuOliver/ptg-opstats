<script lang="ts">
	import { onMount } from 'svelte';
	import { getTheme, toggleTheme } from '$lib/theme';

	let isDark = false;
	onMount(() => {
		isDark = getTheme() === 'dark';
	});
	function handleClick() {
		toggleTheme();
		isDark = !isDark;
	}
</script>

<button
	type="button"
	role="switch"
	aria-label="Toggle dark mode"
	aria-checked={isDark}
	class="inline-flex items-center gap-2 rounded-md px-1 py-1 text-sm text-[var(--text)] transition focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-2"
	onclick={handleClick}
>
	<span
		class={`relative inline-flex h-10 w-20 items-center rounded-full border transition-colors ${
			isDark
				? 'border-[var(--theme-color)] bg-[var(--theme-color)]'
				: 'border-[var(--border)] bg-[#d9d9d9] dark:bg-zinc-700'
		}`}
	>
		<span
			class={`absolute h-8 w-8 rounded-full bg-white shadow-sm transition-transform ${
				isDark ? 'translate-x-10' : 'translate-x-1'
			}`}
		></span>
	</span>
	<span class="min-w-[3rem] text-left font-medium text-[var(--text-muted)]">
		{isDark ? 'Dark' : 'Light'}
	</span>
</button>
