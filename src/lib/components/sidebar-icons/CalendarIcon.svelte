<script lang="ts">
	import IconCalendarEvent from '@tabler/icons-svelte/icons/calendar-event';
	let { class: className = '' } = $props();
</script>

<IconCalendarEvent class={className} aria-hidden="true" />
