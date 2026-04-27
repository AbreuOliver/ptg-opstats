<script lang="ts">
	import type { HTMLTableAttributes } from "svelte/elements";
	import type { WithElementRef } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLTableAttributes> = $props();
</script>

<div class="relative w-full overflow-auto border border-[var(--border)] bg-[var(--surface-1)]">
	<table
		bind:this={ref}
		class={cn("w-full caption-bottom text-[13px] text-[var(--text)]", className)}
		{...restProps}
	>
		{@render children?.()}
	</table>
</div>
