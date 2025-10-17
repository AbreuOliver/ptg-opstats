<!-- src/lib/components/atoms/Checkbox.svelte -->
<script lang="ts">
	/// <reference types="svelte" />
	import type { Snippet } from 'svelte';

	let {
		label = '',
		checked = $bindable(false),
		disabled = false,
		required = false,
		name,
		id,
		size = 'md',
		class: className = '',
		inputClass = '',
		labelClass = '',
		// DEFAULT SLOT IN RUNES MODE
		children
	}: {
		label?: string;
		checked?: boolean;
		disabled?: boolean;
		required?: boolean;
		name?: string;
		id?: string;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
		inputClass?: string;
		labelClass?: string;
		children?: Snippet; // 👈 default slot as a snippet
	} = $props();

	const S = {
		sm: { box: 'h-4 w-4', icon: 'h-3 w-3', left: 'left-0.5' },
		md: { box: 'h-6 w-6', icon: 'h-4 w-4', left: 'left-1' },
		lg: { box: 'h-7 w-7', icon: 'h-5 w-5', left: 'left-1.5' }
	}[size] ?? { box: 'h-6 w-6', icon: 'h-4 w-4', left: 'left-1' };
</script>

<label class={`relative inline-flex cursor-pointer items-center gap-2 select-none ${className}`}>
	<input
		{id}
		{name}
		type="checkbox"
		bind:checked
		{disabled}
		{required}
		class={`peer ${S.box} appearance-none rounded-md border-2
            border-zinc-300 bg-white
            checked:border-transparent checked:bg-red-600
            focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600
            disabled:cursor-not-allowed disabled:opacity-60
            dark:border-zinc-600 dark:bg-zinc-800 ${inputClass}`}
	/>

	<svg
		class={`pointer-events-none absolute ${S.left} ${S.icon} fill-white opacity-0
            peer-checked:opacity-100`}
		viewBox="0 0 512 512"
		aria-hidden="true"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M17.47 250.9C88.82 328.1 158 397.6 224.5 485.5c72.3-143.8 146.3-288.1 268.4-444.37L460 26.06C356.9 135.4 276.8 238.9 207.2 361.9c-48.4-43.6-126.62-105.3-174.38-137z"
		/>
	</svg>

	<span class={`px-2 ${labelClass}`}>
		{#if children}
			{@render children()}
		{:else}
			{label}
		{/if}
	</span>
</label>
