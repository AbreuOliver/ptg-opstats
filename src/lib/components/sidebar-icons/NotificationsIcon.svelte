<script lang="ts">
	import IconBell from '@tabler/icons-svelte/icons/bell';
	let { class: className = '' } = $props();
</script>

<IconBell class={className} aria-hidden="true" />
