<script lang="ts">
	import IconSchool from '@tabler/icons-svelte/icons/school';
	let { class: className = '' } = $props();
</script>

<IconSchool class={className} aria-hidden="true" />
