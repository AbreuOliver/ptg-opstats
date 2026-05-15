<!-- src/lib/components/atoms/Checkbox.svelte -->
<script lang="ts">
	/// <reference types="svelte" />
	import IconCheck from '@tabler/icons-svelte/icons/check';
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
		onchange = undefined,
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
		onchange?: ((e: Event) => void) | undefined;
		children?: Snippet; // 👈 default slot as a snippet
	} = $props();

	const S = {
		sm: { box: 'h-4 w-4', icon: 'h-3 w-3', left: 'left-0.5' },
		md: { box: 'h-5 w-5', icon: 'h-3.5 w-3.5', left: 'left-[3px]' },
		lg: { box: 'h-6 w-6', icon: 'h-4 w-4', left: 'left-1' }
	}[size] ?? { box: 'h-5 w-5', icon: 'h-3.5 w-3.5', left: 'left-[3px]' };

	function onKeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		if (disabled) return;
		checked = !checked;
	}
</script>

<label class={`relative inline-flex cursor-pointer items-center gap-2 select-none ${className}`}>
	<input
		{id}
		{name}
		type="checkbox"
		bind:checked
		{disabled}
		{required}
		{onchange}
		onkeydown={onKeydown}
		class={`peer ${S.box} appearance-none rounded-[2px] border
            border-[var(--border)] bg-[var(--surface-1)] text-[var(--text)]
            checked:border-[var(--theme-color)] checked:bg-[var(--theme-color)]
            focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--theme-color)] focus-visible:outline-offset-1
            disabled:cursor-not-allowed disabled:opacity-60
            dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 ${inputClass}`}
	/>

	<IconCheck
		class={`pointer-events-none absolute ${S.left} ${S.icon} text-white opacity-0 peer-checked:opacity-100`}
		stroke={3}
		aria-hidden="true"
	/>

	<span class={`px-2 text-[var(--text)] dark:text-zinc-200 ${labelClass}`}>
		{#if children}
			{@render children()}
		{:else}
			{label}
		{/if}
	</span>
</label>
