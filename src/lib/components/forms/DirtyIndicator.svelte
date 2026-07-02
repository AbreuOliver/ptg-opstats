<script lang="ts">
	import {
		formSnapshotRevision,
		isSnapshotDirty,
		isSnapshotTouched
	} from '$lib/features/forms/persistence/formDraftRegistry';

	let {
		snapshotKey,
		path = [],
		label = 'Unsaved local changes',
		class: className = ''
	}: {
		snapshotKey: string;
		path?: Array<string | number>;
		label?: string;
		class?: string;
	} = $props();

	const dirty = $derived.by(() => {
		$formSnapshotRevision;
		return isSnapshotTouched(snapshotKey, path) === true || isSnapshotDirty(snapshotKey, path) === true;
	});
</script>

{#if dirty}
	<span
		class={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-amber-500/70 bg-amber-300/20 text-amber-700 shadow-sm dark:border-amber-300/60 dark:bg-amber-300/20 dark:text-amber-200 ${className}`}
		aria-label={label}
		title={label}
		role="img"
	>
		<span class="h-1.5 w-1.5 rounded-full bg-current"></span>
	</span>
{/if}
