<script lang="ts">
	import IconSparkles from '@tabler/icons-svelte/icons/sparkles';
	let { class: className = '' } = $props();
</script>

<IconSparkles class={className} aria-hidden="true" />
