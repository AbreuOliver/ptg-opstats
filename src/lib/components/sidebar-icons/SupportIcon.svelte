<script lang="ts">
	import IconLifebuoy from '@tabler/icons-svelte/icons/lifebuoy';
	let { class: className = '' } = $props();
</script>

<IconLifebuoy class={className} aria-hidden="true" />
