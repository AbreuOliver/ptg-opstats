<script lang="ts">
	import DarkModeToggle from '$lib/components/atoms/DarkModeToggle.svelte';
</script>

<section class="flex flex-col gap-3 p-2">
	<h1
		class="text-2xl font-bold tracking-wide text-[var(--theme-color)] dark:text-[var(--accent-color)]"
	>
		Appearance
	</h1>
	<div
		class="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4 text-[var(--text)]"
	>
		<div class="flex items-center justify-between gap-3">
			<div class="space-y-0.5">
				<h2 class="text-base font-semibold">Theme</h2>
				<p class="text-sm text-[var(--text-muted)]">Switch between light and dark mode.</p>
			</div>
			<DarkModeToggle />
		</div>
	</div>

</section>
