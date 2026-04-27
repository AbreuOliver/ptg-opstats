<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import type { WithElementRef } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLTableRowElement>> = $props();
</script>

<tr
	bind:this={ref}
	class={cn(
		"border-b border-[var(--border)] transition-colors hover:bg-[color-mix(in_srgb,var(--surface-2)_88%,white)] data-[state=selected]:bg-[var(--surface-2)]",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</tr>
