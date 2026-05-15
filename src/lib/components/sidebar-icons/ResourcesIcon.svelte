<script lang="ts">
	import IconBooks from '@tabler/icons-svelte/icons/books';
	let { class: className = '' } = $props();
</script>

<IconBooks class={className} aria-hidden="true" />
