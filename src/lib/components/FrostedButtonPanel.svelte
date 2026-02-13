<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		headingStyle = 'primary',
		children
	}: {
		title: string;
		headingStyle?: 'primary' | 'secondary' | 'tertiary';
		children?: Snippet;
	} = $props();
</script>

<main
	class="relative mx-auto flex min-h-full w-full flex-col justify-center px-6 py-12 shadow-xl bg-[#17191A] mx-"
>
	<!-- Background gradient layer -->
	<div
		class="pointer-events-none absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-white/80 via-white/60 to-neutral-200/40"
	></div>

	<!-- Title -->
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<h2
			class={`text-center text-2xl/9 font-bold tracking-tight 
                ${headingStyle === 'primary' ? 'text-neutral-900' : ''}
                ${headingStyle === 'secondary' ? 'text-neutral-700' : ''}
                ${headingStyle === 'tertiary' ? 'text-neutral-500 italic' : ''}`
            }
		>
			{title}
		</h2>
	</div>

	<!-- Divider -->
	<hr class="mt-8 w-full border-none" />

	<!-- Slot for buttons -->
	<ul class="max-w-2xl space-y-4">
		{@render children?.()}
	</ul>
</main>
