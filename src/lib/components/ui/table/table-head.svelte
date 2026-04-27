<script lang="ts">
	import type { HTMLThAttributes } from "svelte/elements";
	import type { WithElementRef } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLThAttributes> = $props();
</script>

<th
	bind:this={ref}
	class={cn(
		"h-12 bg-[var(--surface-2)] px-3 text-left align-middle text-[11px] font-semibold tracking-[0.04em] text-[var(--text-muted)] uppercase [&:has([role=checkbox])]:pr-0",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</th>
