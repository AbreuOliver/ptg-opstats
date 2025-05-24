<script context="module" lang="ts">
	import ITRELogo from '$lib/components/atoms/ITRELogo.svelte';

	const currentYear = new Date().getFullYear();
</script>

<footer class="z-10 flex min-h-12 w-full items-center justify-center py-4">
    <ITRELogo height="md" marginRight="lg" />
    <p class="text-sm text-gray-500">
        <span class="mr-2">&copy; {currentYear}</span> Institute for Transportation Research and Education.
        All rights reserved.
    </p>
</footer>