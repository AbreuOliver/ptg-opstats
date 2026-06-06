<script lang="ts">
	import { onMount } from 'svelte';
	import DarkModeToggle from '$lib/components/atoms/DarkModeToggle.svelte';
	import {
		DEFAULT_THEME_COLOR,
		THEME_COLORS,
		getThemeColor,
		setThemeColor,
		type ThemeColor
	} from '$lib/theme';

	let selectedThemeColor: ThemeColor = DEFAULT_THEME_COLOR;

	onMount(() => {
		selectedThemeColor = getThemeColor();
		setThemeColor(selectedThemeColor);
	});

	function handleThemeColorSelect(color: ThemeColor) {
		selectedThemeColor = color;
		setThemeColor(color);
	}
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
	<div
		class="rounded-lg border border-[var(--border)] bg-[var(--surface-1)] p-4 text-[var(--text)]"
	>
		<div class="flex flex-col gap-4">
			<div class="space-y-0.5">
				<h2 class="text-base font-semibold">Theme Color</h2>
				<p class="text-sm text-[var(--text-muted)]">Choose the app accent color.</p>
			</div>
			<div class="flex flex-wrap gap-3" role="radiogroup" aria-label="Theme color">
				{#each THEME_COLORS as color}
					<button
						type="button"
						role="radio"
						aria-label={`Use ${color} as the theme color`}
						aria-checked={selectedThemeColor === color}
						class={`h-12 w-12 rounded-full border-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-color)] ${
							selectedThemeColor === color
								? 'border-[var(--text)] ring-2 ring-[var(--theme-color)] ring-offset-2 ring-offset-[var(--surface-1)]'
								: 'border-[var(--border)] hover:border-[var(--text-muted)]'
						}`}
						style={`background-color: ${color}`}
						onclick={() => handleThemeColorSelect(color)}
					>
						<span class="sr-only">{color}</span>
					</button>
				{/each}
			</div>
		</div>
	</div>
</section>
