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
	class="grid h-9 w-9 place-items-center rounded-md text-neutral-400 dark:text-neutral-200 hover:bg-neutral-800"
	aria-label="Toggle theme"
	aria-pressed={isDark}
	on:click={handleClick}
>
	{#if isDark}
		<!-- sun icon -->
		<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
			><path
				fill="currentColor"
				d="M12 19a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1m-4.95-2.05a1 1 0 0 1 0 1.414l-1.414 1.414a1 1 0 1 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 0m11.314 0l1.414 1.414a1 1 0 0 1-1.414 1.414l-1.414-1.414a1 1 0 0 1 1.414-1.414m-5.049-9.836a5 5 0 1 1-2.532 9.674a5 5 0 0 1 2.532-9.674M4 11a1 1 0 0 1 0 2H2a1 1 0 0 1 0-2zm18 0a1 1 0 0 1 0 2h-2a1 1 0 0 1 0-2zM5.636 4.222L7.05 5.636A1 1 0 0 1 5.636 7.05L4.222 5.636a1 1 0 0 1 1.414-1.414m14.142 0a1 1 0 0 1 0 1.414L18.364 7.05a1 1 0 0 1-1.414-1.414l1.414-1.414a1 1 0 0 1 1.414 0M12 1a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V2a1 1 0 0 1 1-1"
			/></svg
		>
	{:else}
		<!-- moon icon -->
		<svg viewBox="0 0 24 24" class="h-5 w-5"
			><path fill="currentColor" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" /></svg
		>
	{/if}
</button>
