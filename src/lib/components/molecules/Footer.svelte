<script context="module" lang="ts">
	import ITRELogo from '$lib/components/atoms/ITRELogo.svelte';

	const currentYear = new Date().getFullYear();
</script>

<footer class="z-10 flex min-h-12 w-full items-center justify-center py-4">
    <a href="https://itre.ncsu.edu/" target="_blank" class="flex items-center">
    <ITRELogo height="md" marginRight="md" />
    <p class="text-sm text-neutral-500 hover:underline hover:text-indigo-600">
        <span class="mr-2">&copy; {currentYear}</span> Institute for Transportation Research and Education.
        All rights reserved.
    </p>
    </a>
</footer>