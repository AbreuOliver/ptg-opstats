<script lang="ts">
	import IconTable from '@tabler/icons-svelte/icons/table';
	let { class: className = '' } = $props();
</script>

<IconTable class={className} aria-hidden="true" />
