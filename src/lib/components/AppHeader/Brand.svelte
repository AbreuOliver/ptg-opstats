<script lang="ts">
    import Logo from '$lib/components/atoms/Logo.svelte';
</script>

<div class="justify-items flex min-w-fit items-center">
	<a
		class="flex pl-1 text-xl font-semibold text-black/70 dark:text-white/70 focus:opacity-80 focus:outline-hidden hover:text-(--theme-color)"
		href="/"
		aria-label="NC OpStats Logo"
	>
		<svg class="h-6 w-auto mr-2.5 mt-1 hover:text-(--theme-color)" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 22.5a4.75 4.75 0 0 1 3.5-3.5a4.75 4.75 0 0 1-3.5-3.5a4.75 4.75 0 0 1-3.5 3.5a4.75 4.75 0 0 1 3.5 3.5M12 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 10h18M10 3v18"/>
		</svg>
		<h1 class="whitespace-nowrap font-bold text-2xl hover:text-(--theme-color)">NC OpStats</h1>
	</a>
</div>
